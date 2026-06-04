/**
 * Mentisix shared domain types.
 *
 * The wire contracts between apps/web and apps/api live here. They are
 * authoritative — both sides import these instead of redeclaring shapes.
 */

import type {
  Action,
  ActionOutcome,
  Cell,
  KeyColor,
  Observation,
  Position,
  ScoreBreakdown,
  WorldStatus,
} from '@mentisix/sim';

export type ChallengeSlug = 'treasure-hunt';
export const CHALLENGES: readonly ChallengeSlug[] = ['treasure-hunt'] as const;

export type ProviderId = 'openai' | 'anthropic' | 'groq' | 'mock';
export const PROVIDERS: readonly ProviderId[] = ['openai', 'anthropic', 'groq', 'mock'] as const;

export type ModelRef = {
  provider: ProviderId;
  model: string;
};

export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'killed' | 'error';

export type RunOptions = {
  /** Hard cap on sim steps. Default: challenge default (200 for treasure-hunt). */
  maxSteps?: number;
  /** Hard cap on total LLM tokens spent across all turns. Default: 200_000. */
  maxTokens?: number;
  /** Hard cap on wall-clock time for the whole run in ms. Default: 5 * 60_000. */
  maxWallClockMs?: number;
};

export type RunStartRequest = {
  challenge: ChallengeSlug;
  seed?: number;
  model: ModelRef;
  /** User's API key — held in memory only, never persisted. */
  apiKey: string;
  options?: RunOptions;
};

export type RunStartResponse = {
  runId: string;
  seed: number;
  challenge: ChallengeSlug;
};

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
  finishedAt: string | null;
  error?: string;
};

export type WorldSnapshot = {
  seed: number;
  width: number;
  height: number;
  maxSteps: number;
  visionRadius: number;
  agent: Position;
  /** Full grid as known at run start. The agent only sees fog-limited view. */
  grid: readonly (readonly Cell[])[];
};

export type RunEvent =
  | { kind: 'hello'; runId: string; seed: number; initialWorld: WorldSnapshot }
  | { kind: 'observation'; step: number; observation: Observation }
  | {
      kind: 'thinking';
      step: number;
      reasoning?: string;
      tokensUsed: number;
      msUsed: number;
    }
  | { kind: 'action'; step: number; action: Action; outcome: ActionOutcome }
  | {
      kind: 'state';
      step: number;
      agent: Position;
      inventory: readonly KeyColor[];
      treasuresCollected: number;
      status: WorldStatus;
    }
  | { kind: 'done'; status: RunStatus; score: ScoreBreakdown; tokensUsed: number; msUsed: number }
  | { kind: 'error'; message: string };

export type LeaderboardRow = {
  rank: number;
  model: ModelRef;
  bestScore: number;
  bestStepsUsed: number;
  runs: number;
};

export const MENTISIX = {
  name: 'Mentisix',
  tagline: 'A proving ground for machine minds.',
} as const;
