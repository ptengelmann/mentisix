'use client';

import { Card } from '@mentisix/ui';
import { useEffect, useRef } from 'react';
import type { MpFact, MpState, ReasoningEntry } from '../lib/run-state';

export type MemoryProbeViewProps = {
  mp: MpState;
  reasonings: readonly ReasoningEntry[];
};

export function MemoryProbeView({ mp, reasonings }: MemoryProbeViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title="Timeline · Memory Probe v0" meta={<TimelineMeta mp={mp} />}>
        <ScheduleStrip mp={mp} />
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <Card title="Facts">
          <FactRegistry mp={mp} />
        </Card>
        <Card title="Live reasoning" meta={<ReasoningMeta mp={mp} />}>
          <div style={{ height: 480, maxHeight: 'calc(100dvh - 380px)' }}>
            <MpReasoningFeed entries={reasonings} mp={mp} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function TimelineMeta({ mp }: { mp: MpState }) {
  return (
    <span
      className="mx-tabular"
      style={{
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--mx-fog-dim)',
        display: 'inline-flex',
        gap: 14,
      }}
    >
      <span>
        turn {String(mp.currentTurn).padStart(2, '0')} / {mp.maxTurns}
      </span>
      <span>·</span>
      <span>
        facts {mp.factsRevealed} / {mp.factsExpected}
      </span>
      <span>·</span>
      <span style={{ color: mp.answersCorrect > 0 ? 'var(--mx-signal)' : 'var(--mx-fog-dim)' }}>
        asks {mp.answersCorrect}/{mp.answersGiven}
      </span>
    </span>
  );
}

function ScheduleStrip({ mp }: { mp: MpState }) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  // Map answers by turn for O(1) lookup.
  const answersByTurn = new Map<number, { correct?: boolean }>();
  for (const a of mp.answers) answersByTurn.set(a.turn, { correct: a.correct });

  // Auto-scroll the strip to keep the playhead visible on hard runs.
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const child = el.children[mp.currentTurn] as HTMLElement | undefined;
    if (!child) return;
    const left = child.offsetLeft - el.clientWidth / 2 + child.clientWidth / 2;
    el.scrollTo({ left, behavior: 'smooth' });
  }, [mp.currentTurn]);

  return (
    <div style={{ padding: '28px 22px 24px' }}>
      <div
        ref={stripRef}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
          height: 96,
          overflowX: 'auto',
          paddingBottom: 6,
        }}
      >
        {mp.schedule.map((kind, turn) => (
          <ScheduleBar
            key={`t${turn}-${kind}`}
            kind={kind}
            turn={turn}
            isCurrent={turn === mp.currentTurn}
            isPast={turn < mp.currentTurn}
            answer={answersByTurn.get(turn)}
          />
        ))}
      </div>
      <Legend />
    </div>
  );
}

function ScheduleBar({
  kind,
  turn,
  isCurrent,
  isPast,
  answer,
}: {
  kind: 'tell' | 'ask' | 'distractor';
  turn: number;
  isCurrent: boolean;
  isPast: boolean;
  answer?: { correct?: boolean };
}) {
  const tooltip = `turn ${turn} · ${kind}${
    kind === 'ask' && answer?.correct === true ? ' · correct' : ''
  }${kind === 'ask' && answer?.correct === false ? ' · wrong' : ''}`;

  // Heights tell the eye what matters at a glance.
  const height = kind === 'distractor' ? 18 : kind === 'tell' ? 72 : 60;

  // Colors:
  //   tell:        signal mint (revealed when reached)
  //   ask correct: signal mint, with glow
  //   ask wrong:   fault red, with glow
  //   ask pending: hollow outline
  //   distractor:  fog dim
  let background = 'var(--mx-line)';
  let border = '1px solid transparent';
  let boxShadow = 'none';

  if (kind === 'tell') {
    background = isPast || isCurrent ? 'var(--mx-signal)' : 'var(--mx-signal-dim)';
    boxShadow = isPast || isCurrent ? '0 0 12px rgba(176, 255, 215, 0.35)' : 'none';
  } else if (kind === 'ask') {
    if (answer?.correct === true) {
      background = 'var(--mx-signal)';
      boxShadow = '0 0 14px rgba(176, 255, 215, 0.45)';
    } else if (answer?.correct === false) {
      background = 'var(--mx-fault)';
      boxShadow = '0 0 14px rgba(255, 90, 77, 0.45)';
    } else {
      background = 'transparent';
      border = '1px solid var(--mx-signal-dim)';
    }
  } else {
    background = isPast || isCurrent ? 'var(--mx-fog-dim)' : 'var(--mx-line)';
  }

  return (
    <div
      title={tooltip}
      style={{
        flex: '1 1 0',
        minWidth: 4,
        height,
        background,
        border,
        boxShadow,
        position: 'relative',
        transition:
          'background var(--mx-dur) var(--mx-ease), box-shadow var(--mx-dur) var(--mx-ease)',
      }}
    >
      {isCurrent ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: -10,
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--mx-signal)',
            boxShadow: '0 0 10px var(--mx-signal)',
          }}
        />
      ) : null}
    </div>
  );
}

function Legend() {
  return (
    <div
      style={{
        marginTop: 18,
        display: 'flex',
        gap: 22,
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--mx-fog-dim)',
        flexWrap: 'wrap',
      }}
    >
      <LegendSwatch swatch={<TellSwatch />} label="tell" />
      <LegendSwatch swatch={<AskSwatch />} label="ask pending" />
      <LegendSwatch swatch={<CorrectSwatch />} label="ask correct" />
      <LegendSwatch swatch={<WrongSwatch />} label="ask wrong" />
      <LegendSwatch swatch={<DistractorSwatch />} label="distractor" />
    </div>
  );
}

function LegendSwatch({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {swatch}
      <span>{label}</span>
    </span>
  );
}

function TellSwatch() {
  return <span style={{ width: 4, height: 14, background: 'var(--mx-signal)' }} />;
}
function AskSwatch() {
  return (
    <span
      style={{
        width: 4,
        height: 14,
        background: 'transparent',
        border: '1px solid var(--mx-signal-dim)',
      }}
    />
  );
}
function CorrectSwatch() {
  return (
    <span
      style={{
        width: 4,
        height: 14,
        background: 'var(--mx-signal)',
        boxShadow: '0 0 6px rgba(176, 255, 215, 0.6)',
      }}
    />
  );
}
function WrongSwatch() {
  return (
    <span
      style={{
        width: 4,
        height: 14,
        background: 'var(--mx-fault)',
        boxShadow: '0 0 6px rgba(255, 90, 77, 0.55)',
      }}
    />
  );
}
function DistractorSwatch() {
  return <span style={{ width: 4, height: 6, background: 'var(--mx-fog-dim)' }} />;
}

function FactRegistry({ mp }: { mp: MpState }) {
  const placeholders = Math.max(0, mp.factsExpected - mp.facts.length);
  const placeholderArray = Array.from({ length: placeholders }, (_, i) => i);
  return (
    <div
      style={{
        padding: '12px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {mp.facts.map((fact) => (
        <FactCard key={fact.key} fact={fact} answer={mp.answers.find((a) => a.key === fact.key)} />
      ))}
      {placeholderArray.map((i) => (
        <PendingFactCard key={`pending-${i}`} index={mp.facts.length + i} />
      ))}
      {mp.facts.length === 0 && placeholders === 0 ? (
        <div
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
            padding: 12,
          }}
        >
          {'// awaiting first tell'}
        </div>
      ) : null}
    </div>
  );
}

function FactCard({
  fact,
  answer,
}: { fact: MpFact; answer?: { correct?: boolean; given: string } }) {
  const correct = answer?.correct === true;
  const wrong = answer?.correct === false;
  const accent = correct ? 'var(--mx-signal)' : wrong ? 'var(--mx-fault)' : 'var(--mx-signal-dim)';
  return (
    <div
      style={{
        background: 'var(--mx-void)',
        border: '1px solid var(--mx-line)',
        borderLeft: `2px solid ${accent}`,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{fact.key}</span>
        <span>t.{fact.tellTurn}</span>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 14,
          color: 'var(--mx-bone)',
          letterSpacing: '0.01em',
        }}
      >
        {fact.value}
      </div>
      {answer ? (
        <div
          style={{
            marginTop: 8,
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: correct ? 'var(--mx-signal)' : 'var(--mx-fault)',
          }}
        >
          {correct ? 'recalled' : 'said'} "{answer.given}"
        </div>
      ) : null}
    </div>
  );
}

function PendingFactCard({ index }: { index: number }) {
  return (
    <div
      style={{
        background: 'var(--mx-void)',
        border: '1px dashed var(--mx-line)',
        padding: '12px 14px',
        opacity: 0.55,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--mx-fog-dim)',
        }}
      >
        fact {String(index + 1).padStart(2, '0')} · pending
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: 'var(--mx-font-mono)',
          fontSize: 13,
          color: 'var(--mx-fog-dim)',
          letterSpacing: '0.06em',
        }}
      >
        {'// not yet told'}
      </div>
    </div>
  );
}

function ReasoningMeta({ mp }: { mp: MpState }) {
  const current = mp.schedule[mp.currentTurn];
  return (
    <span
      style={{
        fontFamily: 'var(--mx-font-mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--mx-fog-dim)',
      }}
    >
      {current ? `now: ${current}` : 'idle'} · open replay for full conversation log
    </span>
  );
}

function MpReasoningFeed({
  entries,
  mp,
}: {
  entries: readonly ReasoningEntry[];
  mp: MpState;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom must fire whenever entries change
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={ref}
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '4px 4px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {entries.length === 0 ? (
        <div
          style={{
            fontFamily: 'var(--mx-font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--mx-fog-dim)',
            padding: '12px 8px',
          }}
        >
          {'// awaiting first turn'}
        </div>
      ) : null}
      {entries.map((entry, i) => {
        const kind = entry.turnKind ?? 'distractor';
        const accent =
          kind === 'tell'
            ? 'var(--mx-signal)'
            : kind === 'ask'
              ? answerAccentForTurn(mp, entry.step)
              : 'var(--mx-line)';
        const askAnswer =
          kind === 'ask' ? mp.answers.find((a) => a.turn === entry.step) : undefined;
        return (
          <div
            key={`${entry.step}-${i}`}
            style={{
              borderLeft: `2px solid ${accent}`,
              paddingLeft: 12,
              opacity: kind === 'distractor' ? 0.7 : 1,
            }}
          >
            <div
              className="mx-tabular"
              style={{
                fontFamily: 'var(--mx-font-mono)',
                fontSize: 10.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:
                  kind === 'tell' || kind === 'ask' ? 'var(--mx-signal-dim)' : 'var(--mx-fog-dim)',
                marginBottom: 6,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>STEP {String(entry.step).padStart(3, '0')}</span>
              <span style={{ color: accent }}>/ {kind}</span>
              <span>{entry.tokensUsed} TOK</span>
              <span>{entry.msUsed}MS</span>
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--mx-bone)',
                wordWrap: 'break-word',
              }}
            >
              {entry.text || (
                <span style={{ color: 'var(--mx-fog-dim)' }}>(no reasoning provided)</span>
              )}
            </div>
            {askAnswer ? (
              <div
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--mx-font-mono)',
                  fontSize: 12,
                  letterSpacing: '0.02em',
                  color: askAnswer.correct ? 'var(--mx-signal)' : 'var(--mx-fault)',
                }}
              >
                answer: "{askAnswer.given}"
                {askAnswer.correct === false && askAnswer.expected ? (
                  <span style={{ color: 'var(--mx-fog-dim)' }}>
                    {' '}
                    (expected: "{askAnswer.expected}")
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function answerAccentForTurn(mp: MpState, turn: number): string {
  const answer = mp.answers.find((a) => a.turn === turn);
  if (!answer) return 'var(--mx-signal-dim)';
  return answer.correct ? 'var(--mx-signal)' : 'var(--mx-fault)';
}
