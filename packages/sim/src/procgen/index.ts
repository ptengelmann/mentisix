import { makeRng } from '../rng.js';
import { DEFAULT_CONFIG, type Position, type WorldConfig, type WorldState } from '../types.js';
import { generateLayout } from './layout.js';
import { placeItems } from './place.js';
import { isSolvable } from './solver.js';

const PLACEMENT_RETRIES = 8;
const LAYOUT_RETRIES = 8;

export type CreateWorldOptions = Partial<WorldConfig>;

/**
 * Build a fresh, solvable Treasure Hunt world for the given seed.
 *
 * Strategy: generate a connected wall layout, then attempt several item
 * placements; if no placement yields a solvable world, regenerate the
 * layout with a fresh RNG branch and retry. Determinism is preserved
 * because all randomness flows from `seed`.
 */
export function createWorld(seed: number, options: CreateWorldOptions = {}): WorldState {
  const config: WorldConfig = { ...DEFAULT_CONFIG, ...options };
  const start: Position = [0, 0];

  for (let layoutAttempt = 0; layoutAttempt < LAYOUT_RETRIES; layoutAttempt++) {
    const layoutRng = makeRng(hashSeed(seed, layoutAttempt, 0));
    const layout = generateLayout(layoutRng, config, start);

    for (let placementAttempt = 0; placementAttempt < PLACEMENT_RETRIES; placementAttempt++) {
      const placementRng = makeRng(hashSeed(seed, layoutAttempt, placementAttempt + 1));
      const placement = placeItems(placementRng, layout, start, config);
      if (!placement) continue;

      if (!isSolvable(placement.grid, start, config)) continue;

      return {
        seed,
        config,
        grid: placement.grid,
        agent: start,
        inventory: [],
        treasuresCollected: 0,
        step: 0,
        status: 'running',
        history: [],
      };
    }
  }

  throw new Error(
    `createWorld: exhausted ${LAYOUT_RETRIES * PLACEMENT_RETRIES} attempts for seed ${seed}; consider lowering wall density or item counts`,
  );
}

function hashSeed(seed: number, layoutAttempt: number, placementAttempt: number): number {
  // mix three small ints into one 32-bit seed; the constants are arbitrary
  // primes — only determinism matters
  let h = seed | 0;
  h = Math.imul(h ^ layoutAttempt, 0x85ebca6b) | 0;
  h = Math.imul(h ^ placementAttempt, 0xc2b2ae35) | 0;
  h ^= h >>> 16;
  return h >>> 0;
}
