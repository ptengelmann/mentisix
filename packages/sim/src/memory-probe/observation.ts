import type { ProbeObservation, ProbeState, TurnKind } from './types.js';

const RECENT_WINDOW = 4;

export function observeProbe(state: ProbeState): ProbeObservation {
  const current = state.schedule[state.turn];
  if (!current) {
    throw new Error(`observeProbe: turn ${state.turn} out of range`);
  }
  const start = Math.max(0, state.turn - RECENT_WINDOW);
  const recent: { turn: number; kind: TurnKind; summary: string }[] = [];
  for (let t = start; t < state.turn; t++) {
    const past = state.schedule[t];
    if (!past) continue;
    recent.push({ turn: t, kind: past.kind, summary: summarizePast(past, state, t) });
  }
  return {
    turn: state.turn,
    maxTurns: state.maxTurns,
    current,
    recent,
  };
}

function summarizePast(
  turn: ProbeState['schedule'][number],
  state: ProbeState,
  turnIndex: number,
): string {
  if (turn.kind === 'tell') return `told: ${turn.fact.key} = "${turn.fact.value}"`;
  if (turn.kind === 'distractor') return turn.content;
  if (turn.kind === 'ask') {
    const ans = state.answers.find((a) => a.turn === turnIndex);
    if (!ans) return `asked: ${turn.key} (no response recorded)`;
    return `asked: ${turn.key} -> you answered "${ans.given}" (${ans.correct ? 'correct' : 'incorrect'})`;
  }
  return '';
}
