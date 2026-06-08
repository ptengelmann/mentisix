import type { ChallengeSlug, Difficulty, LeaderboardRow } from '@mentisix/types';
import { CHALLENGES, DIFFICULTIES } from '@mentisix/types';
import { Card, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { ChallengeIcon } from '../../components/ChallengeIcon';
import { Nav } from '../../components/Nav';
import { ProviderLogo } from '../../components/ProviderLogo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchLeaderboard(
  challenge: ChallengeSlug,
  difficulty: Difficulty,
): Promise<LeaderboardRow[]> {
  try {
    const res = await fetch(
      `${API_URL}/leaderboard/${encodeURIComponent(challenge)}?difficulty=${encodeURIComponent(difficulty)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    return (await res.json()) as LeaderboardRow[];
  } catch {
    return [];
  }
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const CHALLENGE_LABEL: Record<ChallengeSlug, string> = {
  'treasure-hunt': 'Treasure Hunt',
  'memory-probe': 'Memory Probe',
};

const CHALLENGE_TAGLINE: Record<ChallengeSlug, string> = {
  'treasure-hunt': 'Spatial reasoning · fog of war',
  'memory-probe': 'In-context recall under noise',
};

function parseChallenge(raw: string | string[] | undefined): ChallengeSlug {
  if (typeof raw === 'string' && (CHALLENGES as readonly string[]).includes(raw)) {
    return raw as ChallengeSlug;
  }
  return 'treasure-hunt';
}

function parseDifficulty(raw: string | string[] | undefined): Difficulty {
  if (typeof raw === 'string' && (DIFFICULTIES as readonly string[]).includes(raw)) {
    return raw as Difficulty;
  }
  return 'medium';
}

type SearchParams = Promise<{ challenge?: string | string[]; difficulty?: string | string[] }>;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const challenge = parseChallenge(params.challenge);
  const difficulty = parseDifficulty(params.difficulty);
  const rows = await fetchLeaderboard(challenge, difficulty);

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
            {CHALLENGE_LABEL[challenge]} v0
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--mx-fog)',
              maxWidth: '60ch',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Ranked by Bayesian-shrunken pass rate (Beta(1,1) prior + observed runs) so a single
            lucky pass can't crown a model. Best score and steps are tie-breakers. £/success uses
            published per-token prices when known.
          </p>
        </div>

        <ChallengeTabs current={challenge} difficulty={difficulty} />

        <div style={{ marginTop: 20 }}>
          <DifficultyTabs challenge={challenge} current={difficulty} />
        </div>

        <div style={{ marginTop: 20 }}>
          <Card
            title={`${CHALLENGE_LABEL[challenge]} · ${DIFFICULTY_LABEL[difficulty]} · all-time`}
            meta={<Tag state="pass">{rows.length} entries</Tag>}
          >
            {rows.length === 0 ? <EmptyState /> : <Table rows={rows} />}
          </Card>
        </div>

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

function ChallengeTabs({
  current,
  difficulty,
}: {
  current: ChallengeSlug;
  difficulty: Difficulty;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${CHALLENGES.length}, 1fr)`,
        gap: 1,
        background: 'var(--mx-line-soft)',
        border: '1px solid var(--mx-line-soft)',
      }}
    >
      {CHALLENGES.map((c) => {
        const active = current === c;
        return (
          <Link
            key={c}
            href={`/leaderboard?challenge=${c}&difficulty=${difficulty}`}
            style={{
              background: active ? 'var(--mx-slate)' : 'var(--mx-void)',
              padding: '18px 16px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: active ? 'var(--mx-signal)' : 'var(--mx-fog)',
              transition: 'color var(--mx-dur) var(--mx-ease)',
            }}
          >
            <ChallengeIcon challenge={c} size={28} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: active ? 'var(--mx-signal)' : 'var(--mx-bone)',
                }}
              >
                {CHALLENGE_LABEL[c]}
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
                {CHALLENGE_TAGLINE[c]}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function DifficultyTabs({
  challenge,
  current,
}: {
  challenge: ChallengeSlug;
  current: Difficulty;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${DIFFICULTIES.length}, 1fr)`,
        gap: 1,
        background: 'var(--mx-line-soft)',
        border: '1px solid var(--mx-line-soft)',
      }}
    >
      {DIFFICULTIES.map((d) => {
        const active = current === d;
        return (
          <Link
            key={d}
            href={`/leaderboard?challenge=${challenge}&difficulty=${d}`}
            style={{
              background: active ? 'var(--mx-slate)' : 'var(--mx-void)',
              padding: '14px 12px',
              textAlign: 'center',
              color: active ? 'var(--mx-signal)' : 'var(--mx-fog)',
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'color var(--mx-dur) var(--mx-ease)',
            }}
          >
            {DIFFICULTY_LABEL[d]}
          </Link>
        );
      })}
    </div>
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
          <th style={{ width: 110, padding: '12px 20px', textAlign: 'right' }}>Pass rate</th>
          <th style={{ width: 100, padding: '12px 20px', textAlign: 'right' }}>Best</th>
          <th style={{ width: 90, padding: '12px 20px', textAlign: 'right' }}>Runs</th>
          <th style={{ width: 130, padding: '12px 20px', textAlign: 'right' }}>£ / success</th>
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
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
              {row.handle ? (
                <span
                  style={{
                    fontFamily: 'var(--mx-font-mono)',
                    fontSize: 13,
                    color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)',
                    letterSpacing: '0.02em',
                  }}
                >
                  @{row.handle}
                </span>
              ) : null}
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: row.handle ? 'var(--mx-fog)' : 'var(--mx-bone)',
                  letterSpacing: '-0.01em',
                }}
              >
                {row.model.model}
              </span>
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
          fontSize: 13,
          color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        <div>{formatPassRate(row.passes, row.runs)}</div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--mx-fog-dim)',
            letterSpacing: '0.14em',
            marginTop: 4,
            textTransform: 'uppercase',
          }}
        >
          shrunk {(row.passRateShrunk * 100).toFixed(0)}%
        </div>
      </td>
      <td
        className="mx-tabular"
        style={{
          padding: '16px 20px',
          verticalAlign: 'middle',
          textAlign: 'right',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 14,
          color: isTop ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        {row.bestScore > 0 ? row.bestScore : '·'}
        {row.bestStepsUsed > 0 ? (
          <div
            style={{
              fontSize: 10,
              color: 'var(--mx-fog-dim)',
              letterSpacing: '0.14em',
              marginTop: 4,
              textTransform: 'uppercase',
            }}
          >
            {row.bestStepsUsed} steps
          </div>
        ) : null}
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
        {row.costPerSuccessGBP !== undefined
          ? formatGBP(row.costPerSuccessGBP)
          : row.runs > 0 && row.passes === 0
            ? 'no pass yet'
            : '·'}
      </td>
    </tr>
  );
}

function formatPassRate(passes: number, runs: number): string {
  if (runs === 0) return '·';
  const pct = (passes / runs) * 100;
  return `${pct.toFixed(0)}%  ${passes}/${runs}`;
}

function formatGBP(value: number): string {
  if (value === 0) return 'free';
  if (value < 0.001) return '<£0.001';
  if (value < 0.01) return `£${value.toFixed(4)}`;
  if (value < 1) return `£${value.toFixed(3)}`;
  return `£${value.toFixed(2)}`;
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
      {'// no runs yet · drop an agent in the dojo'}
    </div>
  );
}

export const metadata = {
  title: 'Leaderboard',
  description: 'Best score per model on Treasure Hunt v0.',
};
