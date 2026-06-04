import type { Answer, ProbeAction, ProbeState } from './types.js';

/**
 * Apply one turn. The agent's `answer` is only scored on 'ask' turns;
 * on 'tell' / 'distractor' turns the response is ignored (but consumes
 * a token budget). State advances by one turn; status flips to 'won'
 * when every question has been answered correctly, 'lost' when any
 * answer is wrong, otherwise stays running.
 */
export function stepProbe(state: ProbeState, action: ProbeAction): ProbeState {
  if (state.status !== 'running') return state;
  const current = state.schedule[state.turn];
  if (!current) return { ...state, status: 'lost' };

  let answers = state.answers;
  if (current.kind === 'ask') {
    const correct = matches(action.answer, current.expected);
    const answer: Answer = {
      turn: state.turn,
      key: current.key,
      expected: current.expected,
      given: action.answer.trim(),
      correct,
    };
    answers = [...answers, answer];
  }

  const nextTurn = state.turn + 1;
  const allAsks = state.schedule.filter((t) => t.kind === 'ask').length;
  const answered = answers.length;
  const anyWrong = answers.some((a) => !a.correct);
  let status: ProbeState['status'] = 'running';
  if (anyWrong) status = 'lost';
  else if (nextTurn >= state.maxTurns) {
    status = answered === allAsks ? 'won' : 'lost';
  }

  return { ...state, turn: nextTurn, answers, status };
}

function matches(given: string, expected: string): boolean {
  return normalize(given) === normalize(expected);
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\.,;:]+$/g, '');
}
