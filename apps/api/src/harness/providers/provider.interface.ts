import type { ProviderId } from '@mentisix/types';
import type { z } from 'zod';

/**
 * The structured-output contract a provider must satisfy this turn.
 * Each challenge supplies its own. The Zod schema is the source of
 * truth; provider implementations also receive a pre-built JSON Schema
 * (for OpenAI strict mode / Anthropic tool_use / Gemini responseSchema)
 * so they don't reach into Zod internals.
 */
export type ResponseSchema = {
  /** Display name for the structured-output tool/response. */
  readonly name: string;
  /** Zod schema used by the provider to parse and validate the LLM output. */
  // biome-ignore lint/suspicious/noExplicitAny: response shape is challenge-specific
  readonly zod: z.ZodSchema<any>;
  /** Pre-built JSON Schema (root `type: "object"`, all keys required, `additionalProperties: false`). */
  readonly jsonSchema: Record<string, unknown>;
};

export type GenerateInput = {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  /** Structured observation. Opaque to the provider, included for ones that want it. */
  observation?: unknown;
  /** Per-run identifier so providers can maintain memory across turns. */
  runId?: string;
  /** Per-turn response contract. */
  responseSchema: ResponseSchema;
};

export type GenerateOutput<T = unknown> = {
  /** Validated structured response. Always has `reasoning`. */
  response: T & { reasoning: string };
  tokensUsed: number;
};

export interface ModelProvider {
  readonly id: ProviderId;
  generate<T = unknown>(input: GenerateInput): Promise<GenerateOutput<T>>;
}
