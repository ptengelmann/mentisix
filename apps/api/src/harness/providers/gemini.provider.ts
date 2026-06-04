import { GoogleGenAI, Type } from '@google/genai';
import { Injectable } from '@nestjs/common';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

/**
 * Google Gemini adapter. Uses the `@google/genai` SDK with the
 * `responseSchema` config for structured output. The Gemini schema
 * vocabulary is its own (`Type.OBJECT`, `Type.STRING`, etc.) so we
 * translate our challenge-provided JSON Schema into it at request time.
 */
@Injectable()
export class GeminiProvider implements ModelProvider {
  readonly id = 'gemini' as const;

  async generate<T = unknown>(input: GenerateInput): Promise<GenerateOutput<T>> {
    const client = new GoogleGenAI({ apiKey: input.apiKey });

    const response = await client.models.generateContent({
      model: input.model,
      contents: input.user,
      config: {
        systemInstruction: input.system,
        responseMimeType: 'application/json',
        responseSchema: toGeminiSchema(input.responseSchema.jsonSchema),
      },
    });

    const text = response.text;
    if (!text) throw new Error('gemini: empty completion text');

    const parsed = input.responseSchema.zod.parse(JSON.parse(text)) as T & { reasoning: string };
    const tokensUsed =
      (response.usageMetadata?.promptTokenCount ?? 0) +
      (response.usageMetadata?.candidatesTokenCount ?? 0);

    return { response: parsed, tokensUsed };
  }
}

// biome-ignore lint/suspicious/noExplicitAny: external Type vocabulary
function toGeminiSchema(node: Record<string, unknown>): any {
  const out: Record<string, unknown> = {};
  const type = node.type;
  if (type === 'object') {
    out.type = Type.OBJECT;
    if (node.properties && typeof node.properties === 'object') {
      const props = node.properties as Record<string, Record<string, unknown>>;
      out.properties = Object.fromEntries(
        Object.entries(props).map(([k, v]) => [k, toGeminiSchema(v)]),
      );
    }
    if (Array.isArray(node.required)) out.required = node.required;
  } else if (type === 'string') {
    out.type = Type.STRING;
    if (Array.isArray(node.enum)) out.enum = node.enum;
  } else if (type === 'number' || type === 'integer') {
    out.type = type === 'integer' ? Type.INTEGER : Type.NUMBER;
  } else if (type === 'boolean') {
    out.type = Type.BOOLEAN;
  } else if (type === 'array') {
    out.type = Type.ARRAY;
    if (node.items && typeof node.items === 'object') {
      out.items = toGeminiSchema(node.items as Record<string, unknown>);
    }
  }
  if (typeof node.description === 'string') out.description = node.description;
  return out;
}
