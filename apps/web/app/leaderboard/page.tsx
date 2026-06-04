import type { LeaderboardRow } from '@mentisix/types';
import { Card, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { Nav } from '../../components/Nav';
import { ProviderLogo } from '../../components/ProviderLogo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const res = await fetch(`${API_URL}/leaderboard/treasure-hunt`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()) as LeaderboardRow[];
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const rows = await fetchLeaderboard();

  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100dvh',
          padding: 'clamp(112px, 14vh, 160px) clamp(20px, 5vw, 84px) 80px',
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <Kicker index="07">Leaderboard</Kicker>
          <h1
            style={{
              fontSize: 'clamp(40px, 6vw, 64px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              margin: '14px 0 16px',
              color: 'var(--mx-bone)',
            }}
          >
            Treasure Hunt v0
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--mx-fog)',
              maxWidth: '54ch',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Best score per model across every run. Highest first; fewer steps breaks ties. Only
            passed runs make the board.
          </p>
        </div>

        <Card title="All-time" meta={<Tag state="pass">{rows.length} entries</Tag>}>
          {rows.length === 0 ? <EmptyState /> : <Table rows={rows} />}
        </Card>

        <div style={{ marginTop: 32 }}>
          <Link
            href="/dojo"
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--mx-signal)',
            }}
          >
            → drop another agent
          </Link>
        </div>
      </main>
    </>
  );
}

function Table({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
            textAlign: 'left',
          }}
        >
          <th style={{ width: 50, padding: '12px 20px' }}>Rank</th>
          <th style={{ padding: '12px 20px' }}>Model</th>
          <th style={{ width: 110, padding: '12px 20px', textAlign: 'right' }}>Score</th>
          <th style={{ width: 110, padding: '12px 20px', textAlign: 'right' }}>Steps</th>
          <th style={{ width: 90, padding: '12px 20px', textAlign: 'right' }}>Runs</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Row key={`${row.model.provider}-${row.model.model}`} row={row} />
        ))}
      </tbody>
    </table>
  );
}

function Row({ row }: { row: LeaderboardRow }) {
  const isTop = row.rank === 1;
  return (
    <tr style={{ borderTop: '1px solid var(--mx-line-soft)' }}>
      <td
        className="mx-tabular"
        style={{
          padding: '16px 20px',
          verticalAlign: 'middle',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 13,
          color: isTop ? 'var(--mx-signal)' : 'var(--mx-fog)',
        }}
      >
        {String(row.rank).padStart(2, '0')}
      </td>
      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)' }}>
            <ProviderLogo provider={row.model.provider} size={18} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 500,
                color: 'var(--mx-bone)',
                letterSpacing: '-0.01em',
              }}
            >
              {row.model.model}
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
              {row.model.provider}
            </span>
          </span>
        </span>
      </td>
      <td
        className="mx-tabular"
        style={{
          padding: '16px 20px',
          verticalAlign: 'middle',
          textAlign: 'right',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 15,
          color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        {row.bestScore}
      </td>
      <td
        className="mx-tabular"
        style={{
          padding: '16px 20px',
          verticalAlign: 'middle',
          textAlign: 'right',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 13,
          color: 'var(--mx-bone)',
        }}
      >
        {row.bestStepsUsed}
      </td>
      <td
        className="mx-tabular"
        style={{
          padding: '16px 20px',
          verticalAlign: 'middle',
          textAlign: 'right',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 13,
          color: 'var(--mx-fog)',
        }}
      >
        {row.runs}
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '64px 20px',
        textAlign: 'center',
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--mx-fog-dim)',
      }}
    >
      {'// no runs yet — drop an agent in the dojo'}
    </div>
  );
}

export const metadata = {
  title: 'Leaderboard',
  description: 'Best score per model on Treasure Hunt v0.',
};
