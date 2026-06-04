'use client';

import {
  type Action,
  type Cell,
  type KeyColor,
  type Position,
  type WorldState,
  createWorld,
  step as simStep,
} from '@mentisix/sim';
import { useEffect, useRef, useState } from 'react';

const TOKENS = {
  void: '#0A0C10',
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

const KEY_BIT: Record<KeyColor, number> = { red: 1, blue: 2 };
const CELL_SIZE = 22;
const TURN_MS = 220;
const PAUSE_MS = 1100;

type Telemetry = { seed: number; step: number; status: 'live' | 'won' };

/**
 * Live demo loop — runs a BFS-driven agent against fresh procgen seeds
 * forever, in the browser, no API hits. Pure ambient theatre for the
 * landing page. Each seed: generate → plan optimal solve → animate →
 * brief pause → next seed.
 */
export function DemoLoop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<WorldState | null>(null);
  const displayRef = useRef<{ r: number; c: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry>({ seed: 0, step: 0, status: 'live' });

  useEffect(() => {
    let cancelled = false;
    let seed = Math.floor(Math.random() * 10_000);
    let plan: Action[] = [];
    let planIdx = 0;
    let world: WorldState | null = null;
    let lastTurn = performance.now();

    function newWorld() {
      world = createWorld(seed);
      worldRef.current = world;
      plan = planSolve(world);
      planIdx = 0;
      displayRef.current = { r: world.agent[0], c: world.agent[1] };
      setTelemetry({ seed, step: 0, status: 'live' });
    }

    function tick(now: number) {
      if (cancelled) return;
      if (!world) {
        newWorld();
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (world.status === 'running' && planIdx < plan.length && now - lastTurn >= TURN_MS) {
        const action = plan[planIdx];
        if (action) world = simStep(world, action);
        worldRef.current = world;
        planIdx += 1;
        lastTurn = now;
        setTelemetry({
          seed,
          step: world.step,
          status: world.status === 'won' ? 'won' : 'live',
        });
      }

      lerpAgent();
      paint();

      if (world.status === 'won' || world.status === 'lost' || planIdx >= plan.length) {
        if (now - lastTurn >= TURN_MS + PAUSE_MS) {
          seed = (seed + 1) % 1_000_000;
          newWorld();
          lastTurn = now;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function lerpAgent() {
      if (!world) return;
      const d = displayRef.current;
      if (!d) return;
      const target = world.agent;
      const lerp = 0.18;
      d.r += (target[0] - d.r) * lerp;
      d.c += (target[1] - d.c) * lerp;
    }

    function paint() {
      const canvas = canvasRef.current;
      if (!canvas || !world) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cols = world.config.width;
      const rows = world.config.height;
      const W = cols * CELL_SIZE;
      const H = rows * CELL_SIZE;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.fillStyle = TOKENS.void;
      ctx.fillRect(0, 0, W, H);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = world.grid[r]?.[c];
          paintCell(ctx, cell, c * CELL_SIZE, r * CELL_SIZE);
        }
      }

      ctx.strokeStyle = TOKENS.lineSoft;
      ctx.lineWidth = 1;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE + 0.5, 0);
        ctx.lineTo(i * CELL_SIZE + 0.5, H);
        ctx.stroke();
      }
      for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE + 0.5);
        ctx.lineTo(W, i * CELL_SIZE + 0.5);
        ctx.stroke();
      }

      const d = displayRef.current;
      if (d) {
        const cx = d.c * CELL_SIZE + CELL_SIZE / 2;
        const cy = d.r * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillStyle = 'rgba(0,229,176,0.14)';
        ctx.beginPath();
        ctx.arc(cx, cy, CELL_SIZE * 0.95, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = TOKENS.signal;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL_SIZE * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    tick(performance.now());

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        padding: 16,
        border: `1px solid ${TOKENS.line}`,
        background: `linear-gradient(${TOKENS.slate}, ${TOKENS.void})`,
        borderRadius: 3,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -8,
          right: 12,
          padding: '2px 8px',
          background: TOKENS.void,
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 9.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: TOKENS.fog,
        }}
      >
        Live · loop
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', background: TOKENS.void }} />
      <div
        className="mx-tabular"
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 16,
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: TOKENS.fog,
        }}
      >
        <span>
          SEED <span style={{ color: TOKENS.bone }}>{String(telemetry.seed).padStart(4, '0')}</span>
        </span>
        <span>
          STEP <span style={{ color: TOKENS.bone }}>{String(telemetry.step).padStart(3, '0')}</span>
        </span>
        <span style={{ color: telemetry.status === 'won' ? TOKENS.signal : TOKENS.fog }}>
          {telemetry.status === 'won' ? '✓ solved' : '· running'}
        </span>
      </div>
    </div>
  );
}

function paintCell(ctx: CanvasRenderingContext2D, cell: Cell | undefined, x: number, y: number) {
  if (!cell) return;
  if (cell.kind === 'wall') {
    ctx.fillStyle = TOKENS.slate2;
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    return;
  }
  if (cell.kind === 'treasure') {
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;
    ctx.fillStyle = TOKENS.signal;
    ctx.beginPath();
    ctx.moveTo(cx, cy - CELL_SIZE * 0.28);
    ctx.lineTo(cx + CELL_SIZE * 0.28, cy);
    ctx.lineTo(cx, cy + CELL_SIZE * 0.28);
    ctx.lineTo(cx - CELL_SIZE * 0.28, cy);
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (cell.kind === 'key') {
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;
    ctx.strokeStyle = TOKENS.bone;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }
  if (cell.kind === 'door' && !cell.open) {
    const pad = CELL_SIZE * 0.2;
    ctx.strokeStyle = TOKENS.bone;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2);
  }
}

/**
 * Optimal-solve BFS for the demo — sees the whole grid (this is theatre,
 * not the dojo). Search space is bounded by (cells × 2^keys × 2^treasures)
 * so for the 12×12 world this terminates in single-digit ms.
 */
function planSolve(world: WorldState): Action[] {
  const treasureCells: Position[] = [];
  for (let r = 0; r < world.config.height; r++) {
    for (let c = 0; c < world.config.width; c++) {
      if (world.grid[r]?.[c]?.kind === 'treasure') treasureCells.push([r, c]);
    }
  }
  const treasureAll = (1 << treasureCells.length) - 1;
  const treasureIndex = new Map<string, number>();
  treasureCells.forEach((p, i) => treasureIndex.set(key(p), i));

  type Node = {
    pos: Position;
    keys: number;
    treasures: number;
    path: Action[];
  };

  const startState = collect(world.grid, treasureIndex, {
    pos: world.agent,
    keys: 0,
    treasures: 0,
    path: [],
  });

  const seen = new Set<string>([stateKey(startState)]);
  const queue: Node[] = [startState];

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    if (cur.treasures === treasureAll) return cur.path;

    for (const dir of ['north', 'south', 'east', 'west'] as const) {
      const target = move(cur.pos, dir);
      if (target[0] < 0 || target[1] < 0) continue;
      if (target[0] >= world.config.height || target[1] >= world.config.width) continue;
      const cell = world.grid[target[0]]?.[target[1]];
      if (!cell || cell.kind === 'wall') continue;

      const actions: Action[] = [];
      if (cell.kind === 'door' && !cell.open) {
        const bit = KEY_BIT[cell.color];
        if ((cur.keys & bit) === 0) continue;
        actions.push({ kind: 'use_key', direction: dir, color: cell.color });
      }
      actions.push({ kind: 'move', direction: dir });

      const moved = collectMaybePickUp(world.grid, treasureIndex, {
        pos: target,
        keys: cur.keys,
        treasures: cur.treasures,
        path: [...cur.path, ...actions],
      });

      const sk = stateKey(moved);
      if (seen.has(sk)) continue;
      seen.add(sk);
      queue.push(moved);
    }
  }
  return [];
}

function collect(
  grid: readonly (readonly Cell[])[],
  treasureIndex: Map<string, number>,
  n: { pos: Position; keys: number; treasures: number; path: Action[] },
) {
  const cell = grid[n.pos[0]]?.[n.pos[1]];
  if (!cell) return n;
  if (cell.kind === 'key') return { ...n, keys: n.keys | KEY_BIT[cell.color] };
  if (cell.kind === 'treasure') {
    const idx = treasureIndex.get(key(n.pos));
    if (idx === undefined) return n;
    return { ...n, treasures: n.treasures | (1 << idx) };
  }
  return n;
}

function collectMaybePickUp(
  grid: readonly (readonly Cell[])[],
  treasureIndex: Map<string, number>,
  n: { pos: Position; keys: number; treasures: number; path: Action[] },
) {
  const cell = grid[n.pos[0]]?.[n.pos[1]];
  if (cell?.kind === 'key' || cell?.kind === 'treasure') {
    return collect(grid, treasureIndex, {
      ...n,
      path: [...n.path, { kind: 'pick_up' }],
    });
  }
  return n;
}

function stateKey(n: { pos: Position; keys: number; treasures: number }): string {
  return `${n.pos[0]},${n.pos[1]}|${n.keys}|${n.treasures}`;
}

function key(p: Position): string {
  return `${p[0]},${p[1]}`;
}

function move(p: Position, dir: 'north' | 'south' | 'east' | 'west'): Position {
  if (dir === 'north') return [p[0] - 1, p[1]];
  if (dir === 'south') return [p[0] + 1, p[1]];
  if (dir === 'east') return [p[0], p[1] + 1];
  return [p[0], p[1] - 1];
}
