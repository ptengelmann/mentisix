import type { Cell } from '@mentisix/sim';
import type { RunEvent } from '@mentisix/types';
import { ImageResponse } from 'next/og';
import type React from 'react';

export const runtime = 'edge';
export const alt = 'Mentisix run replay';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const C = {
  void: '#0A0C10',
  slate: '#11141A',
  line: '#1C2230',
  bone: '#E8EEF2',
  fog: '#7A8694',
  fogDim: '#4A5460',
  signal: '#00E5B0',
  signalDim: '#0B6E58',
};

type Replay = {
  summary: {
    id: string;
    seed: number;
    status: string;
    score: number | null;
    stepsUsed: number;
    model: { provider: string; model: string };
    handle?: string;
  };
  events: RunEvent[];
};

async function fetchReplay(id: string): Promise<Replay | null> {
  try {
    const res = await fetch(`${API_URL}/runs/${encodeURIComponent(id)}/replay`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as Replay;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const replay = await fetchReplay(id);
  if (!replay) return fallback('Replay not found');

  const { summary, events } = replay;
  const hello = events.find((e) => e.kind === 'hello');
  if (!hello || hello.kind !== 'hello') return fallback('Replay incomplete');
  const world = hello.initialWorld;
  const grid = world.grid;
  const path: Array<readonly [number, number]> = [];
  path.push(world.agent);
  for (const e of events) {
    if (e.kind === 'state') path.push(e.agent);
  }

  const passed = summary.status === 'passed';
  const accent = passed ? C.signal : C.fog;
  const headline = passed ? 'CLEARED' : summary.status === 'failed' ? 'FAILED' : 'RAN';

  // Grid geometry. 12×12 fitted to ~560px square on the left.
  const gridPx = 540;
  const cellPx = gridPx / world.width;
  const ox = 76;
  const oy = (size.height - gridPx) / 2;

  return new ImageResponse(
    <div
      style={{
        width: size.width,
        height: size.height,
        background: C.void,
        display: 'flex',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(80% 70% at 70% 30%, rgba(11,110,88,0.18) 0%, rgba(10,12,16,0) 60%)',
        }}
      />
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        <title>Mentisix replay</title>
        <rect
          x={ox - 2}
          y={oy - 2}
          width={gridPx + 4}
          height={gridPx + 4}
          fill="none"
          stroke={C.line}
          strokeWidth={1}
        />
        {drawCells(grid, ox, oy, cellPx)}
        {drawGridLines(world.width, world.height, ox, oy, cellPx)}
        {drawPath(path, ox, oy, cellPx, accent)}
        {drawAgent(path[path.length - 1], ox, oy, cellPx, accent)}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: ox + gridPx + 60,
          top: 72,
          right: 60,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: 6,
            color: C.fogDim,
            textTransform: 'uppercase',
          }}
        >
          Mentisix · seed {summary.seed}
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -3,
            color: accent,
            marginTop: 18,
            lineHeight: 1,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 168,
            fontWeight: 700,
            letterSpacing: -6,
            color: C.bone,
            marginTop: 6,
            lineHeight: 1,
          }}
        >
          {summary.score ?? '·'}
        </div>
        <div
          style={{
            fontSize: 18,
            letterSpacing: 4,
            color: C.fog,
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        >
          Score · {summary.stepsUsed} steps
        </div>

        <div
          style={{
            marginTop: 56,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {summary.handle ? (
            <div style={{ fontSize: 28, color: accent, letterSpacing: 1 }}>@{summary.handle}</div>
          ) : null}
          <div style={{ fontSize: 30, color: C.bone, letterSpacing: -0.5 }}>
            {summary.model.model}
          </div>
          <div
            style={{ fontSize: 16, color: C.fogDim, letterSpacing: 4, textTransform: 'uppercase' }}
          >
            {summary.model.provider}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: ox + gridPx + 60,
          bottom: 60,
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: -2,
            color: C.bone,
          }}
        >
          MENTIS<span style={{ color: C.signal }}>IX</span>
        </div>
        <div
          style={{ fontSize: 14, color: C.fogDim, letterSpacing: 4, textTransform: 'uppercase' }}
        >
          a proving ground
        </div>
      </div>
    </div>,
    size,
  );
}

function drawCells(grid: readonly (readonly Cell[])[], ox: number, oy: number, s: number) {
  const out: React.ReactElement[] = [];
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) continue;
      const x = ox + c * s;
      const y = oy + r * s;
      if (cell.kind === 'wall') {
        out.push(
          <rect
            key={`w-${r}-${c}`}
            x={x + 1}
            y={y + 1}
            width={s - 2}
            height={s - 2}
            fill={C.slate}
          />,
        );
      } else if (cell.kind === 'treasure') {
        const cx = x + s / 2;
        const cy = y + s / 2;
        const h = s * 0.26;
        out.push(
          <polygon
            key={`t-${r}-${c}`}
            points={`${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`}
            fill={C.signal}
          />,
        );
      } else if (cell.kind === 'door') {
        const pad = s * 0.18;
        out.push(
          <rect
            key={`d-${r}-${c}`}
            x={x + pad}
            y={y + pad}
            width={s - pad * 2}
            height={s - pad * 2}
            fill="none"
            stroke={C.bone}
            strokeWidth={1.5}
          />,
        );
      } else if (cell.kind === 'key') {
        const cx = x + s / 2;
        const cy = y + s / 2;
        out.push(
          <circle
            key={`k-${r}-${c}`}
            cx={cx}
            cy={cy}
            r={s * 0.18}
            fill="none"
            stroke={C.bone}
            strokeWidth={1.5}
          />,
        );
      }
    }
  }
  return out;
}

function drawGridLines(cols: number, rows: number, ox: number, oy: number, s: number) {
  const out: React.ReactElement[] = [];
  for (let i = 0; i <= cols; i++) {
    out.push(
      <line
        key={`v-${i}`}
        x1={ox + i * s}
        y1={oy}
        x2={ox + i * s}
        y2={oy + rows * s}
        stroke={C.line}
        strokeWidth={0.5}
      />,
    );
  }
  for (let i = 0; i <= rows; i++) {
    out.push(
      <line
        key={`h-${i}`}
        x1={ox}
        y1={oy + i * s}
        x2={ox + cols * s}
        y2={oy + i * s}
        stroke={C.line}
        strokeWidth={0.5}
      />,
    );
  }
  return out;
}

function drawPath(
  path: ReadonlyArray<readonly [number, number]>,
  ox: number,
  oy: number,
  s: number,
  color: string,
) {
  if (path.length < 2) return [];
  let d = '';
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    if (!p) continue;
    const cx = ox + p[1] * s + s / 2;
    const cy = oy + p[0] * s + s / 2;
    d += `${i === 0 ? 'M' : 'L'}${cx},${cy} `;
  }
  return [
    <path
      key="trail"
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity={0.85}
    />,
  ];
}

function drawAgent(
  pos: readonly [number, number] | undefined,
  ox: number,
  oy: number,
  s: number,
  color: string,
) {
  if (!pos) return [];
  const cx = ox + pos[1] * s + s / 2;
  const cy = oy + pos[0] * s + s / 2;
  return [
    <circle key="halo" cx={cx} cy={cy} r={s * 0.7} fill={color} opacity={0.16} />,
    <circle key="dot" cx={cx} cy={cy} r={s * 0.3} fill={color} />,
  ];
}

function fallback(message: string) {
  return new ImageResponse(
    <div
      style={{
        width: size.width,
        height: size.height,
        background: C.void,
        color: C.bone,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: 48,
        letterSpacing: -2,
      }}
    >
      {message}
    </div>,
    size,
  );
}
