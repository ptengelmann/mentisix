/**
 * Per-challenge structured-output schemas, indexed by ChallengeId.
 *
 * Lives in `apps/api` (not `packages/sim`) because Zod is an apps/api
 * concern. Each entry pairs the Zod schema with a pre-built JSON Schema
 * (root `type: "object"`, all keys required, `additionalProperties:
 * false`) so providers don't need to convert.
 */

import type { ChallengeId } from '@mentisix/sim';
import { type ZodSchema, type ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AgentResponseSchema } from '../harness/action.schema.js';
import type { ResponseSchema } from '../harness/providers/provider.interface.js';
import { MemoryProbeResponseSchema } from './memory-probe/schema.js';

function build(name: string, zod: ZodTypeAny): ResponseSchema {
  const raw = zodToJsonSchema(zod, { $refStrategy: 'none' });
  const { $schema: _meta, ...rest } = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  walk(rest);
  return { name, zod: zod as ZodSchema<unknown>, jsonSchema: rest };
}

function walk(node: unknown): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (obj.type === 'object') {
    if (!('additionalProperties' in obj)) obj.additionalProperties = false;
    if (obj.properties && typeof obj.properties === 'object') {
      obj.required = Object.keys(obj.properties as Record<string, unknown>);
      for (const v of Object.values(obj.properties as Record<string, unknown>)) walk(v);
    }
  }
  if (Array.isArray(obj.anyOf)) for (const v of obj.anyOf) walk(v);
  if (Array.isArray(obj.oneOf)) for (const v of obj.oneOf) walk(v);
  if (Array.isArray(obj.allOf)) for (const v of obj.allOf) walk(v);
  if (obj.items) walk(obj.items);
}

export const RESPONSE_SCHEMAS: Partial<Record<ChallengeId, ResponseSchema>> = {
  'treasure-hunt': build('AgentResponse', AgentResponseSchema),
  'memory-probe': build('MemoryProbeResponse', MemoryProbeResponseSchema),
};

export function getResponseSchema(id: ChallengeId): ResponseSchema {
  const schema = RESPONSE_SCHEMAS[id];
  if (!schema) throw new Error(`no response schema for challenge: ${id}`);
  return schema;
}
