/**
 * Memory Probe sim types.
 *
 * The challenge: at early turns the agent is told facts. After a
 * variable number of distractor turns it is asked to recall a fact.
 * Each correctly recalled fact scores; each incorrect answer loses.
 * Tests in-context memory under noise.
 */

import type { Difficulty } from '../types.js';

export type TurnKind = 'tell' | 'ask' | 'distractor';

export type Fact = {
  readonly key: string;
  readonly value: string;
};

export type ProbeTurn =
  | { readonly kind: 'tell'; readonly fact: Fact }
  | { readonly kind: 'ask'; readonly key: string; readonly expected: string }
  | { readonly kind: 'distractor'; readonly content: string };

export type Answer = {
  readonly turn: number;
  readonly key: string;
  readonly expected: string;
  readonly given: string;
  readonly correct: boolean;
};

export type ProbeConfig = {
  readonly turns: number;
  readonly facts: number;
  readonly distractorTopics: number;
};

export const PROBE_CONFIG_BY_DIFFICULTY: Record<Difficulty, ProbeConfig> = {
  easy: { turns: 20, facts: 1, distractorTopics: 4 },
  medium: { turns: 40, facts: 2, distractorTopics: 8 },
  hard: { turns: 80, facts: 3, distractorTopics: 14 },
};

export type ProbeStatus = 'running' | 'won' | 'lost';

export type ProbeState = {
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly config: ProbeConfig;
  /** Full schedule of turns. The agent only sees them as the run progresses. */
  readonly schedule: readonly ProbeTurn[];
  /** Index of the next turn to present. */
  readonly turn: number;
  readonly maxTurns: number;
  /** Answers given so far. Length == number of past 'ask' turns. */
  readonly answers: readonly Answer[];
  readonly status: ProbeStatus;
};

export type ProbeObservation = {
  readonly turn: number;
  readonly maxTurns: number;
  readonly current: ProbeTurn;
  /** Recent history (last 4 turns) so the agent can ground its response. */
  readonly recent: readonly { turn: number; kind: TurnKind; summary: string }[];
};

export type ProbeAction = {
  readonly reasoning: string;
  readonly answer: string;
};
