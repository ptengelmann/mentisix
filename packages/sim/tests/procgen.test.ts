import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/procgen/index.js';
import { isSolvable } from '../src/procgen/solver.js';

describe('createWorld', () => {
  it('produces a solvable world for seed 0', () => {
    const world = createWorld(0);
    expect(world.status).toBe('running');
    expect(world.treasuresCollected).toBe(0);
    expect(world.agent).toEqual([0, 0]);
    expect(world.config.width).toBe(12);
    expect(world.config.height).toBe(12);
    expect(isSolvable(world.grid, world.agent, world.config)).toBe(true);
  });

  it('produces solvable worlds for 100 consecutive seeds', () => {
    const failures: number[] = [];
    for (let s = 0; s < 100; s++) {
      try {
        const world = createWorld(s);
        if (!isSolvable(world.grid, world.agent, world.config)) failures.push(s);
      } catch {
        failures.push(s);
      }
    }
    expect(failures, `unsolvable seeds: ${failures.join(', ')}`).toEqual([]);
  });

  it('always places exactly the configured number of treasures', () => {
    for (let s = 0; s < 20; s++) {
      const world = createWorld(s);
      let n = 0;
      for (const row of world.grid) for (const cell of row) if (cell.kind === 'treasure') n++;
      expect(n).toBe(world.config.treasures);
    }
  });

  it('always places exactly the configured number of keys and doors', () => {
    for (let s = 0; s < 20; s++) {
      const world = createWorld(s);
      let keys = 0;
      let doors = 0;
      for (const row of world.grid)
        for (const cell of row) {
          if (cell.kind === 'key') keys++;
          if (cell.kind === 'door') doors++;
        }
      expect(keys).toBe(world.config.keys);
      expect(doors).toBe(world.config.keys);
    }
  });

  it('produces identical worlds for the same seed (determinism)', () => {
    const a = createWorld(1234);
    const b = createWorld(1234);
    expect(a.grid).toEqual(b.grid);
    expect(a.agent).toEqual(b.agent);
    expect(a.seed).toBe(b.seed);
  });

  it('produces different worlds for different seeds', () => {
    const a = createWorld(1);
    const b = createWorld(2);
    expect(a.grid).not.toEqual(b.grid);
  });

  it('leaves the agent cell as floor', () => {
    for (let s = 0; s < 20; s++) {
      const world = createWorld(s);
      const [r, c] = world.agent;
      expect(world.grid[r]?.[c]?.kind).toBe('floor');
    }
  });
});
