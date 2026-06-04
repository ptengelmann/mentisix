'use client';

import { Mark } from '@mentisix/brand/components';
import { Button } from '@mentisix/ui';
import Link from 'next/link';

export function Nav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px clamp(20px, 5vw, 84px)',
        background: 'linear-gradient(var(--mx-void), rgba(10,12,16,0.4))',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--mx-line-soft)',
      }}
    >
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
        <Mark size={24} showFog={false} />
        <span
          style={{
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: '-0.01em',
          }}
        >
          Mentis<span style={{ color: 'var(--mx-signal)' }}>ix</span>
        </span>
      </Link>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
        <Link href="/leaderboard" className="mx-navlink">
          Leaderboard
        </Link>
        <Link href="/dojo">
          <Button variant="signal" dot>
            Enter the dojo
          </Button>
        </Link>
      </div>
    </nav>
  );
}
