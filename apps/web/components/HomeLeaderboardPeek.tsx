import type { LeaderboardRow } from '@mentisix/types';
import Link from 'next/link';
import { ProviderLogo } from './ProviderLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchTop(): Promise<LeaderboardRow[]> {
  try {
    const res = await fetch(`${API_URL}/leaderboard/treasure-hunt?difficulty=medium`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as LeaderboardRow[];
    return rows.slice(0, 3);
  } catch {
    return [];
  }
}

export async function HomeLeaderboardPeek() {
  const rows = await fetchTop();
  return (
    <div
      style={{
        border: '1px solid var(--mx-line)',
        background: 'linear-gradient(var(--mx-slate), var(--mx-void))',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid var(--mx-line)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog)',
          }}
        >
          Top of the board
        </span>
        <Link
          href="/leaderboard"
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--mx-signal)',
          }}
        >
          See all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((row) => (
              <Row key={`${row.model.provider}-${row.model.model}`} row={row} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Row({ row }: { row: LeaderboardRow }) {
  const isTop = row.rank === 1;
  return (
    <tr style={{ borderTop: '1px solid var(--mx-line-soft)' }}>
      <td
        className="mx-tabular"
        style={{
          padding: '14px 20px',
          verticalAlign: 'middle',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 12,
          color: isTop ? 'var(--mx-signal)' : 'var(--mx-fog)',
          width: 40,
        }}
      >
        {String(row.rank).padStart(2, '0')}
      </td>
      <td style={{ padding: '14px 0', verticalAlign: 'middle' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)' }}>
            <ProviderLogo provider={row.model.provider} size={16} />
          </span>
          {row.handle ? (
            <span
              style={{
                fontFamily: 'var(--mx-font-mono)',
                fontSize: 12,
                color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)',
                letterSpacing: '0.02em',
              }}
            >
              @{row.handle}
            </span>
          ) : null}
          <span style={{ fontSize: 13, color: 'var(--mx-fog)', letterSpacing: '-0.01em' }}>
            {row.model.model}
          </span>
        </span>
      </td>
      <td
        className="mx-tabular"
        style={{
          padding: '14px 20px',
          verticalAlign: 'middle',
          textAlign: 'right',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 13,
          color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)',
          width: 90,
        }}
      >
        {row.bestScore}
      </td>
    </tr>
  );
}

function Empty() {
  return (
    <div
      style={{
        padding: '36px 20px',
        textAlign: 'center',
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--mx-fog-dim)',
      }}
    >
      {'// no entries · be the first'}
    </div>
  );
}
