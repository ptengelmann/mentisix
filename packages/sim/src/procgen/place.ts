import { key as posKey } from '../geometry.js';
import type { Rng } from '../rng.js';
import { type Cell, KEY_COLORS, type KeyColor, type Position, type WorldConfig } from '../types.js';
import { distanceMap } from './layout.js';

const MIN_TREASURE_DISTANCE = 6;
const MIN_PAIRWISE_TREASURE_GAP = 4;

export type Placement = {
  grid: Cell[][];
  treasures: Position[];
  keys: { color: KeyColor; pos: Position }[];
  doors: { color: KeyColor; pos: Position }[];
};

/**
 * Place treasures (far from start, far from each other), then keys, then
 * doors. Doors are placed on floor cells; the solver later confirms a
 * valid path exists. If a candidate set fails some constraint, the caller
 * re-rolls (procgen index orchestrates retries).
 */
export function placeItems(
  rng: Rng,
  grid: readonly (readonly Cell[])[],
  start: Position,
  config: Pick<WorldConfig, 'width' | 'height' | 'treasures' | 'keys'>,
): Placement | null {
  const dist = distanceMap(grid, start, config);

  const candidates: { pos: Position; d: number }[] = [];
  for (const [k, d] of dist.entries()) {
    if (d < 1) continue;
    const [r, c] = k.split(',').map(Number) as [number, number];
    candidates.push({ pos: [r, c], d });
  }

  // sort by distance descending, then deterministically tiebreak
  candidates.sort((a, b) => b.d - a.d || posKey(a.pos).localeCompare(posKey(b.pos)));

  const treasures: Position[] = [];
  for (const cand of candidates) {
    if (cand.d < MIN_TREASURE_DISTANCE) break;
    if (treasures.some((t) => manhattan(t, cand.pos) < MIN_PAIRWISE_TREASURE_GAP)) continue;
    treasures.push(cand.pos);
    if (treasures.length === config.treasures) break;
  }
  if (treasures.length < config.treasures) return null;

  const taken = new Set<string>([posKey(start), ...treasures.map(posKey)]);

  // mid-distance candidates for keys, biased to a wider spread
  const midPool = candidates
    .filter((c) => c.d >= 2 && c.d <= MIN_TREASURE_DISTANCE + 2 && !taken.has(posKey(c.pos)))
    .map((c) => c.pos);
  if (midPool.length < config.keys) return null;

  const keysShuffled = rng.shuffle(midPool).slice(0, config.keys);
  const keys: Placement['keys'] = keysShuffled.map((pos, i) => {
    const color = KEY_COLORS[i % KEY_COLORS.length] as KeyColor;
    taken.add(posKey(pos));
    return { color, pos };
  });

  // doors: pick floor cells in the middle band, biased toward chokepoints
  const doorPool = candidates
    .filter(
      (c) =>
        c.d >= MIN_TREASURE_DISTANCE - 2 &&
        c.d <= MIN_TREASURE_DISTANCE + 4 &&
        !taken.has(posKey(c.pos)),
    )
    .map((c) => c.pos);
  if (doorPool.length < config.keys) return null;

  const doorsShuffled = rng.shuffle(doorPool).slice(0, config.keys);
  const doors: Placement['doors'] = doorsShuffled.map((pos, i) => {
    const color = KEY_COLORS[i % KEY_COLORS.length] as KeyColor;
    taken.add(posKey(pos));
    return { color, pos };
  });

  // apply to a fresh grid
  const next = grid.map((row) => row.slice());
  for (const t of treasures) {
    const row = next[t[0]];
    if (row) row[t[1]] = { kind: 'treasure' };
  }
  for (const k of keys) {
    const row = next[k.pos[0]];
    if (row) row[k.pos[1]] = { kind: 'key', color: k.color };
  }
  for (const d of doors) {
    const row = next[d.pos[0]];
    if (row) row[d.pos[1]] = { kind: 'door', color: d.color, open: false };
  }

  return { grid: next, treasures, keys, doors };
}

function manhattan(a: Position, b: Position): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}
