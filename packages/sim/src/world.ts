import type { Cell, Position, WorldConfig, WorldState } from './types.js';

export function cellAt(world: WorldState, pos: Position): Cell | null {
  const [r, c] = pos;
  if (r < 0 || r >= world.config.height) return null;
  if (c < 0 || c >= world.config.width) return null;
  return world.grid[r]?.[c] ?? null;
}

export function setCell(grid: readonly (readonly Cell[])[], pos: Position, cell: Cell): Cell[][] {
  const [r, c] = pos;
  return grid.map((row, rr) =>
    rr === r ? row.map((existing, cc) => (cc === c ? cell : existing)) : row.slice(),
  );
}

export function totalTreasures(grid: readonly (readonly Cell[])[]): number {
  let n = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.kind === 'treasure') n++;
    }
  }
  return n;
}

export function makeFloorGrid(config: Pick<WorldConfig, 'width' | 'height'>): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < config.height; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < config.width; c++) row.push({ kind: 'floor' });
    grid.push(row);
  }
  return grid;
}

export function isTerminal(world: WorldState): boolean {
  return world.status !== 'running';
}
