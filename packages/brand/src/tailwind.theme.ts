/**
 * MENTISIX. Tailwind theme extension
 * Merge `theme.extend` into your tailwind.config.{js,ts}.
 * Pairs with shadcn/ui: map shadcn CSS vars to these in globals.css.
 *
 * Usage: bg-void, text-bone, border-line, text-signal, font-mono, rounded-xs ...
 */
export const mentisixTheme = {
  extend: {
    colors: {
      void: { DEFAULT: '#0A0C10', 2: '#07090C' },
      slate: { DEFAULT: '#11141A', 2: '#161A22' }, // note: override Tailwind's stock `slate` intentionally
      line: { DEFAULT: '#1C2230', soft: '#151A22' },
      bone: { DEFAULT: '#E8EEF2', page: '#F2F2EC' },
      fog: { DEFAULT: '#7A8694', dim: '#4A5460' },
      signal: { DEFAULT: '#00E5B0', dim: '#0B6E58' },
      fault: '#FF5A4D',
    },
    fontFamily: {
      sans: ['General Sans', 'ui-sans-serif', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
    },
    fontSize: {
      display: ['88px', { lineHeight: '0.86', letterSpacing: '-0.045em', fontWeight: '600' }],
      h1: ['52px', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '600' }],
      h2: ['32px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '600' }],
    },
    letterSpacing: { mono: '0.1em' },
    borderRadius: { xs: '2px', sm: '3px' },
    boxShadow: { signal: '0 0 28px -8px #00E5B0' },
    transitionTimingFunction: { instrument: 'cubic-bezier(.2,.6,.2,1)' },
  },
};

export default { theme: mentisixTheme };
