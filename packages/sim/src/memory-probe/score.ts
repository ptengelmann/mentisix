import type { ProbeState } from './types.js';

export type ProbeScoreBreakdown = {
  readonly won: boolean;
  readonly correct: number;
  readonly incorrect: number;
  readonly total: number;
  readonly stepsUsed: number;
  readonly maxSteps: number;
  readonly score: number;
};

/**
 * Won = every 'ask' answered correctly. Score = base 1000 + 200 per
 * correct answer; partial-credit 200 per correct - 100 per incorrect
 * on lost runs. Anchored so a perfect easy run (1 correct) scores 1200
 * and a perfect hard run (3 correct) scores 1600.
 */
export function scoreProbe(state: ProbeState): ProbeScoreBreakdown {
  const totalAsks = state.schedule.filter((t) => t.kind === 'ask').length;
  const correct = state.answers.filter((a) => a.correct).length;
  const incorrect = state.answers.filter((a) => !a.correct).length;
  const won = state.status === 'won';

  const score = won ? 1000 + correct * 200 : Math.max(0, correct * 200 - incorrect * 100);

  return {
    won,
    correct,
    incorrect,
    total: totalAsks,
    stepsUsed: state.turn,
    maxSteps: state.maxTurns,
    score,
  };
}
