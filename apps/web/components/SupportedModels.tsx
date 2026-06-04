'use client';

import { Kicker } from '@mentisix/ui';
import { ProviderLogo } from './ProviderLogo';

const PROVIDERS = [
  { id: 'anthropic' as const, label: 'Claude', sub: 'anthropic' },
  { id: 'openai' as const, label: 'OpenAI', sub: 'gpt' },
  { id: 'gemini' as const, label: 'Gemini', sub: 'google' },
  { id: 'groq' as const, label: 'Groq', sub: 'llama · mixtral' },
  { id: 'openrouter' as const, label: 'OpenRouter', sub: '200+ models' },
  { id: 'solver' as const, label: 'Solver', sub: 'reference player' },
];

/**
 * Drift strip of supported providers. CSS marquee, infinite loop, edge
 * fade. Pauses on hover. Two copies of the list slide in tandem so the
 * seam is invisible.
 */
export function SupportedModels() {
  return (
    <section
      style={{
        position: 'relative',
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(60px, 8vh, 100px) clamp(20px, 5vw, 84px) 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <Kicker index="00">Compatible</Kicker>
        <span
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.14em',
            color: 'var(--mx-fog-dim)',
          }}
        >
          {'// bring your own key'}
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '4px 0',
          maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        }}
      >
        <div className="mx-marquee">
          {[...PROVIDERS, ...PROVIDERS].map((p, i) => (
            <Tile key={`${p.id}-${i}`} provider={p} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes mx-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .mx-marquee {
          display: inline-flex;
          gap: 1px;
          background: var(--mx-line-soft);
          padding: 1px;
          animation: mx-marquee 36s linear infinite;
          will-change: transform;
        }
        .mx-marquee:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .mx-marquee { animation: none; }
        }
      `}</style>
    </section>
  );
}

function Tile({
  provider,
}: {
  provider: {
    id: 'anthropic' | 'openai' | 'gemini' | 'groq' | 'openrouter' | 'solver';
    label: string;
    sub: string;
  };
}) {
  return (
    <div
      style={{
        background: 'var(--mx-void)',
        padding: '20px 28px',
        minWidth: 220,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        color: 'var(--mx-fog)',
        transition: 'color var(--mx-dur) var(--mx-ease)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--mx-bone)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--mx-fog)';
      }}
    >
      <ProviderLogo provider={provider.id} size={22} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--mx-bone)',
          }}
        >
          {provider.label}
        </span>
        <span
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
          }}
        >
          {provider.sub}
        </span>
      </div>
    </div>
  );
}
