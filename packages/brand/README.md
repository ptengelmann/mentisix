# @mentisix/brand

Design tokens, lattice mark, generative patterns, and the bespoke cell-glyph icon set for Mentisix. **This package is the single source of truth for the visual identity** — apps and other packages MUST consume from here rather than reproducing tokens locally.

## Usage

### Stylesheets

Import the tokens and fonts once at the root of your app (e.g. `apps/web/app/globals.css`):

```css
@import '@mentisix/brand/styles/fonts.css';
@import '@mentisix/brand/styles/tokens.css';
```

### Tokens in TS

```ts
import { color, type, radius, motion } from '@mentisix/brand/tokens';

const signal = color.signal; // '#00E5B0'
```

### The mark

```tsx
import { Mark } from '@mentisix/brand/components';

<Mark size={96} />                                 // signal mint + fog lattice
<Mark size={24} showFog={false} />                 // small, solid mint
<Mark size={64} lit="currentColor" showFog={false} /> // monochrome
```

For non-React contexts, `markSVG(size, opts)` from `@mentisix/brand/mark` returns an SVG string.

### Generative patterns

```tsx
import { Pattern } from '@mentisix/brand/components';

<div style={{ position: 'relative', height: 280 }}>
  <Pattern kind="fog" />
</div>
```

Or imperatively against a `<canvas>`:

```ts
import { initPattern } from '@mentisix/brand/patterns';
const stop = initPattern(canvasEl, 'fog'); // 'lattice' | 'fog' | 'path' | 'scan'
```

### Icons

```tsx
import { AgentIcon, KeyIcon, TreasureIcon } from '@mentisix/brand/icons';

<AgentIcon size={32} />
<KeyIcon  size={32} />
```

The 12 bespoke cell glyphs: **Agent, Key, Door, Treasure, Wall, Fog, Move, Seed, Run, Score, Token, Replay**. Mint accents stay mint; the neutral parts respect `currentColor`.

### Tailwind

```ts
// tailwind.config.ts
import { mentisixTheme } from '@mentisix/brand/tailwind';

export default {
  content: ['./app/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: mentisixTheme,
};
```

## The 8 hard rules

1. Neutrals ≥ 92% of any surface; signal mint ≤ 8%.
2. Mint = the agent / live / pass / primary CTA. Never a generic accent.
3. Fault red = failure or destructive only.
4. All numeric data uses JetBrains Mono + `tabular-nums`.
5. Mono = machine voice (labels, data, code, status), UPPERCASE + 0.1em tracking.
6. Sharp corners (2-3px). Instrument, not consumer app.
7. No emoji, no third-party icon library. Use these icons only.
8. No gradient backgrounds. Texture is the lattice, low-contrast.
