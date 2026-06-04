'use client';

import type { RunEvent } from '@mentisix/types';
import { Button, Card, Kicker, Tag } from '@mentisix/ui';
import { useEffect, useReducer, useRef, useState } from 'react';

export type MemoryProbeReplayPlayerProps = {
  runId: string;
  events: readonly RunEvent[];
};

type Entry =
  | { kind: 'tell'; turn: number; reasoning: string; factKey?: string; factValue?: string }
  | { kind: 'distractor'; turn: number; reasoning: string }
  | {
      kind: 'ask';
      turn: number;
      reasoning: string;
      factKey?: string;
      answer: string;
      expected?: string;
      correct?: boolean;
    };

type State = {
  entries: Entry[];
  turn: number;
  maxTurns: number;
  factsRevealed: number;
  factCount: number;
  answersGiven: number;
  answersCorrect: number;
  status: 'running' | 'won' | 'lost' | null;
  finalScore: number | null;
};

const initial: State = {
  entries: [],
  turn: 0,
  maxTurns: 0,
  factsRevealed: 0,
  factCount: 0,
  answersGiven: 0,
  answersCorrect: 0,
  status: null,
  finalScore: null,
};

type Action = { kind: 'reset' } | { kind: 'event'; event: RunEvent };

type Pending = {
  reasoning?: string;
  observation?: { kind: 'tell' | 'ask' | 'distractor'; key?: string; value?: string };
};

function reducer(state: State, action: Action, pending: Pending): State {
  if (action.kind === 'reset') return initial;
  const e = action.event;
  if (e.kind === 'mp_hello') {
    return { ...initial, maxTurns: e.maxTurns, factCount: e.factCount, status: 'running' };
  }
  if (e.kind === 'observation') {
    const obs = e.observation as
      | {
          turn?: number;
          current?:
            | { kind: 'tell'; fact?: { key: string; value: string } }
            | { kind: 'ask'; key: string; expected: string }
            | { kind: 'distractor'; content: string };
        }
      | undefined;
    if (obs?.current) {
      if (obs.current.kind === 'tell' && obs.current.fact) {
        pending.observation = {
          kind: 'tell',
          key: obs.current.fact.key,
          value: obs.current.fact.value,
        };
      } else if (obs.current.kind === 'ask') {
        pending.observation = { kind: 'ask', key: obs.current.key };
      } else {
        pending.observation = { kind: 'distractor' };
      }
    }
    return { ...state, turn: e.step };
  }
  if (e.kind === 'thinking') {
    pending.reasoning = e.reasoning ?? '';
    return state;
  }
  if (e.kind === 'mp_action') {
    const obs = pending.observation;
    const reasoning = pending.reasoning ?? '';
    let entry: Entry;
    if (obs?.kind === 'ask') {
      entry = {
        kind: 'ask',
        turn: e.step,
        reasoning,
        factKey: obs.key,
        answer: e.answer,
        ...(e.expected !== undefined ? { expected: e.expected } : {}),
        ...(e.correct !== undefined ? { correct: e.correct } : {}),
      };
    } else if (obs?.kind === 'tell') {
      entry = {
        kind: 'tell',
        turn: e.step,
        reasoning,
        ...(obs.key !== undefined ? { factKey: obs.key } : {}),
        ...(obs.value !== undefined ? { factValue: obs.value } : {}),
      };
    } else {
      entry = { kind: 'distractor', turn: e.step, reasoning };
    }
    pending.reasoning = undefined;
    pending.observation = undefined;
    return { ...state, entries: [...state.entries, entry] };
  }
  if (e.kind === 'mp_state') {
    return {
      ...state,
      turn: e.turn,
      factsRevealed: e.factsRevealed,
      answersGiven: e.answersGiven,
      answersCorrect: e.answersCorrect,
      status: e.status,
    };
  }
  if (e.kind === 'done') {
    const score = e.score as { score?: number } | null;
    return {
      ...state,
      status: e.status === 'passed' ? 'won' : 'lost',
      finalScore: score?.score ?? null,
    };
  }
  return state;
}

export function MemoryProbeReplayPlayer({ runId, events }: MemoryProbeReplayPlayerProps) {
  const pendingRef = useRef<Pending>({});
  const [state, dispatch] = useReducer(
    (s: State, a: Action) => reducer(s, a, pendingRef.current),
    initial,
  );
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset whenever the run ID changes (referenced so biome accepts the dep).
    void runId;
    pendingRef.current = {};
    dispatch({ kind: 'reset' });
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
        if (event) dispatch({ kind: 'event', event });
        return t + 1;
      });
    }, 60);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, tick, events]);

  const finished = tick >= events.length;

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
          <Kicker index={String(state.turn % 100).padStart(2, '0')}>
            Replay · turn {state.turn} / {state.maxTurns || '·'}
          </Kicker>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '14px 0 0',
            }}
          >
            {finished
              ? state.status === 'won'
                ? 'All facts recalled'
                : 'Memory failed'
              : 'Recall in progress'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {finished ? (
            <Tag state={state.status === 'won' ? 'pass' : 'fail'}>
              {state.status === 'won' ? 'Recalled' : 'Forgotten'}
            </Tag>
          ) : (
            <Tag state="run">Replaying</Tag>
          )}
          {finished ? (
            <Button
              onClick={() => {
                pendingRef.current = {};
                dispatch({ kind: 'reset' });
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

      <Stats state={state} />

      <Card title="Conversation log">
        <div
          style={{
            maxHeight: 'calc(100dvh - 320px)',
            overflowY: 'auto',
            padding: '14px 22px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            background: 'var(--mx-line-soft)',
          }}
        >
          {state.entries.length === 0 ? (
            <EmptyConversation />
          ) : (
            state.entries.map((entry) => <ConversationTurn key={entry.turn} entry={entry} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function Stats({ state }: { state: State }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--mx-line-soft)',
        border: '1px solid var(--mx-line-soft)',
      }}
    >
      <StatTile label="Turn" value={`${state.turn}/${state.maxTurns}`} />
      <StatTile label="Facts revealed" value={`${state.factsRevealed}/${state.factCount}`} />
      <StatTile
        label="Correct"
        value={`${state.answersCorrect}/${state.answersGiven || 0}`}
        highlight={state.answersCorrect > 0}
      />
      <StatTile label="Score" value={state.finalScore != null ? String(state.finalScore) : '·'} />
    </div>
  );
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ background: 'var(--mx-void)', padding: '20px 18px' }}>
      <div
        className="mx-tabular"
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 28,
          color: highlight ? 'var(--mx-signal)' : 'var(--mx-bone)',
          letterSpacing: '-0.01em',
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

function ConversationTurn({ entry }: { entry: Entry }) {
  const turnTag = entry.kind === 'tell' ? 'tell' : entry.kind === 'ask' ? 'ask' : 'distractor';
  const correct = entry.kind === 'ask' && entry.correct === true;
  const wrong = entry.kind === 'ask' && entry.correct === false;
  return (
    <div
      style={{
        background: 'var(--mx-void)',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '90px 1fr',
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        <div>turn {entry.turn}</div>
        <div
          style={{
            marginTop: 6,
            color: correct
              ? 'var(--mx-signal)'
              : wrong
                ? 'var(--mx-fault)'
                : entry.kind === 'tell'
                  ? 'var(--mx-signal-dim)'
                  : 'var(--mx-fog-dim)',
          }}
        >
          / {turnTag}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entry.kind === 'tell' && entry.factKey ? (
          <div style={{ fontSize: 13.5, color: 'var(--mx-bone)' }}>
            <span style={{ color: 'var(--mx-fog)' }}>told: </span>
            <span style={{ fontFamily: 'var(--mx-font-mono)', letterSpacing: '0.02em' }}>
              {entry.factKey} = "{entry.factValue}"
            </span>
          </div>
        ) : null}
        {entry.kind === 'ask' ? (
          <div style={{ fontSize: 13.5, color: 'var(--mx-bone)' }}>
            <span style={{ color: 'var(--mx-fog)' }}>asked: </span>
            <span style={{ fontFamily: 'var(--mx-font-mono)', letterSpacing: '0.02em' }}>
              {entry.factKey}
            </span>
          </div>
        ) : null}
        {entry.reasoning ? (
          <div style={{ fontSize: 13, color: 'var(--mx-fog)', lineHeight: 1.5 }}>
            {entry.reasoning}
          </div>
        ) : null}
        {entry.kind === 'ask' ? (
          <div
            style={{
              fontFamily: 'var(--mx-font-mono)',
              fontSize: 13,
              color: correct ? 'var(--mx-signal)' : 'var(--mx-fault)',
              letterSpacing: '0.02em',
            }}
          >
            answer: "{entry.answer}"
            {entry.expected && !correct ? (
              <span style={{ color: 'var(--mx-fog-dim)' }}> (expected: "{entry.expected}")</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyConversation() {
  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--mx-fog-dim)',
        background: 'var(--mx-void)',
      }}
    >
      {'// waiting for the first turn'}
    </div>
  );
}
