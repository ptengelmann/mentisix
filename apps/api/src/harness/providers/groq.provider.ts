import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

/**
 * Groq is OpenAI-compatible at the Chat Completions endpoint. We use the
 * official `openai` client with `baseURL` overridden. JSON-Schema strict
 * mode isn't supported on most Groq models, so we ask for `json_object`
 * and rely on the prompt plus Zod parsing to enforce shape.
 */
@Injectable()
export class GroqProvider implements ModelProvider {
  readonly id = 'groq' as const;

  async generate<T = unknown>(input: GenerateInput): Promise<GenerateOutput<T>> {
    const client = new OpenAI({
      apiKey: input.apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const completion = await client.chat.completions.create({
      model: input.model,
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message.content;
    if (!content) throw new Error('groq: empty completion content');

    const parsed = input.responseSchema.zod.parse(JSON.parse(content)) as T & {
      reasoning: string;
    };
    return {
      response: parsed,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }
}
