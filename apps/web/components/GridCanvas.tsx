'use client';

import type { Cell, KeyColor, Position } from '@mentisix/sim';
import { useEffect, useRef } from 'react';

const TOKENS = {
  void: '#0A0C10',
  void2: '#07090C',
  slate: '#11141A',
  slate2: '#161A22',
  line: '#1C2230',
  lineSoft: '#151A22',
  bone: '#E8EEF2',
  fog: '#7A8694',
  fogDim: '#4A5460',
  signal: '#00E5B0',
  signalDim: '#0B6E58',
};

export type GridCanvasProps = {
  grid: readonly (readonly Cell[])[] | null;
  agent: Position | null;
  seenCells: ReadonlySet<string>;
  visionRadius: number;
  inventory: readonly KeyColor[];
  cellSize?: number;
};

/**
 * Renders the Treasure Hunt grid. Cells the agent has never observed are
 * fogged. Cells inside the current vision window get a faint signal tint.
 * The agent itself animates between positions for ~180ms.
 */
export function GridCanvas({
  grid,
  agent,
  seenCells,
  visionRadius,
  cellSize = 36,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const agentDisplayRef = useRef<{ r: number; c: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cols = grid[0]?.length ?? 0;
    const rows = grid.length;
    const cssW = cols * cellSize;
    const cssH = rows * cellSize;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (agent && !agentDisplayRef.current) {
      agentDisplayRef.current = { r: agent[0], c: agent[1] };
    }

    let cancelled = false;

    function render() {
      if (cancelled || !ctx || !grid) return;
      const display = agentDisplayRef.current;
      if (agent && display) {
        const lerp = 0.22;
        display.r += (agent[0] - display.r) * lerp;
        display.c += (agent[1] - display.c) * lerp;
      }
      drawWorld({
        ctx,
        grid,
        agent: display,
        seenCells,
        visionRadius,
        cellSize,
        cols,
        rows,
      });
      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelled = true;
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [grid, agent, seenCells, visionRadius, cellSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        background: TOKENS.void,
        border: `1px solid ${TOKENS.line}`,
        borderRadius: 2,
      }}
    />
  );
}

type DrawArgs = {
  ctx: CanvasRenderingContext2D;
  grid: readonly (readonly Cell[])[];
  agent: { r: number; c: number } | null;
  seenCells: ReadonlySet<string>;
  visionRadius: number;
  cellSize: number;
  cols: number;
  rows: number;
};

function drawWorld({ ctx, grid, agent, seenCells, visionRadius, cellSize, cols, rows }: DrawArgs) {
  const W = cols * cellSize;
  const H = rows * cellSize;

  ctx.fillStyle = TOKENS.void;
  ctx.fillRect(0, 0, W, H);

  const visionHalf = (visionRadius - 1) / 2;
  const ar = agent ? agent.r : -10;
  const ac = agent ? agent.c : -10;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const seen = seenCells.has(`${r},${c}`);
      const inVision = agent && Math.abs(r - ar) <= visionHalf && Math.abs(c - ac) <= visionHalf;
      drawCell(ctx, grid[r]?.[c], x, y, cellSize, seen, !!inVision);
    }
  }

  ctx.strokeStyle = TOKENS.line;
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize + 0.5, 0);
    ctx.lineTo(i * cellSize + 0.5, H);
    ctx.stroke();
  }
  for (let i = 0; i <= rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize + 0.5);
    ctx.lineTo(W, i * cellSize + 0.5);
    ctx.stroke();
  }

  if (agent) {
    const cx = agent.c * cellSize + cellSize / 2;
    const cy = agent.r * cellSize + cellSize / 2;
    ctx.fillStyle = 'rgba(0,229,176,0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy, cellSize * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = TOKENS.signal;
    ctx.beginPath();
    ctx.arc(cx, cy, cellSize * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: Cell | undefined,
  x: number,
  y: number,
  s: number,
  seen: boolean,
  inVision: boolean,
) {
  if (!cell) return;

  if (!seen) {
    ctx.fillStyle = TOKENS.lineSoft;
    ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    return;
  }

  if (inVision) {
    ctx.fillStyle = 'rgba(0,229,176,0.04)';
    ctx.fillRect(x, y, s, s);
  }

  if (cell.kind === 'wall') {
    ctx.fillStyle = TOKENS.slate2;
    ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    return;
  }

  if (cell.kind === 'treasure') {
    const cx = x + s / 2;
    const cy = y + s / 2;
    ctx.fillStyle = TOKENS.signal;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.26);
    ctx.lineTo(cx + s * 0.26, cy);
    ctx.lineTo(cx, cy + s * 0.26);
    ctx.lineTo(cx - s * 0.26, cy);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (cell.kind === 'key') {
    const cx = x + s / 2;
    const cy = y + s / 2;
    ctx.strokeStyle = TOKENS.bone;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = TOKENS.bone;
    ctx.font = `600 ${Math.round(s * 0.36)}px JetBrains Mono, ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cell.color === 'red' ? 'R' : 'B', cx, cy + s * 0.02);
    return;
  }

  if (cell.kind === 'door') {
    const pad = s * 0.18;
    ctx.strokeStyle = cell.open ? TOKENS.signalDim : TOKENS.bone;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + pad, y + pad, s - pad * 2, s - pad * 2);
    if (!cell.open) {
      ctx.fillStyle = TOKENS.bone;
      ctx.font = `600 ${Math.round(s * 0.32)}px JetBrains Mono, ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.color === 'red' ? 'R' : 'B', x + s / 2, y + s / 2 + s * 0.02);
    }
  }
}
