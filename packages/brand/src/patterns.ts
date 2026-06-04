/**
 * Mentisix generative lattice patterns. canvas renderers.
 *
 * Four brand motifs, all derived from the grid. Use at low contrast as
 * texture, never as noise. Honors prefers-reduced-motion (single static
 * frame, then halts the RAF loop).
 *
 *   import { initPattern } from '@mentisix/brand/patterns';
 *   const stop = initPattern(canvasEl, 'fog');
 *   // later: stop();
 */

export type PatternKind = 'lattice' | 'fog' | 'path' | 'scan';

export type PatternOptions = {
  /** Cell size in CSS pixels. Default 26. */
  cell?: number;
  /** RGB triplet for the signal accent. Default rgb of #00E5B0. */
  signal?: string;
  /** RGB triplet for the lattice line. Default rgb of #1C2230. */
  line?: string;
};

const DEFAULTS = {
  cell: 26,
  signal: '0,229,176',
  line: '28,34,48',
} as const;

export function initPattern(
  canvas: HTMLCanvasElement,
  kind: PatternKind = 'lattice',
  options: PatternOptions = {},
): () => void {
  const ctxNullable = canvas.getContext('2d');
  if (!ctxNullable) return () => {};
  const ctx = ctxNullable;

  const cell = options.cell ?? DEFAULTS.cell;
  const signal = options.signal ?? DEFAULTS.signal;
  const line = options.line ?? DEFAULTS.line;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0;
  let H = 0;
  let t = 0;
  let raf = 0;
  let running = true;

  function size(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function grid(alpha = 0.7): void {
    ctx.strokeStyle = `rgba(${line},${alpha})`;
    ctx.lineWidth = 1;
    const cols = Math.ceil(W / cell) + 1;
    const rows = Math.ceil(H / cell) + 1;
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cell + 0.5, 0);
      ctx.lineTo(c * cell + 0.5, H);
      ctx.stroke();
    }
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cell + 0.5);
      ctx.lineTo(W, r * cell + 0.5);
      ctx.stroke();
    }
  }

  function draw(): void {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const cols = Math.ceil(W / cell) + 1;
    const rows = Math.ceil(H / cell) + 1;

    if (kind === 'lattice') {
      grid(0.9);
      for (const [c, r] of [
        [3, 2],
        [7, 4],
        [5, 6],
        [10, 3],
      ] as const) {
        ctx.fillStyle = `rgba(${signal},.5)`;
        ctx.fillRect(c * cell + 2, r * cell + 2, cell - 3, cell - 3);
      }
    } else if (kind === 'fog') {
      const cx = (0.5 + 0.32 * Math.sin(t * 0.012)) * W;
      const cy = (0.5 + 0.3 * Math.cos(t * 0.01)) * H;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cell;
          const y = r * cell;
          const d = Math.hypot(x + cell / 2 - cx, y + cell / 2 - cy);
          const rev = Math.max(0, 1 - d / 120);
          ctx.fillStyle = `rgba(${signal},${rev * rev * 0.4})`;
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          ctx.strokeStyle = `rgba(${line},${0.4 + rev * 0.6})`;
          ctx.strokeRect(x + 0.5, y + 0.5, cell, cell);
        }
      }
    } else if (kind === 'path') {
      grid(0.6);
      const path = [
        [1, 5],
        [2, 5],
        [3, 5],
        [3, 4],
        [3, 3],
        [4, 3],
        [5, 3],
        [5, 2],
        [6, 2],
        [7, 2],
        [7, 3],
        [7, 4],
        [8, 4],
        [9, 4],
        [10, 4],
        [10, 3],
        [11, 3],
      ] as const;
      const head = reduce ? path.length : Math.floor(t * 0.08) % (path.length + 8);
      path.forEach(([c, r], i) => {
        if (i > head) return;
        const a = Math.max(0.12, 1 - (head - i) * 0.12);
        ctx.fillStyle = `rgba(${signal},${a})`;
        ctx.fillRect(c * cell + 3, r * cell + 3, cell - 5, cell - 5);
      });
    } else if (kind === 'scan') {
      ctx.strokeStyle = `rgba(${line},.7)`;
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cell + 0.5);
        ctx.lineTo(W, r * cell + 0.5);
        ctx.stroke();
      }
      const sx = ((t * 1.6) % (W + 60)) - 30;
      const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
      g.addColorStop(0, `rgba(${signal},0)`);
      g.addColorStop(0.5, `rgba(${signal},.5)`);
      g.addColorStop(1, `rgba(${signal},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(sx - 40, 0, 80, H);
      ctx.strokeStyle = `rgba(${signal},.9)`;
      ctx.beginPath();
      ctx.moveTo(sx + 0.5, 0);
      ctx.lineTo(sx + 0.5, H);
      ctx.stroke();
    }

    t++;
    if (!reduce || t < 2) raf = requestAnimationFrame(draw);
  }

  size();
  draw();
  const onResize = (): void => size();
  window.addEventListener('resize', onResize);

  return function stop(): void {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}
