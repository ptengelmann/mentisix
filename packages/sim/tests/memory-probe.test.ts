import { describe, expect, it } from 'vitest';
import {
  PROBE_CONFIG_BY_DIFFICULTY,
  createProbe,
  observeProbe,
  scoreProbe,
  stepProbe,
} from '../src/index.js';

describe('Memory Probe sim', () => {
  it('is deterministic from a seed', () => {
    const a = createProbe(42, 'medium');
    const b = createProbe(42, 'medium');
    expect(a.schedule).toEqual(b.schedule);
    expect(a.maxTurns).toBe(PROBE_CONFIG_BY_DIFFICULTY.medium.turns);
  });

  it('has the right number of tell/ask turns per difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const state = createProbe(7, difficulty);
      const tells = state.schedule.filter((t) => t.kind === 'tell').length;
      const asks = state.schedule.filter((t) => t.kind === 'ask').length;
      const cfg = PROBE_CONFIG_BY_DIFFICULTY[difficulty];
      expect(tells).toBe(cfg.facts);
      expect(asks).toBe(cfg.facts);
    }
  });

  it('a perfect agent wins; a wrong answer triggers immediate loss', () => {
    const state = createProbe(0, 'easy');
    let s = state;
    while (s.status === 'running') {
      const obs = observeProbe(s);
      const expected = obs.current.kind === 'ask' ? obs.current.expected : 'ok';
      s = stepProbe(s, { reasoning: 'recall', answer: expected });
    }
    expect(s.status).toBe('won');
    const breakdown = scoreProbe(s);
    expect(breakdown.won).toBe(true);
    expect(breakdown.correct).toBe(1);
    expect(breakdown.score).toBeGreaterThanOrEqual(1200);
  });

  it('wrong answer on the first ask flips status to lost', () => {
    const state = createProbe(0, 'easy');
    let s = state;
    while (s.status === 'running') {
      const obs = observeProbe(s);
      if (obs.current.kind === 'ask') {
        s = stepProbe(s, { reasoning: 'guess', answer: 'definitely-wrong' });
        break;
      }
      s = stepProbe(s, { reasoning: 'noop', answer: 'ok' });
    }
    expect(s.status).toBe('lost');
    expect(scoreProbe(s).correct).toBe(0);
  });
});
