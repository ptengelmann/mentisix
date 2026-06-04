import type { RunReplay } from '@mentisix/sdk';
import { Button, Card, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MemoryProbeReplayPlayer } from '../../../components/MemoryProbeReplayPlayer';
import { Nav } from '../../../components/Nav';
import { ProviderLogo } from '../../../components/ProviderLogo';
import { ReplayPlayer } from '../../../components/ReplayPlayer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchReplay(id: string): Promise<RunReplay | null> {
  try {
    const res = await fetch(`${API_URL}/runs/${encodeURIComponent(id)}/replay`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as RunReplay;
  } catch {
    return null;
  }
}

type Params = Promise<{ id: string }>;

export default async function ReplayPage({ params }: { params: Params }) {
  const { id } = await params;
  const replay = await fetchReplay(id);
  if (!replay) notFound();

  const { summary, events } = replay;
  const passed = summary.status === 'passed';

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
        <ReplayHeader summary={summary} />

        <div style={{ marginTop: 32 }}>
          {events.length === 0 ? (
            <Card title="No replay available">
              <div
                style={{
                  padding: '32px 22px',
                  fontSize: 14,
                  color: 'var(--mx-fog)',
                  lineHeight: 1.5,
                }}
              >
                This run predates replay capture, so the step-by-step trace was never recorded. The
                final score and metadata are still on the leaderboard.
              </div>
            </Card>
          ) : summary.challenge === 'memory-probe' ? (
            <MemoryProbeReplayPlayer runId={summary.id} events={events} />
          ) : (
            <ReplayPlayer runId={summary.id} events={events} />
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <Card title="Want to beat this?">
            <div
              style={{
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: 'var(--mx-fog)', fontSize: 14, lineHeight: 1.5 }}>
                {passed
                  ? `${labelFor(summary)} cleared seed ${summary.seed} in ${summary.stepsUsed} steps. Beat it.`
                  : `${labelFor(summary)} couldn't crack seed ${summary.seed}. Try your own model.`}
              </span>
              <Link href={`/dojo?seed=${summary.seed}`}>
                <Button variant="signal" dot>
                  Run this seed
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}

function ReplayHeader({ summary }: { summary: RunReplay['summary'] }) {
  const passed = summary.status === 'passed';
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        Replay · seed {summary.seed}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 18,
          marginTop: 12,
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            margin: 0,
            color: 'var(--mx-bone)',
          }}
        >
          {passed ? 'Passed' : summary.status === 'failed' ? 'Failed' : 'Run'}
        </h1>
        <div
          className="mx-tabular"
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 28,
            color: passed ? 'var(--mx-signal)' : 'var(--mx-fog)',
            letterSpacing: '-0.01em',
          }}
        >
          {summary.score ?? '·'}
        </div>
        {passed ? <Tag state="pass">Cleared</Tag> : <Tag state="fail">Did not clear</Tag>}
      </div>
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          color: 'var(--mx-fog)',
        }}
      >
        <span style={{ color: 'var(--mx-bone)' }}>
          <ProviderLogo provider={summary.model.provider} size={20} />
        </span>
        {summary.handle ? (
          <span
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 14,
              color: 'var(--mx-bone)',
              letterSpacing: '0.02em',
            }}
          >
            @{summary.handle}
          </span>
        ) : null}
        <span style={{ fontSize: 15, color: 'var(--mx-bone)', letterSpacing: '-0.01em' }}>
          {summary.model.model}
        </span>
        <span
          className="mx-tabular"
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 12,
            color: 'var(--mx-fog-dim)',
            letterSpacing: '0.12em',
          }}
        >
          {summary.stepsUsed} steps · {summary.tokensUsed} tokens · {Math.round(summary.msUsed)}ms
        </span>
      </div>
    </div>
  );
}

function labelFor(summary: RunReplay['summary']): string {
  if (summary.handle) return `@${summary.handle}`;
  return summary.model.model;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const replay = await fetchReplay(id);
  if (!replay) return { title: 'Replay not found' };
  const { summary } = replay;
  const who = summary.handle ? `@${summary.handle}` : summary.model.model;
  const action = summary.status === 'passed' ? 'cleared' : 'attempted';
  const title = `${who} ${action} seed ${summary.seed} · score ${summary.score ?? '0'}`;
  const description = `${summary.model.provider} · ${summary.model.model} on Mentisix Treasure Hunt v0`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}
