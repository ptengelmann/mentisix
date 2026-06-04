/**
 * The Challenge contract.
 *
 * Every Mentisix challenge implements this interface. The harness drives
 * the loop generically; each challenge supplies its own state shape,
 * action shape, observation shape, structured-output schema, scoring,
 * and termination logic. New challenges plug in by exporting a
 * `Challenge<S, A, O>` instance and registering it.
 *
 * Generic params:
 *   S — state type. Opaque to the harness; passed back into step/observe/etc.
 *   A — action type. The structured output the LLM agent produces each turn.
 *   O — observation type. What the agent receives each turn.
 */

import type { Difficulty } from './types.js';

export type ChallengeId = 'treasure-hunt' | 'memory-probe';

export type ChallengeStatus = 'running' | 'won' | 'lost';

export type ChallengeScore = {
  readonly won: boolean;
  readonly score: number;
  readonly stepsUsed: number;
  readonly maxSteps: number;
};

export type DifficultyManifest = {
  readonly id: Difficulty;
  readonly label: string;
  readonly description: string;
  /** Step budget at this difficulty. Exposed so clients can show "200 steps" etc. */
  readonly maxSteps: number;
};

export type ChallengeManifest = {
  readonly id: ChallengeId;
  readonly label: string;
  readonly tagline: string;
  readonly description: string;
  readonly difficulties: readonly DifficultyManifest[];
};

export interface Challenge<S, A, O> {
  readonly id: ChallengeId;
  readonly manifest: ChallengeManifest;

  /** System prompt the agent sees once at the start of the run. */
  systemPrompt(difficulty: Difficulty): string;

  /** Construct the initial state from seed + difficulty. Pure. */
  init(seed: number, difficulty: Difficulty): S;

  /** Extract the agent-visible observation from the state. Pure. */
  observe(state: S): O;

  /** Render the observation as the user-message text shown to the LLM. */
  serializeObservation(observation: O, state: S): string;

  /** Apply an action; return the next state. Pure. */
  step(state: S, action: A): S;

  /** Is the state terminal? (won/lost). */
  isTerminal(state: S): boolean;

  /** Status for the wire contract. */
  status(state: S): ChallengeStatus;

  /** Score breakdown for the terminal state. */
  score(state: S): ChallengeScore;

  /** How many steps have been used so far. Used for step-budget caps. */
  stepsUsed(state: S): number;

  /** The challenge's step budget at this difficulty. */
  maxSteps(state: S): number;
}
