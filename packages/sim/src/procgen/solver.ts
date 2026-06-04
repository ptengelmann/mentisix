import { inBounds, key as posKey, step as stepDir } from '../geometry.js';
import { type Cell, DIRECTIONS, type KeyColor, type Position, type WorldConfig } from '../types.js';

const KEY_BIT: Record<KeyColor, number> = { red: 1, blue: 2 };

type SolverState = {
  pos: Position;
  keys: number;
  treasures: number; // bitmask of which treasure indices we have
};

function stateKey(s: SolverState): string {
  return `${s.pos[0]},${s.pos[1]}|${s.keys}|${s.treasures}`;
}

/**
 * Decide whether the world is solvable: can the agent, starting at `start`,
 * collect every treasure cell on the grid using the available keys/doors?
 *
 * BFS over (position, keyset bitmask, treasureset bitmask). Polynomial in
 * grid size × 2^keys × 2^treasures, which for a 12×12 world with 2 keys
 * and 3 treasures bounds total states at ~4.6k.
 */
export function isSolvable(
  grid: readonly (readonly Cell[])[],
  start: Position,
  config: Pick<WorldConfig, 'width' | 'height'>,
): boolean {
  const treasureIndex = new Map<string, number>();
  let treasureBitsAll = 0;
  for (let r = 0; r < config.height; r++) {
    for (let c = 0; c < config.width; c++) {
      if (grid[r]?.[c]?.kind === 'treasure') {
        const idx = treasureIndex.size;
        treasureIndex.set(posKey([r, c]), idx);
        treasureBitsAll |= 1 << idx;
      }
    }
  }
  if (treasureBitsAll === 0) return false;

  const startState: SolverState = collect(grid, treasureIndex, {
    pos: start,
    keys: 0,
    treasures: 0,
  });
  if (startState.treasures === treasureBitsAll) return true;

  const seen = new Set<string>([stateKey(startState)]);
  const queue: SolverState[] = [startState];

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;

    for (const dir of DIRECTIONS) {
      const target = stepDir(cur.pos, dir);
      if (!inBounds(target, config.width, config.height)) continue;
      const cell = grid[target[0]]?.[target[1]];
      if (!cell || cell.kind === 'wall') continue;
      if (cell.kind === 'door') {
        if (!cell.open && (cur.keys & KEY_BIT[cell.color]) === 0) continue;
      }

      const moved: SolverState = { pos: target, keys: cur.keys, treasures: cur.treasures };
      const collected = collect(grid, treasureIndex, moved);

      if (collected.treasures === treasureBitsAll) return true;

      const k = stateKey(collected);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push(collected);
    }
  }

  return false;
}

function collect(
  grid: readonly (readonly Cell[])[],
  treasureIndex: Map<string, number>,
  s: SolverState,
): SolverState {
  const cell = grid[s.pos[0]]?.[s.pos[1]];
  if (!cell) return s;
  if (cell.kind === 'key') {
    return { ...s, keys: s.keys | KEY_BIT[cell.color] };
  }
  if (cell.kind === 'treasure') {
    const idx = treasureIndex.get(posKey(s.pos));
    if (idx === undefined) return s;
    return { ...s, treasures: s.treasures | (1 << idx) };
  }
  return s;
}
