import { Injectable } from '@nestjs/common';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

/**
 * Deterministic stateless test provider. Builds a response that
 * satisfies whatever JSON Schema the harness hands it this turn, so
 * the same provider works across every challenge. Useful for
 * integration tests and local dev.
 */
@Injectable()
export class MockProvider implements ModelProvider {
  readonly id = 'mock' as const;

  async generate<T = unknown>(input: GenerateInput): Promise<GenerateOutput<T>> {
    const stepMatch = input.user.match(/STEP\s+(\d+)/);
    const turnMatch = input.user.match(/TURN\s+(\d+)/);
    const step = stepMatch?.[1]
      ? Number.parseInt(stepMatch[1], 10)
      : turnMatch?.[1]
        ? Number.parseInt(turnMatch[1], 10)
        : 0;
    const response = buildMockResponse(input.responseSchema.jsonSchema, step) as T & {
      reasoning: string;
    };
    return { response, tokensUsed: 12 };
  }
}

function buildMockResponse(schema: Record<string, unknown>, step: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!properties) return out;
  for (const [name, def] of Object.entries(properties)) {
    out[name] = mockValueFor(name, def, step);
  }
  return out;
}

function mockValueFor(name: string, def: Record<string, unknown>, step: number): unknown {
  if (Array.isArray(def.enum)) {
    const choices = def.enum as readonly unknown[];
    const choice = choices[step % choices.length];
    if (choice !== undefined) return choice;
    return choices[0];
  }
  const type = def.type;
  if (type === 'string') {
    if (name === 'reasoning') return `mock turn ${step}`;
    return 'ok';
  }
  if (type === 'integer' || type === 'number') return step;
  if (type === 'boolean') return false;
  if (type === 'array') return [];
  if (type === 'object') {
    const inner = (def.properties as Record<string, Record<string, unknown>>) ?? {};
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(inner)) obj[k] = mockValueFor(k, v, step);
    return obj;
  }
  return null;
}
