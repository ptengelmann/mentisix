import { describe, expect, it } from 'vitest';
import { ANTHROPIC_TOOL_INPUT_SCHEMA } from '../src/harness/providers/anthropic.provider.js';
import { OPENAI_STRUCTURED_SCHEMA } from '../src/harness/providers/openai.provider.js';

/**
 * Both providers send a JSON Schema describing the agent's structured
 * output. OpenAI strict mode and Anthropic tool_use both require the
 * root to be an inline `type: "object"` schema, not a `{ $ref,
 * definitions }` wrapper. Passing `name` to zod-to-json-schema produces
 * the wrapper — we caught this on the first real call against OpenAI
 * (400 "schema must be a JSON Schema of 'type: object'"). This test
 * guards against the regression.
 */
describe('provider structured-output schemas', () => {
  it('OpenAI schema is a root object with required properties', () => {
    expect(OPENAI_STRUCTURED_SCHEMA.type).toBe('object');
    const properties = OPENAI_STRUCTURED_SCHEMA.properties as Record<string, unknown>;
    expect(properties).toHaveProperty('reasoning');
    expect(properties).toHaveProperty('action');
    expect(OPENAI_STRUCTURED_SCHEMA.required).toEqual(
      expect.arrayContaining(['reasoning', 'action']),
    );
    // strict mode requires additionalProperties false on every object node
    expect(OPENAI_STRUCTURED_SCHEMA.additionalProperties).toBe(false);
    // strict mode also rejects $ref / definitions / $schema metadata at root
    expect(OPENAI_STRUCTURED_SCHEMA).not.toHaveProperty('$ref');
    expect(OPENAI_STRUCTURED_SCHEMA).not.toHaveProperty('definitions');
    expect(OPENAI_STRUCTURED_SCHEMA).not.toHaveProperty('$schema');
  });

  it('Anthropic tool input schema is a root object with required properties', () => {
    const schema = ANTHROPIC_TOOL_INPUT_SCHEMA as Record<string, unknown>;
    expect(schema.type).toBe('object');
    expect(schema.properties).toMatchObject({
      reasoning: expect.anything(),
      action: expect.anything(),
    });
    expect(schema).not.toHaveProperty('$ref');
    expect(schema).not.toHaveProperty('$schema');
  });
});
