import type { DatasetStats } from '@mentisix/types';
import { Card, Kicker, Tag } from '@mentisix/ui';
import { Nav } from '../../components/Nav';
import { ProviderLogo } from '../../components/ProviderLogo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchStats(): Promise<DatasetStats | null> {
  try {
    const res = await fetch(`${API_URL}/datasets/treasure-hunt/stats.json`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as DatasetStats;
  } catch {
    return null;
  }
}

export default async function DatasetPage() {
  const stats = await fetchStats();
  const jsonlUrl = `${API_URL}/datasets/treasure-hunt/runs.jsonl`;
  const statsUrl = `${API_URL}/datasets/treasure-hunt/stats.json`;

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
        <Header />

        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <DownloadCard jsonlUrl={jsonlUrl} statsUrl={statsUrl} />
          {stats ? <StatsCard stats={stats} /> : <StatsEmpty />}
          <SchemaCard />
          <CitationCard />
          <LicenseCard />
        </div>
      </main>
    </>
  );
}

function Header() {
  return (
    <div>
      <Kicker index="04">Open dataset</Kicker>
      <h1
        style={{
          fontSize: 'clamp(40px, 6vw, 64px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          margin: '14px 0 18px',
          color: 'var(--mx-bone)',
        }}
      >
        Every run, every reasoning step.
      </h1>
      <p
        style={{
          fontSize: 17,
          color: 'var(--mx-fog)',
          maxWidth: '54ch',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        The full Mentisix corpus of LLM trajectories on the Treasure Hunt v0 challenge is public.
        Every run includes the model's chain of thought, every action it took, and the ground-truth
        outcome from a deterministic simulator. Free, no auth, CC-BY-4.0.
      </p>
    </div>
  );
}

function DownloadCard({ jsonlUrl, statsUrl }: { jsonlUrl: string; statsUrl: string }) {
  return (
    <Card title="Download" meta={<Tag state="pass">CC-BY-4.0</Tag>}>
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DownloadRow
          label="Trajectories (JSONL)"
          description="One line per run. Includes the full event log."
          href={jsonlUrl}
          filename="mentisix-runs.jsonl"
        />
        <DownloadRow
          label="Aggregate stats (JSON)"
          description="Pass rate, token cost, run count per model."
          href={statsUrl}
          filename="mentisix-stats.json"
        />
      </div>
    </Card>
  );
}

function DownloadRow({
  label,
  description,
  href,
  filename,
}: {
  label: string;
  description: string;
  href: string;
  filename: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 0',
        borderBottom: '1px solid var(--mx-line-soft)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 220 }}>
        <div style={{ fontSize: 15, color: 'var(--mx-bone)', letterSpacing: '-0.01em' }}>
          {label}
        </div>
        <div
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--mx-fog-dim)',
            marginTop: 4,
          }}
        >
          {description}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <code
          style={{
            background: 'var(--mx-void)',
            border: '1px solid var(--mx-line-soft)',
            padding: '8px 12px',
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 12,
            color: 'var(--mx-bone)',
            letterSpacing: '0.02em',
            maxWidth: 380,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {href}
        </code>
        <a href={href} download={filename} style={{ textDecoration: 'none' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--mx-signal-dim)',
              background: 'rgba(0,229,176,0.06)',
              padding: '9px 16px',
              color: 'var(--mx-signal)',
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Download
          </span>
        </a>
      </div>
    </div>
  );
}

function StatsCard({ stats }: { stats: DatasetStats }) {
  return (
    <Card title="What's in it" meta={<Tag state="run">Live</Tag>}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          background: 'var(--mx-line-soft)',
        }}
      >
        <Stat label="Total runs" value={String(stats.totalRuns)} highlight />
        <Stat label="Passed runs" value={String(stats.totalPassedRuns)} />
        <Stat label="Total tokens" value={fmtCompact(stats.totalTokens)} />
        <Stat label="Total wall-clock" value={fmtMs(stats.totalMs)} />
      </div>

      {stats.byModel.length > 0 ? (
        <div style={{ padding: '4px 24px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18 }}>
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
                <th style={{ padding: '14px 0' }}>Model</th>
                <th style={{ padding: '14px 0', textAlign: 'right', width: 90 }}>Runs</th>
                <th style={{ padding: '14px 0', textAlign: 'right', width: 100 }}>Pass rate</th>
                <th style={{ padding: '14px 0', textAlign: 'right', width: 130 }}>Avg score</th>
                <th style={{ padding: '14px 0', textAlign: 'right', width: 120 }}>Tokens</th>
              </tr>
            </thead>
            <tbody>
              {stats.byModel.map((m) => (
                <tr
                  key={`${m.provider}-${m.model}`}
                  style={{ borderTop: '1px solid var(--mx-line-soft)' }}
                >
                  <td style={{ padding: '14px 0' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--mx-bone)' }}>
                        <ProviderLogo provider={m.provider} size={16} />
                      </span>
                      <span style={{ fontSize: 13.5, color: 'var(--mx-bone)' }}>{m.model}</span>
                    </span>
                  </td>
                  <td
                    className="mx-tabular"
                    style={{
                      padding: '14px 0',
                      textAlign: 'right',
                      fontFamily: 'var(--mx-font-mono)',
                      fontSize: 13,
                      color: 'var(--mx-bone)',
                    }}
                  >
                    {m.runs}
                  </td>
                  <td
                    className="mx-tabular"
                    style={{
                      padding: '14px 0',
                      textAlign: 'right',
                      fontFamily: 'var(--mx-font-mono)',
                      fontSize: 13,
                      color: m.passRate > 0 ? 'var(--mx-signal)' : 'var(--mx-fog)',
                    }}
                  >
                    {(m.passRate * 100).toFixed(0)}%
                  </td>
                  <td
                    className="mx-tabular"
                    style={{
                      padding: '14px 0',
                      textAlign: 'right',
                      fontFamily: 'var(--mx-font-mono)',
                      fontSize: 13,
                      color: 'var(--mx-bone)',
                    }}
                  >
                    {m.avgScore === null ? '—' : Math.round(m.avgScore)}
                  </td>
                  <td
                    className="mx-tabular"
                    style={{
                      padding: '14px 0',
                      textAlign: 'right',
                      fontFamily: 'var(--mx-font-mono)',
                      fontSize: 13,
                      color: 'var(--mx-fog)',
                    }}
                  >
                    {fmtCompact(m.totalTokens)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--mx-fog-dim)',
              marginTop: 14,
            }}
          >
            Generated {new Date(stats.generatedAt).toUTCString()}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function StatsEmpty() {
  return (
    <Card title="What's in it">
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        {'// stats endpoint unavailable'}
      </div>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: '24px 22px' }}>
      <div
        className="mx-tabular"
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 32,
          letterSpacing: '-0.01em',
          color: highlight ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog)',
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SchemaCard() {
  return (
    <Card title="Schema · one line per run">
      <pre
        style={{
          margin: 0,
          padding: '20px 24px',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 12.5,
          lineHeight: 1.65,
          color: 'var(--mx-bone)',
          background: 'var(--mx-void)',
          overflow: 'auto',
          maxWidth: '100%',
        }}
      >
        {`{
  "id": "uuid",
  "challenge": "treasure-hunt",
  "seed": int,
  "provider": "openai" | "anthropic" | "gemini" | "groq" | "openrouter" | "mock" | "solver",
  "model": "gpt-4o-mini" | ...,
  "status": "passed" | "failed" | "error" | "killed",
  "score": int | null,
  "stepsUsed": int,
  "tokensUsed": int,
  "msUsed": int,
  "handle": "string" | null,
  "createdAt": "ISO-8601",
  "finishedAt": "ISO-8601" | null,
  "events": [
    { "kind": "hello", "runId": "...", "seed": int, "initialWorld": { ... } },
    { "kind": "observation", "step": int, "observation": { ... } },
    { "kind": "thinking", "step": int, "reasoning": "string", "tokensUsed": int, "msUsed": int },
    { "kind": "action", "step": int, "action": { ... }, "outcome": "..." },
    { "kind": "state", "step": int, "agent": [row, col], "inventory": [...], ... },
    { "kind": "done", "status": "...", "score": { ... }, ... }
  ]
}`}
      </pre>
    </Card>
  );
}

function CitationCard() {
  return (
    <Card title="Cite">
      <pre
        style={{
          margin: 0,
          padding: '20px 24px',
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 12,
          lineHeight: 1.65,
          color: 'var(--mx-bone)',
          background: 'var(--mx-void)',
          overflow: 'auto',
        }}
      >
        {`@misc{mentisix2026treasurehunt,
  title  = {Mentisix Treasure Hunt v0: An open trajectory benchmark for LLM agents},
  author = {Mentisix},
  year   = {2026},
  url    = {https://mentisix.com},
  note   = {Dataset accessed via /datasets/treasure-hunt/runs.jsonl}
}`}
      </pre>
    </Card>
  );
}

function LicenseCard() {
  return (
    <Card title="License">
      <div
        style={{
          padding: '20px 24px',
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--mx-fog)',
        }}
      >
        The Mentisix dataset is released under{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--mx-signal)' }}
        >
          Creative Commons Attribution 4.0
        </a>
        . Use it commercially or for research, modify and redistribute — credit Mentisix with a
        link. Per-run model outputs reflect the originating provider's terms; the structure,
        scoring, and ground-truth simulator state are ours.
      </div>
    </Card>
  );
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtMs(ms: number): string {
  if (ms >= 3_600_000) return `${(ms / 3_600_000).toFixed(1)}h`;
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}min`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export const metadata = {
  title: 'Dataset · Mentisix',
  description: 'The open Mentisix trajectory corpus. Every run, every reasoning step. CC-BY-4.0.',
};
