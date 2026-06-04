import type { ReactNode } from 'react';

/**
 * Long-form prose primitives for findings posts. Tight typography, dark
 * surface, mint accents on code and pulls. Kept compositional rather
 * than markdown-driven so the writeup author owns the rendering.
 */

export function Para({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 16px',
        fontSize: 16,
        lineHeight: 1.65,
        color: 'var(--mx-fog)',
      }}
    >
      {children}
    </p>
  );
}

export function H2({ children, index }: { children: ReactNode; index?: string }) {
  return (
    <h2
      style={{
        margin: '48px 0 18px',
        fontSize: 'clamp(24px, 3vw, 32px)',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: 'var(--mx-bone)',
      }}
    >
      {index ? (
        <span
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 16,
            color: 'var(--mx-signal-dim)',
            marginRight: 12,
            letterSpacing: '0.08em',
          }}
        >
          {index}
        </span>
      ) : null}
      {children}
    </h2>
  );
}

export function Bold({ children }: { children: ReactNode }) {
  return <b style={{ color: 'var(--mx-bone)', fontWeight: 500 }}>{children}</b>;
}

export function Signal({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--mx-signal)' }}>{children}</span>;
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 13,
        color: 'var(--mx-bone)',
        background: 'var(--mx-void)',
        border: '1px solid var(--mx-line-soft)',
        padding: '2px 6px',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </code>
  );
}

export function Pull({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        borderLeft: '2px solid var(--mx-signal-dim)',
        padding: '8px 18px',
        margin: '24px 0',
        fontSize: 'clamp(18px, 2.3vw, 24px)',
        lineHeight: 1.4,
        color: 'var(--mx-bone)',
        letterSpacing: '-0.01em',
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

export function Quote({
  source,
  step,
  children,
}: {
  source: string;
  step?: string;
  children: ReactNode;
}) {
  return (
    <figure
      style={{
        margin: '24px 0',
        background: 'var(--mx-void)',
        border: '1px solid var(--mx-line-soft)',
        padding: '18px 22px',
      }}
    >
      <blockquote
        style={{
          margin: 0,
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 13.5,
          lineHeight: 1.55,
          color: 'var(--mx-bone)',
          letterSpacing: '0.01em',
        }}
      >
        "{children}"
      </blockquote>
      <figcaption
        style={{
          marginTop: 12,
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        {source}
        {step ? ` · ${step}` : ''}
      </figcaption>
    </figure>
  );
}
