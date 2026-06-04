import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

@Injectable()
export class OpenAIProvider implements ModelProvider {
  readonly id = 'openai' as const;

  async generate<T = unknown>(input: GenerateInput): Promise<GenerateOutput<T>> {
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
          name: input.responseSchema.name,
          schema: input.responseSchema.jsonSchema,
          strict: true,
        },
      },
    });

    const choice = completion.choices[0];
    const content = choice?.message.content;
    if (!content) throw new Error('openai: empty completion content');

    const parsed = input.responseSchema.zod.parse(JSON.parse(content)) as T & {
      reasoning: string;
    };
    return {
      response: parsed,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }
}
