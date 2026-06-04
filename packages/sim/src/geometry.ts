import type { Direction, Position } from './types.js';

export function step(pos: Position, dir: Direction): Position {
  const [r, c] = pos;
  switch (dir) {
    case 'north':
      return [r - 1, c];
    case 'south':
      return [r + 1, c];
    case 'east':
      return [r, c + 1];
    case 'west':
      return [r, c - 1];
  }
}

export function inBounds(pos: Position, width: number, height: number): boolean {
  const [r, c] = pos;
  return r >= 0 && r < height && c >= 0 && c < width;
}

export function manhattan(a: Position, b: Position): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

export function key(pos: Position): string {
  return `${pos[0]},${pos[1]}`;
}

export function parseKey(k: string): Position {
  const [r, c] = k.split(',').map(Number) as [number, number];
  return [r, c];
}
