import type { RunEvent } from '@mentisix/types';
import { describe, expect, it } from 'vitest';
import { HarnessService } from '../src/harness/harness.service.js';
import { MockProvider } from '../src/harness/providers/mock.provider.js';

describe('HarnessService with MockProvider', () => {
  it('runs an agent end-to-end and emits a coherent event stream', async () => {
    const service = new HarnessService();
    const provider = new MockProvider();
    const events: RunEvent[] = [];

    const finish = await service.run({
      runId: 'test-run-1',
      seed: 0,
      model: { provider: 'mock', model: 'mock-1' },
      apiKey: 'no-key-needed',
      options: { maxSteps: 60 },
      provider,
      emit: (event) => events.push(event),
    });

    // status must be a terminal one (passed, failed, killed, or error)
    expect(['passed', 'failed', 'killed', 'error']).toContain(finish.status);

    // event stream invariants
    expect(events[0]?.kind).toBe('hello');
    expect(events.at(-1)?.kind).toMatch(/done|error/);

    // every observation is paired with a thinking event and an action+state pair
    const observations = events.filter((e) => e.kind === 'observation').length;
    const thinkings = events.filter((e) => e.kind === 'thinking').length;
    const actions = events.filter((e) => e.kind === 'action').length;
    const states = events.filter((e) => e.kind === 'state').length;
    expect(thinkings).toBe(observations);
    expect(actions).toBe(observations);
    expect(states).toBe(observations);

    expect(finish.stepsUsed).toBeGreaterThan(0);
    expect(finish.tokensUsed).toBeGreaterThan(0);
  });

  it('respects the step budget', async () => {
    const service = new HarnessService();
    const provider = new MockProvider();
    const events: RunEvent[] = [];

    const finish = await service.run({
      runId: 'test-run-2',
      seed: 7,
      model: { provider: 'mock', model: 'mock-1' },
      apiKey: 'x',
      options: { maxSteps: 5 },
      provider,
      emit: (event) => events.push(event),
    });

    expect(finish.stepsUsed).toBeLessThanOrEqual(5);
  });

  it('kills the run when token budget is exhausted', async () => {
    const service = new HarnessService();
    const provider = new MockProvider();
    const events: RunEvent[] = [];

    const finish = await service.run({
      runId: 'test-run-3',
      seed: 1,
      model: { provider: 'mock', model: 'mock-1' },
      apiKey: 'x',
      options: { maxTokens: 13 },
      provider,
      emit: (event) => events.push(event),
    });

    expect(finish.status).toBe('killed');
    expect(events.some((e) => e.kind === 'error')).toBe(true);
  });
});
