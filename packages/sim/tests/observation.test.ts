import { describe, expect, it } from 'vitest';
import { observe } from '../src/observation.js';
import { createWorld } from '../src/procgen/index.js';

describe('observe', () => {
  it('returns a visible window of size visionRadius', () => {
    const world = createWorld(0);
    const obs = observe(world);
    expect(obs.visible.length).toBe(world.config.visionRadius);
    for (const row of obs.visible) {
      expect(row.length).toBe(world.config.visionRadius);
    }
  });

  it('renders out-of-bounds cells as walls', () => {
    const world = createWorld(0);
    const obs = observe(world);
    // agent starts at (0,0) with radius 3 → top-left half should be walls
    expect(obs.visible[0]?.[0]?.kind).toBe('wall');
    expect(obs.visible[0]?.[1]?.kind).toBe('wall');
    expect(obs.visible[1]?.[0]?.kind).toBe('wall');
  });

  it('includes the agent position', () => {
    const world = createWorld(0);
    const obs = observe(world);
    expect(obs.position).toEqual(world.agent);
  });

  it('reports treasure totals correctly', () => {
    const world = createWorld(0);
    const obs = observe(world);
    expect(obs.treasuresTotal).toBe(world.config.treasures);
    expect(obs.treasuresCollected).toBe(0);
    expect(obs.treasuresRemaining).toBe(world.config.treasures);
  });

  it('throws on even vision radius', () => {
    const world = createWorld(0);
    const broken = { ...world, config: { ...world.config, visionRadius: 4 } };
    expect(() => observe(broken)).toThrow();
  });

  it('exposes the full action vocabulary', () => {
    const obs = observe(createWorld(0));
    expect(obs.availableActions).toContain('move_north');
    expect(obs.availableActions).toContain('pick_up');
    expect(obs.availableActions).toContain('use_key:red:north');
    expect(obs.availableActions).toContain('wait');
  });
});
