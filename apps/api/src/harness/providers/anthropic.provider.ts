import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

const ACT_TOOL_NAME = 'act';

@Injectable()
export class AnthropicProvider implements ModelProvider {
  readonly id = 'anthropic' as const;

  async generate<T = unknown>(input: GenerateInput): Promise<GenerateOutput<T>> {
    const client = new Anthropic({ apiKey: input.apiKey });

    const message = await client.messages.create({
      model: input.model,
      max_tokens: 1024,
      system: input.system,
      tools: [
        {
          name: ACT_TOOL_NAME,
          description: 'Choose the next action and provide brief reasoning.',
          input_schema: input.responseSchema.jsonSchema as Anthropic.Tool['input_schema'],
        },
      ],
      tool_choice: { type: 'tool', name: ACT_TOOL_NAME },
      messages: [{ role: 'user', content: input.user }],
    });

    const toolUse = message.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('anthropic: no tool_use block in response');
    }

    const parsed = input.responseSchema.zod.parse(toolUse.input) as T & { reasoning: string };
    const tokensUsed = (message.usage.input_tokens ?? 0) + (message.usage.output_tokens ?? 0);
    return { response: parsed, tokensUsed };
  }
}
