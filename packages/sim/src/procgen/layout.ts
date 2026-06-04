import { inBounds, key as posKey, step as stepDir } from '../geometry.js';
import type { Rng } from '../rng.js';
import { type Cell, DIRECTIONS, type Position, type WorldConfig } from '../types.js';
import { makeFloorGrid } from '../world.js';

const WALL_DENSITY = 0.22;

/**
 * Generate a connected wall layout: open grid with scattered walls, with
 * every floor cell guaranteed reachable from the agent's start corner.
 *
 * If random wall placement disconnects the map, walls along the boundary
 * of the unreachable region are removed until everything is reachable.
 */
export function generateLayout(
  rng: Rng,
  config: Pick<WorldConfig, 'width' | 'height'>,
  start: Position,
): Cell[][] {
  const grid = makeFloorGrid(config);

  for (let r = 0; r < config.height; r++) {
    for (let c = 0; c < config.width; c++) {
      if (r === start[0] && c === start[1]) continue;
      // never wall the cells immediately around the start — guarantees agent
      // can move on step 1 regardless of seed
      if (Math.abs(r - start[0]) + Math.abs(c - start[1]) <= 1) continue;
      if (rng.next() < WALL_DENSITY) {
        const row = grid[r];
        if (row) row[c] = { kind: 'wall' };
      }
    }
  }

  // ensure connectedness — open walls bordering reachable regions until
  // every floor cell is reachable from start
  let safety = config.width * config.height;
  while (safety-- > 0) {
    const reachable = reachableFloorCells(grid, start, config);
    const unreachableWalls = findFrontierWalls(grid, reachable, config);
    if (unreachableWalls.length === 0) break;
    const wall = rng.pick(unreachableWalls);
    const row = grid[wall[0]];
    if (row) row[wall[1]] = { kind: 'floor' };
  }

  return grid;
}

function reachableFloorCells(
  grid: readonly (readonly Cell[])[],
  start: Position,
  config: Pick<WorldConfig, 'width' | 'height'>,
): Set<string> {
  const seen = new Set<string>();
  const queue: Position[] = [start];
  seen.add(posKey(start));
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    for (const dir of DIRECTIONS) {
      const next = stepDir(cur, dir);
      if (!inBounds(next, config.width, config.height)) continue;
      const cell = grid[next[0]]?.[next[1]];
      if (!cell || cell.kind === 'wall') continue;
      const k = posKey(next);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push(next);
    }
  }
  return seen;
}

function findFrontierWalls(
  grid: readonly (readonly Cell[])[],
  reachable: Set<string>,
  config: Pick<WorldConfig, 'width' | 'height'>,
): Position[] {
  const walls: Position[] = [];
  for (let r = 0; r < config.height; r++) {
    for (let c = 0; c < config.width; c++) {
      if (grid[r]?.[c]?.kind !== 'wall') continue;
      // collect walls that border a reachable cell — knocking them down
      // grows the connected component, eventually swallowing every island
      for (const dir of DIRECTIONS) {
        const neighbor = stepDir([r, c], dir);
        if (reachable.has(posKey(neighbor))) {
          walls.push([r, c]);
          break;
        }
      }
    }
  }
  return walls;
}

/**
 * BFS distance from `start` to every reachable floor cell. Returns a map
 * of "r,c" → distance. Walls and out-of-bounds are excluded.
 */
export function distanceMap(
  grid: readonly (readonly Cell[])[],
  start: Position,
  config: Pick<WorldConfig, 'width' | 'height'>,
): Map<string, number> {
  const dist = new Map<string, number>();
  dist.set(posKey(start), 0);
  const queue: Position[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const here = dist.get(posKey(cur)) ?? 0;
    for (const dir of DIRECTIONS) {
      const next = stepDir(cur, dir);
      if (!inBounds(next, config.width, config.height)) continue;
      const cell = grid[next[0]]?.[next[1]];
      if (!cell || cell.kind === 'wall') continue;
      const k = posKey(next);
      if (dist.has(k)) continue;
      dist.set(k, here + 1);
      queue.push(next);
    }
  }
  return dist;
}
