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
  Difficulty,
  KeyColor,
  Observation,
  Position,
  ScoreBreakdown,
  WorldStatus,
} from '@mentisix/sim';

export type { Difficulty } from '@mentisix/sim';
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const satisfies readonly Difficulty[];

export type ChallengeSlug = 'treasure-hunt';
export const CHALLENGES: readonly ChallengeSlug[] = ['treasure-hunt'] as const;

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'mock'
  | 'solver';
export const PROVIDERS: readonly ProviderId[] = [
  'openai',
  'anthropic',
  'gemini',
  'groq',
  'openrouter',
  'mock',
  'solver',
] as const;

/** Provider IDs that exercise real LLM APIs (i.e. need a key). */
export const LLM_PROVIDERS: readonly ProviderId[] = [
  'openai',
  'anthropic',
  'gemini',
  'groq',
  'openrouter',
] as const;

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
  /**
   * Minimum delay between turns in ms. Useful for fast providers (Solver,
   * Mock) so the canvas animation has time to play. Default 0 — real LLMs
   * are slow enough on their own.
   */
  stepDelayMs?: number;
};

/**
 * Display handle attached to a run. Lowercase ASCII letters, digits, and
 * underscores; 1–16 chars. Validated server-side, never trusted from the
 * wire. Shown on the leaderboard as `@<handle>` so visitors can claim
 * their runs without an account.
 */
export const HANDLE_PATTERN = /^[a-z0-9_]{1,16}$/;

export type RunStartRequest = {
  challenge: ChallengeSlug;
  /** Difficulty tier within the challenge. Defaults to 'medium'. */
  difficulty?: Difficulty;
  seed?: number;
  model: ModelRef;
  /** User's API key. Held in memory only, never persisted. */
  apiKey: string;
  /** Optional display tag rendered on the leaderboard. */
  handle?: string;
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
  difficulty: Difficulty;
  seed: number;
  model: ModelRef;
  status: RunStatus;
  score: number | null;
  stepsUsed: number;
  tokensUsed: number;
  msUsed: number;
  createdAt: string;
  finishedAt: string | null;
  handle?: string;
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
  difficulty: Difficulty;
  bestScore: number;
  bestStepsUsed: number;
  runs: number;
  /** Handle on the run that produced this row's best score, if any. */
  handle?: string;
};

/**
 * One row of the public Mentisix dataset. Streamed as JSONL from
 * `/datasets/:challenge/runs.jsonl`. Researchers, labs, and curious
 * onlookers can consume this directly — the schema is part of the
 * benchmark contract.
 */
export type DatasetRow = {
  id: string;
  challenge: ChallengeSlug;
  difficulty: Difficulty;
  seed: number;
  provider: ProviderId;
  model: string;
  status: RunStatus;
  score: number | null;
  stepsUsed: number;
  tokensUsed: number;
  msUsed: number;
  handle: string | null;
  createdAt: string;
  finishedAt: string | null;
  /** Full step-by-step event log for the run. Same shape as the live SSE stream. */
  events: RunEvent[];
};

export type DatasetStatsByModel = {
  provider: ProviderId;
  model: string;
  difficulty: Difficulty;
  runs: number;
  passes: number;
  passRate: number;
  totalTokens: number;
  avgScore: number | null;
};

export type DatasetStats = {
  challenge: ChallengeSlug;
  totalRuns: number;
  totalPassedRuns: number;
  totalTokens: number;
  totalMs: number;
  byModel: DatasetStatsByModel[];
  generatedAt: string;
};

export const MENTISIX = {
  name: 'Mentisix',
  tagline: 'A proving ground for machine minds.',
} as const;
