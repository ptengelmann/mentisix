import type { WorldState } from './types.js';

export type ScoreBreakdown = {
  readonly won: boolean;
  readonly treasuresCollected: number;
  readonly treasuresTotal: number;
  readonly stepsUsed: number;
  readonly maxSteps: number;
  /** Final composite score. Higher is better. */
  readonly score: number;
};

/**
 * Composite score for a finished run.
 *
 * Pass/fail dominates; efficiency is a tie-breaker. Won runs get a base
 * 1000 + (steps remaining × 5) so finishing in 60 of 200 steps beats
 * finishing in 180. Lost runs get partial credit for treasures collected
 * (250 per treasure) so a 2/3 run beats a 0/3 run.
 */
export function score(world: WorldState): ScoreBreakdown {
  const treasuresTotal = world.config.treasures;
  const treasuresCollected = world.treasuresCollected;
  const stepsUsed = world.step;
  const maxSteps = world.config.maxSteps;
  const won = world.status === 'won';

  const value = won ? 1000 + Math.max(0, maxSteps - stepsUsed) * 5 : treasuresCollected * 250;

  return {
    won,
    treasuresCollected,
    treasuresTotal,
    stepsUsed,
    maxSteps,
    score: value,
  };
}
