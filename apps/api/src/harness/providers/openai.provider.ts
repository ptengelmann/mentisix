import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AgentResponseSchema } from '../action.schema.js';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

const SCHEMA = zodToJsonSchema(AgentResponseSchema, {
  name: 'AgentResponse',
  $refStrategy: 'none',
});

@Injectable()
export class OpenAIProvider implements ModelProvider {
  readonly id = 'openai' as const;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const client = new OpenAI({ apiKey: input.apiKey });

    const completion = await client.chat.completions.create({
      model: input.model,
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'AgentResponse',
          schema: schemaForOpenAI(SCHEMA),
          strict: true,
        },
      },
    });

    const choice = completion.choices[0];
    const content = choice?.message.content;
    if (!content) throw new Error('openai: empty completion content');

    const parsed = AgentResponseSchema.parse(JSON.parse(content));
    return {
      response: parsed,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }
}

/**
 * OpenAI strict JSON Schema requires top-level `additionalProperties: false`
 * on every object and all keys in `required`. zod-to-json-schema is mostly
 * there; we normalize what differs.
 */
function schemaForOpenAI(schema: ReturnType<typeof zodToJsonSchema>): Record<string, unknown> {
  const out = JSON.parse(JSON.stringify(schema));
  walk(out);
  return out;
}

function walk(node: unknown): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (obj.type === 'object') {
    if (!('additionalProperties' in obj)) obj.additionalProperties = false;
    if (obj.properties && typeof obj.properties === 'object') {
      obj.required = Object.keys(obj.properties as Record<string, unknown>);
      for (const v of Object.values(obj.properties as Record<string, unknown>)) walk(v);
    }
  }
  if (Array.isArray(obj.anyOf)) for (const v of obj.anyOf) walk(v);
  if (Array.isArray(obj.oneOf)) for (const v of obj.oneOf) walk(v);
  if (Array.isArray(obj.allOf)) for (const v of obj.allOf) walk(v);
  if (obj.items) walk(obj.items);
}
