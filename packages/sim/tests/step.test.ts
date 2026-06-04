import { describe, expect, it } from 'vitest';
import { createWorld } from '../src/procgen/index.js';
import { step } from '../src/step.js';
import type { Action, Cell, WorldState } from '../src/types.js';

function walk(world: WorldState, actions: Action[]): WorldState {
  return actions.reduce((w, a) => step(w, a), world);
}

describe('step', () => {
  it('does not mutate the input world', () => {
    const world = createWorld(0);
    const snapshot = JSON.stringify(world);
    step(world, { kind: 'move', direction: 'east' });
    expect(JSON.stringify(world)).toBe(snapshot);
  });

  it('increments step on every action', () => {
    const world = createWorld(0);
    const after = walk(world, [{ kind: 'wait' }, { kind: 'wait' }, { kind: 'wait' }]);
    expect(after.step).toBe(3);
  });

  it('caps history at 10 entries', () => {
    let world = createWorld(0);
    for (let i = 0; i < 20; i++) {
      world = step(world, { kind: 'wait' });
    }
    expect(world.history.length).toBe(10);
  });

  it('blocks movement into walls', () => {
    const world: WorldState = wallEastOf(createWorld(0));
    const after = step(world, { kind: 'move', direction: 'east' });
    expect(after.agent).toEqual(world.agent);
    expect(after.history.at(-1)?.outcome).toBe('blocked_wall');
  });

  it('blocks movement past the edge', () => {
    const world = createWorld(0);
    const after = step(world, { kind: 'move', direction: 'north' });
    expect(after.agent).toEqual([0, 0]);
    expect(after.history.at(-1)?.outcome).toBe('blocked_edge');
  });

  it('blocks movement through closed doors', () => {
    const world = withCellEastOfAgent(createWorld(0), { kind: 'door', color: 'red', open: false });
    const after = step(world, { kind: 'move', direction: 'east' });
    expect(after.agent).toEqual(world.agent);
    expect(after.history.at(-1)?.outcome).toBe('blocked_door');
  });

  it('allows movement through open doors', () => {
    const world = withCellEastOfAgent(createWorld(0), { kind: 'door', color: 'red', open: true });
    const after = step(world, { kind: 'move', direction: 'east' });
    expect(after.agent[1]).toBe(world.agent[1] + 1);
    expect(after.history.at(-1)?.outcome).toBe('ok');
  });

  it('picks up a key when standing on it', () => {
    const world = withCellAtAgent(createWorld(0), { kind: 'key', color: 'red' });
    const after = step(world, { kind: 'pick_up' });
    expect(after.inventory).toContain('red');
    expect(after.grid[world.agent[0]]?.[world.agent[1]]?.kind).toBe('floor');
    expect(after.history.at(-1)?.outcome).toBe('pickup_key');
  });

  it('picks up a treasure and increments the counter', () => {
    const world = withCellAtAgent(createWorld(0), { kind: 'treasure' });
    const after = step(world, { kind: 'pick_up' });
    expect(after.treasuresCollected).toBe(1);
    expect(after.history.at(-1)?.outcome).toBe('pickup_treasure');
  });

  it('reports nothing_to_pick_up on a floor cell', () => {
    const world = createWorld(0);
    const after = step(world, { kind: 'pick_up' });
    expect(after.history.at(-1)?.outcome).toBe('nothing_to_pick_up');
  });

  it('opens a door when the agent has the matching key', () => {
    let world = withCellEastOfAgent(createWorld(0), { kind: 'door', color: 'red', open: false });
    world = { ...world, inventory: ['red'] };
    const after = step(world, { kind: 'use_key', direction: 'east', color: 'red' });
    expect(after.history.at(-1)?.outcome).toBe('opened_door');
    const [r, c] = world.agent;
    const targetCell = after.grid[r]?.[c + 1];
    expect(targetCell?.kind).toBe('door');
    expect(targetCell?.kind === 'door' && targetCell.open).toBe(true);
  });

  it('refuses to open a door without the matching key', () => {
    const world = withCellEastOfAgent(createWorld(0), {
      kind: 'door',
      color: 'red',
      open: false,
    });
    const after = step(world, { kind: 'use_key', direction: 'east', color: 'red' });
    expect(after.history.at(-1)?.outcome).toBe('no_matching_key');
  });

  it('transitions to lost when max steps reached without all treasures', () => {
    let world = createWorld(0);
    while (world.status === 'running') {
      world = step(world, { kind: 'wait' });
    }
    expect(world.status).toBe('lost');
    expect(world.step).toBe(world.config.maxSteps);
  });

  it('refuses to step after terminal status', () => {
    let world = createWorld(0);
    while (world.status === 'running') {
      world = step(world, { kind: 'wait' });
    }
    const before = world;
    const after = step(world, { kind: 'move', direction: 'east' });
    expect(after).toBe(before);
  });
});

// ---- test helpers (small grid surgery) ----

function withCellAtAgent(world: WorldState, cell: Cell): WorldState {
  const [r, c] = world.agent;
  const grid = world.grid.map((row, rr) =>
    rr === r ? row.map((existing, cc) => (cc === c ? cell : existing)) : row.slice(),
  );
  return { ...world, grid };
}

function withCellEastOfAgent(world: WorldState, cell: Cell): WorldState {
  const [r, c] = world.agent;
  const grid = world.grid.map((row, rr) =>
    rr === r ? row.map((existing, cc) => (cc === c + 1 ? cell : existing)) : row.slice(),
  );
  return { ...world, grid };
}

function wallEastOf(world: WorldState): WorldState {
  return withCellEastOfAgent(world, { kind: 'wall' });
}
