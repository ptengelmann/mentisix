import { describe, expect, it } from 'vitest';
import {
  AGENT_ACTION_TOKENS,
  AgentResponseSchema,
  tokenToAction,
} from '../src/harness/action.schema.js';

describe('action schema', () => {
  it('AgentResponseSchema accepts every valid token', () => {
    for (const token of AGENT_ACTION_TOKENS) {
      const parsed = AgentResponseSchema.safeParse({ reasoning: 'because', action: token });
      expect(parsed.success).toBe(true);
    }
  });

  it('rejects unknown actions', () => {
    const result = AgentResponseSchema.safeParse({ reasoning: 'ok', action: 'jump' });
    expect(result.success).toBe(false);
  });

  it('rejects empty reasoning', () => {
    const result = AgentResponseSchema.safeParse({ reasoning: '', action: 'wait' });
    expect(result.success).toBe(false);
  });

  it('rejects oversized reasoning', () => {
    const huge = 'x'.repeat(5_000);
    const result = AgentResponseSchema.safeParse({ reasoning: huge, action: 'wait' });
    expect(result.success).toBe(false);
  });

  describe('tokenToAction', () => {
    it('handles move tokens', () => {
      expect(tokenToAction('move_north')).toEqual({ kind: 'move', direction: 'north' });
      expect(tokenToAction('move_south')).toEqual({ kind: 'move', direction: 'south' });
      expect(tokenToAction('move_east')).toEqual({ kind: 'move', direction: 'east' });
      expect(tokenToAction('move_west')).toEqual({ kind: 'move', direction: 'west' });
    });

    it('handles pick_up and wait', () => {
      expect(tokenToAction('pick_up')).toEqual({ kind: 'pick_up' });
      expect(tokenToAction('wait')).toEqual({ kind: 'wait' });
    });

    it('handles use_key tokens with color and direction', () => {
      expect(tokenToAction('use_red_key_north')).toEqual({
        kind: 'use_key',
        direction: 'north',
        color: 'red',
      });
      expect(tokenToAction('use_blue_key_east')).toEqual({
        kind: 'use_key',
        direction: 'east',
        color: 'blue',
      });
    });
  });
});
