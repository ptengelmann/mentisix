import {
  CONFIG_BY_DIFFICULTY,
  type Challenge,
  type ChallengeManifest,
  type ChallengeScore,
  type ChallengeStatus,
  type Difficulty,
  type Observation,
  type WorldState,
  createWorld,
  observe,
  score,
  step,
} from '@mentisix/sim';
import {
  AGENT_ACTION_TOKENS,
  type AgentResponse,
  tokenToAction,
} from '../../harness/action.schema.js';
import { SYSTEM_PROMPT, serializeObservation } from '../../harness/prompts.js';

export const TREASURE_HUNT_MANIFEST: ChallengeManifest = {
  id: 'treasure-hunt',
  label: 'Treasure Hunt',
  tagline: 'Spatial reasoning in fog-of-war grids.',
  description:
    'Drop an agent into a procedurally generated grid world with treasures, keys, and doors. The agent sees a 3x3 window and must plan, navigate, and recover from mistakes within a step budget.',
  difficulties: [
    {
      id: 'easy',
      label: 'Easy',
      description: '10x10 grid, 1 treasure, no doors, 5x5 vision.',
      maxSteps: CONFIG_BY_DIFFICULTY.easy.maxSteps,
    },
    {
      id: 'medium',
      label: 'Medium',
      description: '12x12 grid, 3 treasures, 2 keys, 3x3 vision.',
      maxSteps: CONFIG_BY_DIFFICULTY.medium.maxSteps,
    },
    {
      id: 'hard',
      label: 'Hard',
      description: '16x16 grid, 5 treasures, 4 keys, 3x3 vision.',
      maxSteps: CONFIG_BY_DIFFICULTY.hard.maxSteps,
    },
  ],
};

/**
 * Treasure Hunt as a Challenge. Wraps the existing pure sim functions
 * (`createWorld`, `observe`, `step`, `score`) so the harness can drive
 * the loop generically. The action type is the validated `AgentResponse`
 * coming back from the provider; the Challenge converts the flat token
 * to the structured sim Action via `tokenToAction`.
 */
export const treasureHuntChallenge: Challenge<WorldState, AgentResponse, Observation> = {
  id: 'treasure-hunt',
  manifest: TREASURE_HUNT_MANIFEST,

  systemPrompt(_difficulty: Difficulty): string {
    return SYSTEM_PROMPT;
  },

  init(seed: number, difficulty: Difficulty): WorldState {
    return createWorld(seed, CONFIG_BY_DIFFICULTY[difficulty]);
  },

  observe(state: WorldState): Observation {
    return observe(state);
  },

  serializeObservation(observation: Observation): string {
    return serializeObservation(observation);
  },

  step(state: WorldState, action: AgentResponse): WorldState {
    return step(state, tokenToAction(action.action));
  },

  isTerminal(state: WorldState): boolean {
    return state.status !== 'running';
  },

  status(state: WorldState): ChallengeStatus {
    if (state.status === 'won') return 'won';
    if (state.status === 'lost') return 'lost';
    return 'running';
  },

  score(state: WorldState): ChallengeScore {
    const b = score(state);
    return {
      won: b.won,
      score: b.score,
      stepsUsed: b.stepsUsed,
      maxSteps: b.maxSteps,
    };
  },

  stepsUsed(state: WorldState): number {
    return state.step;
  },

  maxSteps(state: WorldState): number {
    return state.config.maxSteps;
  },
};

/** Exposed so the Agent action vocabulary is queryable for docs. */
export { AGENT_ACTION_TOKENS };
