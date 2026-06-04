'use client';

import { useEffect, useRef } from 'react';
import type { ReasoningEntry } from '../lib/run-state';

export type ReasoningFeedProps = {
  entries: readonly ReasoningEntry[];
};

export function ReasoningFeed({ entries }: ReasoningFeedProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom must fire whenever entries change, even though the effect body only touches the ref
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={ref}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '4px 4px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {entries.length === 0 ? (
        <div
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
            padding: '12px 8px',
          }}
        >
          {'// awaiting first turn'}
        </div>
      ) : null}
      {entries.map((entry, i) => (
        <div
          key={`${entry.step}-${i}`}
          style={{
            borderLeft: '1px solid var(--mx-line)',
            paddingLeft: 12,
          }}
        >
          <div
            className="mx-tabular"
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--mx-signal-dim)',
              marginBottom: 6,
            }}
          >
            STEP {String(entry.step).padStart(3, '0')} · {entry.tokensUsed} TOK · {entry.msUsed}MS
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--mx-bone)',
              wordWrap: 'break-word',
            }}
          >
            {entry.text || (
              <span style={{ color: 'var(--mx-fog-dim)' }}>(no reasoning provided)</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
