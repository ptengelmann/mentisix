import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AgentResponseSchema } from '../action.schema.js';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

// Inline the schema at the root. `name` would produce a `$ref` wrapper
// whose root has no `type: "object"`, breaking Anthropic's tool schema
// extraction below.
const TOOL_INPUT_SCHEMA = zodToJsonSchema(AgentResponseSchema, { $refStrategy: 'none' });

/** Exposed for regression tests. */
export const ANTHROPIC_TOOL_INPUT_SCHEMA = extractInputSchema(TOOL_INPUT_SCHEMA);

const ACT_TOOL_NAME = 'act';

@Injectable()
export class AnthropicProvider implements ModelProvider {
  readonly id = 'anthropic' as const;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const client = new Anthropic({ apiKey: input.apiKey });

    const message = await client.messages.create({
      model: input.model,
      max_tokens: 1024,
      system: input.system,
      tools: [
        {
          name: ACT_TOOL_NAME,
          description: 'Choose the next action and provide brief reasoning.',
          input_schema: ANTHROPIC_TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: ACT_TOOL_NAME },
      messages: [{ role: 'user', content: input.user }],
    });

    const toolUse = message.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('anthropic: no tool_use block in response');
    }

    const parsed = AgentResponseSchema.parse(toolUse.input);
    const tokensUsed = (message.usage.input_tokens ?? 0) + (message.usage.output_tokens ?? 0);
    return { response: parsed, tokensUsed };
  }
}

/**
 * Anthropic wants the raw JSON-Schema object describing the tool input,
 * not the wrapped envelope zod-to-json-schema returns. Strip the `$schema`
 * key and ensure `type: object`.
 */
function extractInputSchema(
  schema: ReturnType<typeof zodToJsonSchema>,
): Anthropic.Tool['input_schema'] {
  const { $schema: _meta, ...rest } = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
  if (rest.type !== 'object') {
    throw new Error('anthropic: expected top-level object schema');
  }
  return rest as Anthropic.Tool['input_schema'];
}
