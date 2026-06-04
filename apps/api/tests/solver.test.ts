import type { Difficulty } from '@mentisix/sim';
import type { RunEvent } from '@mentisix/types';
import { describe, expect, it } from 'vitest';
import { HarnessService } from '../src/harness/harness.service.js';
import { SolverProvider } from '../src/harness/providers/solver.provider.js';

describe('SolverProvider', () => {
  it('wins every seed in [0, 20)', async () => {
    const failures: { seed: number; status: string; collected: number }[] = [];
    for (let seed = 0; seed < 20; seed++) {
      const service = new HarnessService();
      const provider = new SolverProvider();
      const events: RunEvent[] = [];
      const finish = await service.run({
        runId: `solver-seed-${seed}`,
        seed,
        challenge: 'treasure-hunt',
        difficulty: 'medium',
        model: { provider: 'solver', model: 'solver-1' },
        apiKey: 'unused',
        options: {},
        provider,
        emit: (e) => events.push(e),
      });
      if (finish.status !== 'passed') {
        let lastCollected = 0;
        for (let i = events.length - 1; i >= 0; i--) {
          const e = events[i];
          if (e?.kind === 'state') {
            lastCollected = e.treasuresCollected;
            break;
          }
        }
        failures.push({ seed, status: finish.status, collected: lastCollected });
      }
    }
    expect(failures, `solver failed on: ${JSON.stringify(failures)}`).toEqual([]);
  });

  it('emits a coherent event stream and burns zero tokens', async () => {
    const service = new HarnessService();
    const provider = new SolverProvider();
    const events: RunEvent[] = [];
    const finish = await service.run({
      runId: 'solver-events',
      seed: 0,
      challenge: 'treasure-hunt',
      difficulty: 'medium',
      model: { provider: 'solver', model: 'solver-1' },
      apiKey: 'unused',
      options: {},
      provider,
      emit: (e) => events.push(e),
    });

    expect(finish.status).toBe('passed');
    expect(finish.tokensUsed).toBe(0);
    expect(events[0]?.kind).toBe('hello');
    expect(events.at(-1)?.kind).toBe('done');

    const observations = events.filter((e) => e.kind === 'observation').length;
    const thinkings = events.filter((e) => e.kind === 'thinking').length;
    expect(thinkings).toBe(observations);
  });

  it('finishes well under the step budget on simple seeds', async () => {
    const service = new HarnessService();
    const provider = new SolverProvider();
    const finish = await service.run({
      runId: 'solver-quick',
      seed: 3,
      challenge: 'treasure-hunt',
      difficulty: 'medium',
      model: { provider: 'solver', model: 'solver-1' },
      apiKey: 'unused',
      options: {},
      provider,
      emit: () => {},
    });

    expect(finish.status).toBe('passed');
    expect(finish.stepsUsed).toBeLessThan(180);
  });

  it.each(['easy', 'medium', 'hard'] as const satisfies readonly Difficulty[])(
    'wins every Memory Probe seed in [0, 20) at %s difficulty',
    async (difficulty) => {
      const failures: { seed: number; status: string }[] = [];
      for (let seed = 0; seed < 20; seed++) {
        const service = new HarnessService();
        const provider = new SolverProvider();
        const finish = await service.run({
          runId: `solver-mp-${difficulty}-${seed}`,
          seed,
          challenge: 'memory-probe',
          difficulty,
          model: { provider: 'solver', model: 'solver-1' },
          apiKey: 'unused',
          options: {},
          provider,
          emit: () => {},
        });
        if (finish.status !== 'passed') {
          failures.push({ seed, status: finish.status });
        }
      }
      expect(failures, `solver failed on MP ${difficulty}: ${JSON.stringify(failures)}`).toEqual(
        [],
      );
    },
  );
});
