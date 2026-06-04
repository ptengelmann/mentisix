import { GoogleGenAI, Type } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { AGENT_ACTION_TOKENS, AgentResponseSchema } from '../action.schema.js';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

/**
 * Google Gemini adapter. Uses the new `@google/genai` SDK with the
 * `responseSchema` config for structured output. The flat action enum
 * round-trips cleanly through Gemini's schema constraint vocabulary.
 */
@Injectable()
export class GeminiProvider implements ModelProvider {
  readonly id = 'gemini' as const;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const client = new GoogleGenAI({ apiKey: input.apiKey });

    const response = await client.models.generateContent({
      model: input.model,
      contents: input.user,
      config: {
        systemInstruction: input.system,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['reasoning', 'action'],
          properties: {
            reasoning: {
              type: Type.STRING,
              description: 'Brief reasoning for the chosen action.',
            },
            action: {
              type: Type.STRING,
              enum: [...AGENT_ACTION_TOKENS],
              description: 'The action to take this turn.',
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('gemini: empty completion text');

    const parsed = AgentResponseSchema.parse(JSON.parse(text));
    const tokensUsed =
      (response.usageMetadata?.promptTokenCount ?? 0) +
      (response.usageMetadata?.candidatesTokenCount ?? 0);

    return { response: parsed, tokensUsed };
  }
}
