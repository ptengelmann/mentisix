'use client';

import type { RunStartRequest } from '@mentisix/types';
import { Button, Card, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { client } from '../lib/api';
import { type RunUiState, initialState, reducer } from '../lib/run-state';
import { GridCanvas } from './GridCanvas';
import { MemoryProbeView } from './MemoryProbeView';
import { ReasoningFeed } from './ReasoningFeed';
import { RunSetup } from './RunSetup';
import { StatsReadout } from './StatsReadout';

export function RunViewer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [lastReq, setLastReq] = useState<RunStartRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (req: RunStartRequest) => {
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setLastReq(req);

    try {
      const { runId, seed } = await client.startRun(req);
      dispatch({ kind: 'starting', runId, seed });

      for await (const event of client.streamRun(runId, abort.signal)) {
        if (abort.signal.aborted) break;
        dispatch({ kind: 'sse', event });
      }
    } catch (err) {
      if (abort.signal.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ kind: 'transport_error', message });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLastReq(null);
    dispatch({ kind: 'reset' });
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (state.status === 'idle') {
    return <RunSetup onStart={start} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Kicker index={state.seed != null ? String(state.seed % 100).padStart(2, '0') : '00'}>
            Run
          </Kicker>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '14px 0 0',
            }}
          >
            {titleFor(state.status, state.terminalStatus)}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {state.seed != null ? <SeedChip seed={state.seed} /> : null}
          <StatusTag status={state.status} />
          <Button onClick={reset}>New run</Button>
        </div>
      </div>

      {lastReq?.challenge === 'memory-probe' && state.mp ? (
        <MemoryProbeView mp={state.mp} reasonings={state.reasonings} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, auto) minmax(280px, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Grid · Treasure Hunt v0">
              <div style={{ padding: 20 }}>
                <GridCanvas
                  grid={state.grid}
                  agent={state.agent}
                  seenCells={state.seenCells}
                  visionRadius={state.world?.visionRadius ?? 3}
                  inventory={state.inventory}
                />
              </div>
            </Card>
            <StatsReadout
              step={state.step}
              maxSteps={state.maxSteps}
              treasuresCollected={state.treasuresCollected}
              treasuresTotal={state.treasuresTotal || 3}
              tokensUsed={state.tokensUsed}
              msUsed={state.msUsed}
            />
          </div>

          <Card title="Reasoning" meta={inventoryLabel(state.inventory)}>
            <div style={{ height: 560, maxHeight: 'calc(100dvh - 280px)' }}>
              <ReasoningFeed entries={state.reasonings} />
            </div>
          </Card>
        </div>
      )}

      {state.status === 'done' && state.finalScore ? (
        <FinalCard
          status={state.terminalStatus}
          score={state.finalScore.score}
          stepsUsed={state.finalScore.stepsUsed}
          tokensUsed={state.tokensUsed}
          msUsed={state.msUsed}
        />
      ) : null}

      {state.status === 'done' && state.runId && state.seed != null ? (
        <ShareCard
          runId={state.runId}
          seed={state.seed}
          modelName={lastReq?.model.model ?? null}
          handle={lastReq?.handle ?? null}
          terminal={state.terminalStatus}
          score={state.finalScore?.score ?? null}
        />
      ) : null}

      {state.error ? (
        <div
          style={{
            border: '1px solid #5A2420',
            background: 'rgba(255,90,77,0.06)',
            color: 'var(--mx-fault)',
            padding: '14px 18px',
            borderRadius: 2,
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 12,
            letterSpacing: '0.06em',
          }}
        >
          {state.error}
        </div>
      ) : null}
    </div>
  );
}

function titleFor(status: RunUiState['status'], terminal: RunUiState['terminalStatus']): string {
  if (status === 'starting') return 'Boot sequence';
  if (status === 'live') return 'Watching it think';
  if (status === 'done') {
    if (terminal === 'passed') return 'Passed';
    if (terminal === 'failed') return 'Failed · out of steps';
    return 'Run ended';
  }
  if (status === 'error') return 'Run errored';
  return 'Idle';
}

function StatusTag({
  status,
}: {
  status: RunUiState['status'];
}) {
  if (status === 'starting') return <Tag state="run">Booting</Tag>;
  if (status === 'live') return <Tag state="run">Streaming</Tag>;
  if (status === 'done') return <Tag state="pass">Done</Tag>;
  if (status === 'error') return <Tag state="fail">Error</Tag>;
  return <Tag>Idle</Tag>;
}

function inventoryLabel(inv: readonly string[]): string {
  if (inv.length === 0) return 'inventory · empty';
  return `inventory · ${inv.map((k) => `${k}_key`).join(', ')}`;
}

function FinalCard({
  status,
  score,
  stepsUsed,
  tokensUsed,
  msUsed,
}: {
  status: RunUiState['terminalStatus'];
  score: number;
  stepsUsed: number;
  tokensUsed: number;
  msUsed: number;
}) {
  const ok = status === 'passed';
  return (
    <Card title="Final" meta={ok ? <Tag state="pass">Passed</Tag> : <Tag state="fail">Failed</Tag>}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          background: 'var(--mx-line-soft)',
        }}
      >
        <FinalStat label="Score" value={String(score)} highlight />
        <FinalStat label="Steps" value={String(stepsUsed)} />
        <FinalStat label="Tokens" value={String(tokensUsed)} />
        <FinalStat label="Wall-clock" value={`${Math.round(msUsed)}`} suffix="ms" />
      </div>
    </Card>
  );
}

function SeedChip({ seed }: { seed: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(seed));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy seed ${seed}`}
      style={{
        background: 'var(--mx-void)',
        border: '1px solid var(--mx-line)',
        padding: '6px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: copied ? 'var(--mx-signal)' : 'var(--mx-fog)',
        cursor: 'pointer',
        transition: 'color var(--mx-dur) var(--mx-ease)',
      }}
    >
      <span>seed {seed}</span>
      <span style={{ color: copied ? 'var(--mx-signal)' : 'var(--mx-fog-dim)' }}>
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  );
}

function ShareCard({
  runId,
  seed,
  modelName,
  handle,
  terminal,
  score,
}: {
  runId: string;
  seed: number;
  modelName: string | null;
  handle: string | null;
  terminal: RunUiState['terminalStatus'];
  score: number | null;
}) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window === 'undefined' ? `/runs/${runId}` : `${window.location.origin}/runs/${runId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore, fall back to manual copy from the input
    }
  };

  const tweetText = buildTweetText({ seed, modelName, handle, terminal, score });
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;

  return (
    <Card title="Share this run">
      <div
        style={{
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <code
          style={{
            flex: 1,
            minWidth: 240,
            background: 'var(--mx-void)',
            border: '1px solid var(--mx-line-soft)',
            padding: '11px 14px',
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 12,
            color: 'var(--mx-bone)',
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {url}
        </code>
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="signal" dot>
            Post to X
          </Button>
        </a>
        <Button onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
        <Link href={`/runs/${runId}`}>
          <Button>Open replay</Button>
        </Link>
      </div>
    </Card>
  );
}

function buildTweetText({
  seed,
  modelName,
  handle,
  terminal,
  score,
}: {
  seed: number;
  modelName: string | null;
  handle: string | null;
  terminal: RunUiState['terminalStatus'];
  score: number | null;
}): string {
  const model = modelName ?? 'an LLM';
  const who = handle ? `@${handle} · ` : '';
  if (terminal === 'passed') {
    return `${who}${model} cleared Mentisix Treasure Hunt · seed ${seed} · score ${score ?? '·'}`;
  }
  if (terminal === 'failed') {
    return `${who}I watched ${model} fail Mentisix Treasure Hunt · seed ${seed} · score ${score ?? 0}`;
  }
  return `${who}${model} on Mentisix Treasure Hunt · seed ${seed}`;
}

function FinalStat({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: '20px 18px' }}>
      <div
        className="mx-tabular"
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 30,
          letterSpacing: '-0.01em',
          color: highlight ? 'var(--mx-signal)' : 'var(--mx-bone)',
        }}
      >
        {value}
        {suffix ? (
          <span style={{ fontSize: 14, color: 'var(--mx-fog)', marginLeft: 4 }}>{suffix}</span>
        ) : null}
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
