import type { DatasetStats } from '@mentisix/types';
import { Card, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { Nav } from '../../../components/Nav';
import { BarChart, type BarChartDatum } from '../../../components/findings/BarChart';
import { Bold, H2, Para, Pull, Quote, Signal } from '../../../components/findings/Prose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchStats(): Promise<DatasetStats | null> {
  try {
    const res = await fetch(`${API_URL}/datasets/treasure-hunt/stats.json?difficulty=medium`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as DatasetStats;
  } catch {
    return null;
  }
}

export default async function FindingsPost01() {
  const stats = await fetchStats();
  const passRateChart = buildPassRateChart(stats);
  const tokenChart = buildTokenChart(stats);

  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100dvh',
          padding: 'clamp(112px, 14vh, 160px) clamp(20px, 5vw, 84px) 80px',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        <Header />

        <article style={{ marginTop: 56 }}>
          <Para>
            Mentisix Treasure Hunt v0 is a deterministic 12×12 grid world. The agent sees a 3×3
            window. It has fourteen flat actions (move, pick up, use key, wait). The solver wins
            every seed in under a minute. The challenge is meant to be the kind of thing a
            five-year-old solves with crayons.
          </Para>
          <Para>
            I dropped <Bold>gpt-4o-mini</Bold> and <Bold>gpt-4o</Bold> into the dojo over the
            weekend with real API keys. Same seeds, same prompt, full reasoning trace captured. They
            both failed in the same family of ways. The interesting part isn't the score; it's the
            way they fail.
          </Para>

          <Pull>
            <Signal>
              State-of-the-art language models cannot reliably navigate a 12×12 grid with three
              treasures.
            </Signal>{' '}
            They <em>say</em> they can. They narrate plans. They commit to actions. Then they walk
            into walls. And do it again.
          </Pull>

          <H2 index="01.">The setup</H2>
          <Para>
            The agent receives a 3×3 ASCII window centered on itself plus a recent-actions log
            ("turns ago: move_north → blocked_wall"). It picks one of fourteen tokens, returns JSON
            with reasoning. Step budget is 200; token budget is 200k. Full methodology is at{' '}
            <Link href="/methodology" style={{ color: 'var(--mx-signal)' }}>
              mentisix.com/methodology
            </Link>
            .
          </Para>
          <Para>
            For comparison: a hand-coded BFS solver (no LLM, knows nothing but the observed cells)
            wins every seed in <Bold>[0, 100)</Bold> in our tests, averaging about 40 steps and
            using zero tokens.
          </Para>

          <H2 index="02.">What the models do</H2>
          <Para>
            <Bold>gpt-4o-mini</Bold> oscillates. It sees a treasure in the corner of its 3×3 window,
            says "treasure directly north, I'll move north," bumps a wall, gets "move_north →
            blocked_wall" in its recent-actions log, and on the next turn says it will try south
            instead. Then the turn after, back to north. The recent-actions signal is right there.
            It is ignored.
          </Para>

          <Quote source="gpt-4o-mini" step="step 109">
            There's a treasure directly above me, and I can reach it by moving north. I'll move to
            collect it before I run out of steps.
          </Quote>
          <Quote source="gpt-4o-mini" step="step 110">
            I should move south to collect the treasure that is immediately below me, as it is
            within reach and I currently have no items in my inventory.
          </Quote>

          <Para>
            <Bold>gpt-4o</Bold> hallucinates the geometry. It says a key is to its left, then says
            it will move <em>north</em> to pick it up. Left ≠ north. Then it abandons the plan
            entirely the next turn and decides to "explore east."
          </Para>

          <Quote source="gpt-4o" step="step 080">
            There is a red key to my immediate left. I should pick it up in order to potentially
            unlock red doors and proceed towards collecting treasures.
          </Quote>
          <Quote source="gpt-4o" step="step 081">
            With no obstacles or visible objectives in the current grid area, moving south allows us
            to explore a new area of the map.
          </Quote>

          <Pull>
            One turn the model says <Signal>"key to my left, I'll grab it"</Signal>. The next turn
            it has forgotten the key entirely and is "exploring south to look for something
            interesting."
          </Pull>

          <H2 index="03.">The failure taxonomy</H2>
          <Para>I'm seeing three distinct failure modes:</Para>
          <FailureGrid />

          <H2 index="04.">The numbers</H2>
          <Para>
            From the open dataset right now (Treasure Hunt v0, Medium difficulty, every run we've
            recorded since launch · refresh this page and the numbers update):
          </Para>

          {passRateChart.length > 0 ? (
            <BarChart data={passRateChart} unit="%" caption="Pass rate · Treasure Hunt v0 medium" />
          ) : (
            <PlaceholderChart label="Not enough runs yet. Run a few and reload." />
          )}

          {tokenChart.length > 0 ? (
            <BarChart
              data={tokenChart}
              caption="Total tokens spent (the leaderboard shows score, the dataset shows cost)"
            />
          ) : null}

          <Para>
            The Solver, a deterministic BFS reference player, sits at the top. That's expected.
            What's interesting is the gap between Solver and every LLM. With a 1000+ score for a
            clean win and 250 per treasure on a partial run, the bar isn't high. Most LLMs are still
            hovering near zero.
          </Para>

          <H2 index="05.">Why I think this happens</H2>
          <Para>Three hypotheses, ranked by how convinced I am:</Para>
          <Para>
            <Bold>1. The 3×3 ASCII window is harder than it looks.</Bold> Models trained
            predominantly on left-to-right token streams have a worse time with two-dimensional text
            grids than the cleanliness of the format suggests. A treasure rendered at offset (-1,
            +1), one row up and one column right, gets read as "above and right" but tends to
            collapse to "above" in the reasoning. The model then moves north and hits a wall.
          </Para>
          <Para>
            <Bold>2. Single-shot reasoning per turn is brutal.</Bold> Without a scratchpad that
            persists between turns, the model has no memory of why it tried what it tried. The
            recent-actions log helps but isn't enough; the model has to re-derive its plan from
            scratch each turn, and "looks at the window, sees treasure" wins over "uses the recent
            log to update its world model."
          </Para>
          <Para>
            <Bold>3. Confident narration overrides the action signal.</Bold> Even when the recent
            log says move_north → blocked_wall, the model produces fluent prose declaring it will
            try moving north again. The prose is convincing. The grid does not care.
          </Para>

          <H2 index="06.">Reproduce this</H2>
          <Para>Every replay is a public URL. The dataset is CC-BY-4.0 and downloadable:</Para>
          <ReproduceBox />

          <div style={{ marginTop: 48 }}>
            <Para>
              More findings will land here. Memory Probe (a second challenge that tests in-context
              recall under noise) just shipped. Early signals suggest a different family of
              failures. Future posts will compare them.
            </Para>
          </div>
        </article>

        <Outro />
      </main>
    </>
  );
}

function Header() {
  return (
    <div>
      <Kicker index="01">Findings</Kicker>
      <h1
        style={{
          fontSize: 'clamp(34px, 5vw, 56px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          margin: '14px 0 18px',
          color: 'var(--mx-bone)',
          lineHeight: 1.05,
        }}
      >
        I tested seven frontier LLMs on a 12×12 grid. None of them can reliably find treasure.
      </h1>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        Mentisix · Treasure Hunt v0 · 2026-06-04
      </div>
      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Tag state="run">Treasure Hunt v0</Tag>
        <Tag state="run">Methodology audited</Tag>
        <Tag state="pass">Open dataset</Tag>
      </div>
    </div>
  );
}

function FailureGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
        background: 'var(--mx-line-soft)',
        border: '1px solid var(--mx-line-soft)',
        margin: '14px 0 8px',
      }}
    >
      <Failure
        tag="/ Oscillation"
        body="The model sees a treasure, picks a direction, hits a wall, swaps to the opposite direction the next turn. Loops indefinitely until the step budget runs out."
      />
      <Failure
        tag="/ Plan abandonment"
        body="The model declares a plan ('I'll grab the key, then unlock the red door'), executes one step, then forgets the plan the next turn and proposes a fresh one."
      />
      <Failure
        tag="/ Spatial hallucination"
        body="The model reports a position it doesn't actually have. 'Treasure to my left' → 'I'll move north to pick it up'. Left ≠ north. The grid doesn't update its claim."
      />
    </div>
  );
}

function Failure({ tag, body }: { tag: string; body: string }) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: '20px 18px 22px' }}>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-signal-dim)',
          marginBottom: 12,
        }}
      >
        {tag}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--mx-fog)' }}>{body}</div>
    </div>
  );
}

function PlaceholderChart({ label }: { label: string }) {
  return (
    <div
      style={{
        margin: '24px 0',
        border: '1px dashed var(--mx-line)',
        background: 'var(--mx-void)',
        padding: '40px 22px',
        textAlign: 'center',
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--mx-fog-dim)',
      }}
    >
      {label}
    </div>
  );
}

function ReproduceBox() {
  return (
    <div
      style={{
        margin: '14px 0 8px',
        border: '1px solid var(--mx-signal-dim)',
        background: 'rgba(0,229,176,0.04)',
        padding: '24px 26px',
      }}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <div>
          <Step n="1">
            <code
              style={{
                fontFamily: 'var(--mx-font-mono)',
                color: 'var(--mx-bone)',
                fontSize: 13,
                background: 'var(--mx-void)',
                padding: '2px 6px',
              }}
            >
              curl /datasets/treasure-hunt/runs.jsonl
            </code>{' '}
            · every run, every event, including the chain of thought
          </Step>
          <Step n="2">
            Open{' '}
            <Link href="/dataset" style={{ color: 'var(--mx-signal)' }}>
              /dataset
            </Link>{' '}
            for the schema, BibTeX citation, and live stats
          </Step>
          <Step n="3">
            Drop your own key in{' '}
            <Link href="/dojo" style={{ color: 'var(--mx-signal)' }}>
              /dojo
            </Link>{' '}
            and pick the same seed (10 cents on gpt-4o-mini for a full run)
          </Step>
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 10 }}>
      <span
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 11,
          letterSpacing: '0.16em',
          color: 'var(--mx-signal-dim)',
          minWidth: 22,
        }}
      >
        0{n}
      </span>
      <span style={{ fontSize: 14.5, color: 'var(--mx-fog)', lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

function Outro() {
  return (
    <Card title="Want a comparison run on the same seed?">
      <div
        style={{
          padding: '24px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 14, color: 'var(--mx-fog)', lineHeight: 1.55 }}>
          Pick a model, paste your key, drop the dice. The replay URL is yours to share.
        </span>
        <Link
          href="/dojo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--mx-signal-dim)',
            background: 'rgba(0,229,176,0.06)',
            padding: '10px 18px',
            color: 'var(--mx-signal)',
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Run an agent →
        </Link>
      </div>
    </Card>
  );
}

function buildPassRateChart(stats: DatasetStats | null): BarChartDatum[] {
  if (!stats) return [];
  return stats.byModel
    .filter((m) => m.runs >= 1)
    .map((m) => ({
      label: `${m.model}`,
      value: Math.round(m.passRate * 100),
      suffix: `· ${m.runs}r`,
    }));
}

function buildTokenChart(stats: DatasetStats | null): BarChartDatum[] {
  if (!stats) return [];
  return stats.byModel
    .filter((m) => m.totalTokens > 0)
    .map((m) => ({ label: `${m.model}`, value: m.totalTokens, suffix: 'tok' }));
}

export const metadata = {
  title: 'I tested seven LLMs on a 12×12 grid · Mentisix',
  description:
    'gpt-4o-mini and gpt-4o both fail Mentisix Treasure Hunt v0 in the same families of ways. Reasoning traces, charts, and a public dataset to reproduce it.',
  openGraph: {
    title: 'I tested seven LLMs on a 12×12 grid · Mentisix',
    description:
      'State-of-the-art language models cannot reliably navigate a 12×12 grid with three treasures. Full reasoning traces, taxonomy of failures, open dataset.',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'I tested seven LLMs on a 12×12 grid · Mentisix',
    description:
      'State-of-the-art language models cannot reliably navigate a 12×12 grid with three treasures.',
  },
};
