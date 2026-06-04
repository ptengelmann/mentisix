import { describe, expect, it } from 'vitest';
import { getResponseSchema } from '../src/challenges/schemas.js';

/**
 * Every challenge's response schema must satisfy provider strict-mode
 * requirements: root `type: "object"`, all keys required, no
 * `$schema` / `$ref` / `definitions` envelope. Caught on the first
 * real OpenAI call back in PR #11; the regression test stays.
 */
describe('per-challenge response schemas', () => {
  it.each(['treasure-hunt', 'memory-probe'] as const)('%s schema is strict-mode safe', (id) => {
    const { jsonSchema } = getResponseSchema(id);
    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.additionalProperties).toBe(false);
    const props = jsonSchema.properties as Record<string, unknown>;
    expect(props).toHaveProperty('reasoning');
    expect(jsonSchema.required).toEqual(expect.arrayContaining(Object.keys(props)));
    expect(jsonSchema).not.toHaveProperty('$ref');
    expect(jsonSchema).not.toHaveProperty('definitions');
    expect(jsonSchema).not.toHaveProperty('$schema');
  });

  it('Treasure Hunt schema includes flat action enum', () => {
    const { jsonSchema } = getResponseSchema('treasure-hunt');
    const props = jsonSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.action?.type).toBe('string');
    expect(Array.isArray(props.action?.enum)).toBe(true);
  });

  it('Memory Probe schema asks for a free-form answer string', () => {
    const { jsonSchema } = getResponseSchema('memory-probe');
    const props = jsonSchema.properties as Record<string, Record<string, unknown>>;
    expect(props.answer?.type).toBe('string');
    expect(props.answer?.enum).toBeUndefined();
  });
});
