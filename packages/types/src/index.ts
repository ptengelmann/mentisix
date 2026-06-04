/**
 * Mentisix shared domain types.
 *
 * The wire contracts between apps/web and apps/api live here. They are
 * authoritative — both sides import these instead of redeclaring shapes.
 */

export type ChallengeSlug = 'treasure-hunt';

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'groq';

export type ModelRef = {
  provider: ProviderId;
  model: string;
};

export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'killed' | 'error';

export type RunSummary = {
  id: string;
  challenge: ChallengeSlug;
  seed: number;
  model: ModelRef;
  status: RunStatus;
  score: number | null;
  stepsUsed: number;
  tokensUsed: number;
  msUsed: number;
  createdAt: string;
};

export type LeaderboardRow = {
  rank: number;
  model: ModelRef;
  bestScore: number;
  bestStepsUsed: number;
  runs: number;
};

/**
 * Brand sanity assertion — re-export the tagline so downstream packages can
 * verify they're talking to a real Mentisix shared types package.
 */
export const MENTISIX = {
  name: 'Mentisix',
  tagline: 'A proving ground for machine minds.',
} as const;
