import type { Action, Direction, KeyColor } from '@mentisix/sim';
import { z } from 'zod';

/**
 * The flat action vocabulary the LLM picks from. Flat enums round-trip
 * cleanly through every provider's structured-output mode (OpenAI strict
 * JSON Schema, Anthropic tool_use, Groq json_object) without the
 * discriminated-union footgun.
 */
export const AGENT_ACTION_TOKENS = [
  'move_north',
  'move_south',
  'move_east',
  'move_west',
  'pick_up',
  'wait',
  'use_red_key_north',
  'use_red_key_south',
  'use_red_key_east',
  'use_red_key_west',
  'use_blue_key_north',
  'use_blue_key_south',
  'use_blue_key_east',
  'use_blue_key_west',
] as const;

export type AgentActionToken = (typeof AGENT_ACTION_TOKENS)[number];

export const AgentResponseSchema = z.object({
  reasoning: z
    .string()
    .min(1)
    .max(2000)
    .describe('Brief reasoning for the chosen action. Single short paragraph.'),
  action: z.enum(AGENT_ACTION_TOKENS).describe('The action to take this turn.'),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

const DIRECTION_BY_SUFFIX: Record<string, Direction> = {
  north: 'north',
  south: 'south',
  east: 'east',
  west: 'west',
};

/**
 * Convert the LLM's flat action token into a structured sim Action.
 */
export function tokenToAction(token: AgentActionToken): Action {
  if (token === 'pick_up') return { kind: 'pick_up' };
  if (token === 'wait') return { kind: 'wait' };
  if (token.startsWith('move_')) {
    const dir = DIRECTION_BY_SUFFIX[token.slice('move_'.length)];
    if (!dir) throw new Error(`tokenToAction: bad token ${token}`);
    return { kind: 'move', direction: dir };
  }
  if (token.startsWith('use_red_key_')) {
    const dir = DIRECTION_BY_SUFFIX[token.slice('use_red_key_'.length)];
    if (!dir) throw new Error(`tokenToAction: bad token ${token}`);
    return { kind: 'use_key', direction: dir, color: 'red' as KeyColor };
  }
  if (token.startsWith('use_blue_key_')) {
    const dir = DIRECTION_BY_SUFFIX[token.slice('use_blue_key_'.length)];
    if (!dir) throw new Error(`tokenToAction: bad token ${token}`);
    return { kind: 'use_key', direction: dir, color: 'blue' as KeyColor };
  }
  throw new Error(`tokenToAction: unknown token ${token}`);
}
