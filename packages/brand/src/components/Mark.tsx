import type { ReactNode, SVGAttributes } from 'react';
import { GRID_SIZE, LIT_CELLS, type MarkOptions } from '../mark.js';
import { color } from '../tokens.js';

export type MarkProps = Omit<SVGAttributes<SVGSVGElement>, 'children'> &
  MarkOptions & {
    size?: number;
  };

/**
 * Mentisix lattice mark — React component.
 *
 * Renders the 6×6 grid with 16 lit cells tracing an "M". By default the lit
 * cells fill with `--mx-signal` (#00E5B0) and the fog cells show as faint
 * lattice. Pass `lit="currentColor"` and `showFog={false}` for monochrome use.
 */
export function Mark({
  size = 120,
  lit = color.signal,
  fogFill = '#0F141B',
  fogStroke = color.line,
  showFog = true,
  ...rest
}: MarkProps) {
  const gap = size * 0.085;
  const cellSize = (size - gap * (GRID_SIZE - 1)) / GRID_SIZE;
  const rx = cellSize * 0.06;

  const cells: ReactNode[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const x = c * (cellSize + gap);
      const y = r * (cellSize + gap);
      const isLit = LIT_CELLS.has(`${c},${r}`);
      if (isLit) {
        cells.push(
          <rect
            key={`${c}-${r}`}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            width={cellSize.toFixed(2)}
            height={cellSize.toFixed(2)}
            rx={rx.toFixed(2)}
            fill={lit}
          />,
        );
      } else if (showFog) {
        cells.push(
          <rect
            key={`${c}-${r}`}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            width={cellSize.toFixed(2)}
            height={cellSize.toFixed(2)}
            rx={rx.toFixed(2)}
            fill={fogFill}
            stroke={fogStroke}
            strokeWidth={1}
          />,
        );
      }
    }
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Mentisix"
      {...rest}
    >
      {cells}
    </svg>
  );
}
