'use client';

import type { RunEvent } from '@mentisix/types';
import { Button, Card, Kicker, Tag } from '@mentisix/ui';
import { useEffect, useReducer, useRef, useState } from 'react';
import { initialState, reducer } from '../lib/run-state';
import { GridCanvas } from './GridCanvas';
import { ReasoningFeed } from './ReasoningFeed';
import { StatsReadout } from './StatsReadout';

export type ReplayPlayerProps = {
  runId: string;
  events: readonly RunEvent[];
};

/**
 * Drives the same reducer the live viewer uses, but from a static event
 * array on a fixed cadence. Public — no API key needed to watch.
 */
export function ReplayPlayer({ runId, events }: ReplayPlayerProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch({ kind: 'reset' });
    dispatch({ kind: 'starting', runId, seed: 0 });
    setTick(0);
    setPaused(false);
  }, [runId]);

  useEffect(() => {
    if (paused) return;
    if (tick >= events.length) return;
    timerRef.current = setInterval(() => {
      setTick((t) => {
        if (t >= events.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          return t;
        }
        const event = events[t];
        if (event) dispatch({ kind: 'sse', event });
        return t + 1;
      });
    }, 90);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, tick, events]);

  const total = events.length;
  const progress = Math.min(tick, total);
  const finished = tick >= total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Kicker index={String((state.seed ?? 0) % 100).padStart(2, '0')}>
            Replay · {progress} / {total} events
          </Kicker>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '14px 0 0',
            }}
          >
            {finished ? terminalTitle(state.terminalStatus) : 'Watching it think'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {finished ? <Tag state="pass">Done</Tag> : <Tag state="run">Replaying</Tag>}
          {finished ? (
            <Button
              onClick={() => {
                dispatch({ kind: 'reset' });
                dispatch({ kind: 'starting', runId, seed: 0 });
                setTick(0);
                setPaused(false);
              }}
            >
              Replay
            </Button>
          ) : (
            <Button onClick={() => setPaused((p) => !p)}>{paused ? 'Resume' : 'Pause'}</Button>
          )}
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

        <Card title="Reasoning">
          <div style={{ height: 560, maxHeight: 'calc(100dvh - 280px)' }}>
            <ReasoningFeed entries={state.reasonings} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function terminalTitle(t: ReturnType<typeof reducer>['terminalStatus']): string {
  if (t === 'passed') return 'Passed';
  if (t === 'failed') return 'Failed · out of steps';
  return 'Run ended';
}
