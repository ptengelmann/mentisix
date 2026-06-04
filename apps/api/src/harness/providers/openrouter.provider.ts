import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AgentResponseSchema } from '../action.schema.js';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

/**
 * OpenRouter adapter — the meta-provider that routes to ~200 models with
 * one OpenAI-compatible endpoint. Models are addressed as `vendor/model`
 * (e.g. `anthropic/claude-sonnet-4-6`, `x-ai/grok-3`, `deepseek/deepseek-v3`).
 *
 * Different vendors on OpenRouter have different structured-output
 * support, so we ask for `json_object` and rely on the prompt + Zod
 * parsing for shape enforcement.
 */
@Injectable()
export class OpenRouterProvider implements ModelProvider {
  readonly id = 'openrouter' as const;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const client = new OpenAI({
      apiKey: input.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://mentisix.local',
        'X-Title': 'Mentisix',
      },
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
    if (!content) throw new Error('openrouter: empty completion content');

    const parsed = AgentResponseSchema.parse(JSON.parse(content));
    return {
      response: parsed,
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }
}
