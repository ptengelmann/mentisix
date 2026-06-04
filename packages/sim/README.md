# @mentisix/sim

The Treasure Hunt grid-world cognition engine. Pure TypeScript · no I/O, no DOM, no network. Consumed by `apps/api` for run execution and by `apps/web` for client-side replay rendering.

## The challenge

A 12×12 grid. The agent starts in a corner. Scattered across the grid:

- **3 treasures** the agent must collect
- **2 colored keys** (red, blue), each opens a matching door
- **2 doors** that block movement until opened with the matching key
- **Walls** that block movement permanently
- **Fog of war** · the agent observes only a 3×3 window around itself

Win when all 3 treasures are collected. Lose if 200 steps are spent without winning. Every seed produces a different, **always-solvable** world.

## API

```ts
import { createWorld, step, observe, score, isSolvable } from '@mentisix/sim';

// Build a world from a seed
const world = createWorld(42);

// Get the agent's view of the world
const obs = observe(world);
// → { step, position, visible: ObservedCell[][], inventory, treasuresRemaining, … }

// Apply an action · returns the next state (immutable; never mutates input)
const next = step(world, { kind: 'move', direction: 'east' });
const picked = step(next, { kind: 'pick_up' });
const unlocked = step(picked, { kind: 'use_key', direction: 'south', color: 'red' });

// Check if a world is solvable (used by procgen + diagnostics)
isSolvable(world.grid, world.agent, world.config); // true

// Final scoring when terminal
const result = score(finalWorld); // { won, score, stepsUsed, treasuresCollected, … }
```

## Action vocabulary

```ts
type Action =
  | { kind: 'move'; direction: 'north' | 'south' | 'east' | 'west' }
  | { kind: 'pick_up' }
  | { kind: 'use_key'; direction: Direction; color: 'red' | 'blue' }
  | { kind: 'wait' };
```

Every action produces a structured `ActionResult` appended to `world.history`, with one of these outcomes:

`ok` · `blocked_wall` · `blocked_door` · `blocked_edge` · `pickup_key` · `pickup_treasure` · `nothing_to_pick_up` · `opened_door` · `no_matching_door` · `no_matching_key` · `waited` · `invalid`

## Determinism

- All randomness flows through `makeRng(seed)` · mulberry32, fast and well-distributed.
- `createWorld(seed)` is fully deterministic: same seed → same grid, same item placements, every time.
- `step` is pure: it never mutates the input, so replays are exact bit-for-bit.

## Procedural generation

`createWorld` runs in three layers:

1. **Layout** · sprinkle walls at ~22% density, then knock down walls bordering unreachable regions until every floor cell is reachable from the start corner.
2. **Placement** · pick the farthest reachable cells for treasures (mutually separated), mid-distance cells for keys, then doors.
3. **Verification** · BFS over `(position, key-bitmask, treasure-bitmask)` confirms the world is solvable. If a placement fails verification, the generator re-rolls with a fresh deterministic sub-seed. If 8 layouts × 8 placements all fail (extraordinarily rare), an error is thrown.

This guarantees every seed in normal use produces a valid, interesting world without any human curation.

## Scoring

Wins dominate; efficiency tie-breaks.

- **Won** runs: `1000 + (maxSteps - stepsUsed) × 5`
- **Lost** runs: `treasuresCollected × 250` (partial credit so 2/3 beats 0/3)

## Tests

```sh
pnpm --filter @mentisix/sim test
```

The suite covers RNG distribution and determinism, world solvability across 100 consecutive seeds, action mechanics (move, pick up, use key, win/lose), fog of war observation, and reduction of step/history invariants. Total run: ~2 s.
