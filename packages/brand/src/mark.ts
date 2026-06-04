/**
 * Mentisix lattice mark. generator.
 *
 * The logo is a 6x6 grid; 16 lit cells trace an "M". the path an agent
 * walked through a maze. Pure functions: render to data, then to SVG string,
 * or use the React component in `./components/Mark.tsx`.
 */

import { color } from './tokens.js';

export const GRID_SIZE = 6;

export const LIT_CELLS: ReadonlySet<string> = (() => {
  const s = new Set<string>();
  for (let r = 0; r < GRID_SIZE; r++) {
    s.add(`0,${r}`);
    s.add(`${GRID_SIZE - 1},${r}`);
  }
  for (const k of ['1,1', '4,1', '2,2', '3,2']) s.add(k);
  return s;
})();

export type MarkCell = {
  c: number;
  r: number;
  x: number;
  y: number;
  size: number;
  rx: number;
  lit: boolean;
};

export type MarkOptions = {
  /** Lit cell fill. defaults to signal mint. Pass 'currentColor' for mono use. */
  lit?: string;
  /** Fog cell fill. defaults to a slightly-raised slate. */
  fogFill?: string;
  /** Fog cell stroke. defaults to lattice line. */
  fogStroke?: string;
  /** Whether to render the unlit fog cells at all. */
  showFog?: boolean;
};

const DEFAULTS: Required<MarkOptions> = {
  lit: color.signal,
  fogFill: '#0F141B',
  fogStroke: color.line,
  showFog: true,
};

export function markCells(size: number): MarkCell[] {
  const gap = size * 0.085;
  const cellSize = (size - gap * (GRID_SIZE - 1)) / GRID_SIZE;
  const rx = cellSize * 0.06;
  const cells: MarkCell[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      cells.push({
        c,
        r,
        x: c * (cellSize + gap),
        y: r * (cellSize + gap),
        size: cellSize,
        rx,
        lit: LIT_CELLS.has(`${c},${r}`),
      });
    }
  }
  return cells;
}

export function markSVG(size = 120, options: MarkOptions = {}): string {
  const opts = { ...DEFAULTS, ...options };
  let body = '';
  for (const cell of markCells(size)) {
    const { x, y, size: w, rx, lit } = cell;
    if (lit) {
      body += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${w.toFixed(2)}" rx="${rx.toFixed(2)}" fill="${opts.lit}"/>`;
    } else if (opts.showFog) {
      body += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${w.toFixed(2)}" rx="${rx.toFixed(2)}" fill="${opts.fogFill}" stroke="${opts.fogStroke}" stroke-width="1"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%" role="img" aria-label="Mentisix">${body}</svg>`;
}
