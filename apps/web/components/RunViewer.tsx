'use client';

import type { RunStartRequest } from '@mentisix/types';
import { Button, Card, Kicker, Tag } from '@mentisix/ui';
import Link from 'next/link';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { client } from '../lib/api';
import { type RunUiState, initialState, reducer } from '../lib/run-state';
import { GridCanvas } from './GridCanvas';
import { ReasoningFeed } from './ReasoningFeed';
import { RunSetup } from './RunSetup';
import { StatsReadout } from './StatsReadout';

export function RunViewer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (req: RunStartRequest) => {
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

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
            Run · seed {state.seed ?? '—'}
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusTag status={state.status} />
          <Button onClick={reset}>New run</Button>
        </div>
      </div>

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

      {state.status === 'done' && state.finalScore ? (
        <FinalCard
          status={state.terminalStatus}
          score={state.finalScore.score}
          stepsUsed={state.finalScore.stepsUsed}
          tokensUsed={state.tokensUsed}
          msUsed={state.msUsed}
        />
      ) : null}

      {state.status === 'done' && state.runId ? <ShareCard runId={state.runId} /> : null}

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
    if (terminal === 'failed') return 'Failed — out of steps';
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

function ShareCard({ runId }: { runId: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window === 'undefined' ? `/runs/${runId}` : `${window.location.origin}/runs/${runId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — fall back to manual copy from the input
    }
  };

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
        <Button onClick={copy} variant="signal" dot>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <Link href={`/runs/${runId}`}>
          <Button>Open replay</Button>
        </Link>
      </div>
    </Card>
  );
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
