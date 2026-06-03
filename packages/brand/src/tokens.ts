/**
 * Mentisix design tokens — typed mirror of `tokens.css` / `tokens.json`.
 * The CSS variables in `./styles/tokens.css` are the runtime source of truth;
 * these TS exports are for use in code (Tailwind, canvas, SVG, etc).
 */

export const color = {
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
  fault: '#FF5A4D',
  bonePage: '#F2F2EC',
} as const;

export type ColorToken = keyof typeof color;

export const font = {
  sans: "'General Sans', ui-sans-serif, system-ui, 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

export const type = {
  display: { size: 88, weight: 600, tracking: '-0.045em' },
  h1: { size: 52, weight: 600, tracking: '-0.03em' },
  h2: { size: 32, weight: 600, tracking: '-0.02em' },
  body: { size: 16, weight: 400, tracking: '0' },
  small: { size: 13, weight: 400, tracking: '0' },
  mono: { size: 12, weight: 500, tracking: '0.1em' },
} as const;

export const radius = {
  xs: '2px',
  sm: '3px',
  cell: '6%',
} as const;

export const space = {
  1: '8px',
  2: '14px',
  3: '24px',
  4: '40px',
  5: '64px',
  cell: '14px',
} as const;

export const motion = {
  ease: 'cubic-bezier(.2,.6,.2,1)',
  durFast: '0.2s',
  dur: '0.25s',
  durSlow: '0.8s',
} as const;

export const glow = {
  signal: '0 0 28px -8px #00E5B0',
} as const;

export const brand = {
  name: 'Mentisix',
  tagline: 'A proving ground for machine minds.',
  version: '0.1.0',
} as const;

/**
 * The 8 hard rules — surfaced in code so we can assert against them in tests
 * and reference them in docs without drifting from the canonical README.
 */
export const HARD_RULES = [
  'Neutrals >= 92% of any surface; signal mint <= 8%.',
  'Mint = the agent / live / pass / primary CTA. Never a generic accent.',
  'Fault red = failure or destructive only. Never decorative.',
  'All numeric data uses JetBrains Mono with tabular-nums.',
  'Mono = machine voice (labels, data, code, status). UPPERCASE + 0.1em tracking.',
  'Sharp corners (2-3px). Instrument, not consumer app.',
  'No emoji, no third-party icon library. Use @mentisix/brand/icons only.',
  'No gradient backgrounds. Depth comes from the lattice, low-contrast.',
] as const;
