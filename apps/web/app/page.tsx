import { Pattern } from '@mentisix/brand/components';
import type { DatasetStats } from '@mentisix/types';
import { Button, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { DemoLoop } from '../components/DemoLoop';
import { HomeLeaderboardPeek } from '../components/HomeLeaderboardPeek';
import { Nav } from '../components/Nav';
import { SupportedModels } from '../components/SupportedModels';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchDatasetStats(): Promise<DatasetStats | null> {
  try {
    const res = await fetch(`${API_URL}/datasets/treasure-hunt/stats.json`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as DatasetStats;
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const stats = await fetchDatasetStats();

  return (
    <>
      <Nav />

      {/* ambient lattice fog · texture, not noise */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Pattern kind="fog" />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(120% 90% at 70% 30%, rgba(10,12,16,0) 30%, var(--mx-void) 78%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <SupportedModels />
        <Manifesto />
        <Definitions />
        <BoardSection />
        <DatasetSection stats={stats} />
        <Footer />
      </main>
    </>
  );
}

function Hero() {
  return (
    <section
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(120px, 14vh, 180px) clamp(20px, 5vw, 84px) clamp(60px, 8vh, 100px)',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(58px, 12vw, 168px)',
          lineHeight: 0.86,
          letterSpacing: '-0.045em',
          fontWeight: 600,
          margin: 0,
          color: 'var(--mx-bone)',
        }}
      >
        MENTIS<span style={{ color: 'var(--mx-signal)' }}>IX</span>
      </h1>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '26px 56px',
          alignItems: 'flex-end',
          marginTop: 38,
          maxWidth: 980,
        }}
      >
        <p
          style={{
            fontSize: 'clamp(17px, 2vw, 22px)',
            maxWidth: '34ch',
            color: 'var(--mx-bone)',
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          A proving ground for machine minds. We drop frontier models into{' '}
          <b style={{ color: 'var(--mx-signal)', fontWeight: 500 }}>
            grid-world cognition challenges
          </b>{' '}
          and watch them think out loud.
        </p>

        <div
          className="mx-tabular"
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog)',
            lineHeight: 2,
          }}
        >
          v0 · Treasure Hunt
          <br />
          12 × 12 grid · 3 treasures
          <br />
          Fog of war · 200 steps
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 42, flexWrap: 'wrap' }}>
        <Link href="/dojo">
          <Button variant="signal" dot>
            Enter the dojo
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button>Read the board</Button>
        </Link>
      </div>

      <div
        style={{
          marginTop: 24,
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.14em',
          color: 'var(--mx-fog-dim)',
        }}
      >
        {'// no key required to watch the solver'}
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(80px, 11vh, 140px) clamp(20px, 5vw, 84px)',
        borderTop: '1px solid var(--mx-line-soft)',
      }}
    >
      <Kicker index="01">Positioning</Kicker>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.7fr)',
          gap: 'clamp(40px, 6vw, 80px)',
          marginTop: 36,
          alignItems: 'flex-start',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(24px, 3.4vw, 42px)',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            fontWeight: 500,
            color: 'var(--mx-bone)',
            margin: 0,
            maxWidth: '24ch',
          }}
        >
          Most benchmarks hand you a <span style={{ color: 'var(--mx-fog-dim)' }}>number</span>.
          Mentisix hands you a <span style={{ color: 'var(--mx-signal)' }}>window</span>. Watch a
          model reason, wander, and fail in real time.
        </p>

        <div style={{ marginTop: 8 }}>
          <DemoLoop />
        </div>
      </div>
    </section>
  );
}

function Definitions() {
  return (
    <section
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(80px, 11vh, 140px) clamp(20px, 5vw, 84px)',
        borderTop: '1px solid var(--mx-line-soft)',
      }}
    >
      <Kicker index="02">System</Kicker>
      <h2
        style={{
          fontSize: 'clamp(28px, 4.4vw, 52px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          margin: '14px 0 48px',
          maxWidth: '18ch',
          color: 'var(--mx-bone)',
        }}
      >
        Three pillars. Nothing else.
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: 'var(--mx-line-soft)',
          border: '1px solid var(--mx-line-soft)',
        }}
      >
        <Definition
          tag="/ The instrument"
          body={
            <>
              <b style={{ color: 'var(--mx-bone)', fontWeight: 500 }}>Clinical, not cinematic.</b>{' '}
              The interface is a measuring device. Quiet greys, exact lines, one living signal
              color. No theatrics, only evidence.
            </>
          }
        />
        <Definition
          tag="/ The signal"
          body={
            <>
              <b style={{ color: 'var(--mx-bone)', fontWeight: 500 }}>Mint is the mind.</b> The
              single accent marks the agent, the live run, the passing score. Intelligence moving
              through an otherwise dark machine.
            </>
          }
        />
        <Definition
          tag="/ The lattice"
          body={
            <>
              <b style={{ color: 'var(--mx-bone)', fontWeight: 500 }}>Everything is a grid.</b> The
              logo, the patterns, the worlds the models solve. All derive from the same six-by-six
              cell system.
            </>
          }
        />
      </div>
    </section>
  );
}

function Definition({ tag, body }: { tag: string; body: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: '28px 26px 30px' }}>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-signal-dim)',
          marginBottom: 14,
        }}
      >
        {tag}
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--mx-fog)' }}>{body}</div>
    </div>
  );
}

function BoardSection() {
  return (
    <section
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(80px, 11vh, 140px) clamp(20px, 5vw, 84px)',
        borderTop: '1px solid var(--mx-line-soft)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 24,
          flexWrap: 'wrap',
          marginBottom: 36,
        }}
      >
        <div>
          <Kicker index="03">Live board</Kicker>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.4vw, 52px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              margin: '14px 0 0',
              maxWidth: '22ch',
              color: 'var(--mx-bone)',
            }}
          >
            Who's winning. Who's bumping walls.
          </h2>
        </div>
        <Tag state="run">Streaming · all-time</Tag>
      </div>

      <HomeLeaderboardPeek />
    </section>
  );
}

function DatasetSection({ stats }: { stats: DatasetStats | null }) {
  return (
    <section
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: 'clamp(80px, 11vh, 140px) clamp(20px, 5vw, 84px)',
        borderTop: '1px solid var(--mx-line-soft)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 24,
          flexWrap: 'wrap',
          marginBottom: 36,
        }}
      >
        <div>
          <Kicker index="04">Open data</Kicker>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.4vw, 52px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              margin: '14px 0 0',
              maxWidth: '22ch',
              color: 'var(--mx-bone)',
            }}
          >
            Every run, every reasoning step. <span style={{ color: 'var(--mx-fog)' }}>Public.</span>
          </h2>
        </div>
        <Tag state="pass">CC-BY-4.0</Tag>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
          gap: 'clamp(32px, 5vw, 64px)',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            background: 'var(--mx-line-soft)',
            border: '1px solid var(--mx-line-soft)',
          }}
        >
          <BigStat label="Runs" value={stats ? String(stats.totalRuns) : '·'} highlight />
          <BigStat label="Passed" value={stats ? String(stats.totalPassedRuns) : '·'} />
          <BigStat label="Models" value={stats ? String(stats.byModel.length) : '·'} />
          <BigStat label="Tokens" value={stats ? compactNumber(stats.totalTokens) : '·'} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            color: 'var(--mx-fog)',
            fontSize: 16,
            lineHeight: 1.55,
          }}
        >
          <p style={{ margin: 0 }}>
            Every Mentisix run, the chain of thought, every action, every step of the ground-truth
            simulator, is downloadable as line-delimited JSON. No auth, no paywall, CC-BY-4.0. Cite
            it in your eval paper or pipe it straight into{' '}
            <code
              style={{
                fontFamily: 'var(--mx-font-mono)',
                fontSize: 13,
                color: 'var(--mx-bone)',
                background: 'var(--mx-void)',
                padding: '2px 6px',
              }}
            >
              jq
            </code>
            .
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dataset">
              <Button variant="signal" dot>
                Read the dataset
              </Button>
            </Link>
            <a
              href={`${API_URL}/datasets/treasure-hunt/runs.jsonl`}
              download="mentisix-runs.jsonl"
              style={{ textDecoration: 'none' }}
            >
              <Button>Download JSONL</Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function BigStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: 'clamp(24px, 4vw, 44px)' }}>
      <div
        className="mx-tabular"
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 'clamp(40px, 6vw, 72px)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: highlight ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog)',
          marginTop: 14,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid var(--mx-line)',
        padding: '80px clamp(20px, 5vw, 84px) 56px',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 40,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(40px, 8vw, 108px)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
              color: 'var(--mx-bone)',
            }}
          >
            MENTIS<span style={{ color: 'var(--mx-signal)' }}>IX</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--mx-fog)',
              lineHeight: 2.1,
              textAlign: 'right',
            }}
          >
            Lattice · Signal · Fog
            <br />
            <span style={{ color: 'var(--mx-signal-dim)' }}>
              A proving ground for machine minds
            </span>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--mx-line-soft)', margin: '46px 0 22px' }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
          }}
        >
          <span>© 2026 Mentisix</span>
          <Link href="/dojo" className="mx-navlink">
            Enter the dojo →
          </Link>
        </div>
      </div>
    </footer>
  );
}
