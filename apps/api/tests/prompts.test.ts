import { createWorld, observe } from '@mentisix/sim';
import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT, serializeObservation } from '../src/harness/prompts.js';

describe('prompts', () => {
  it('exposes a non-empty system prompt', () => {
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(200);
    expect(SYSTEM_PROMPT).toContain('Treasure Hunt');
  });

  it('serializes an observation as readable plain text', () => {
    const world = createWorld(0);
    const obs = observe(world);
    const text = serializeObservation(obs);

    expect(text).toMatch(/STEP \d+\/\d+/);
    expect(text).toMatch(/POSITION/);
    expect(text).toMatch(/TREASURES collected/);
    expect(text).toContain('INVENTORY');
    expect(text).toContain('VISIBLE WINDOW');
    expect(text).toContain('Choose one action from:');
  });

  it('renders the agent as A in the center of the visible window', () => {
    const world = createWorld(0);
    const obs = observe(world);
    const text = serializeObservation(obs);
    // 3x3 window → middle row, middle column → A
    const lines = text.split('\n');
    const visibleStart = lines.findIndex((l) => l.includes('VISIBLE WINDOW'));
    const center = lines[visibleStart + 2];
    expect(center).toMatch(/A/);
  });

  it('reports inventory as empty initially', () => {
    const world = createWorld(0);
    const obs = observe(world);
    const text = serializeObservation(obs);
    expect(text).toContain('INVENTORY (empty)');
  });
});
