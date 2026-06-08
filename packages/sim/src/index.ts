export type {
  Action,
  ActionOutcome,
  ActionResult,
  Cell,
  Difficulty,
  Direction,
  FogCell,
  KeyColor,
  ObservedCell,
  Observation,
  Position,
  WorldConfig,
  WorldState,
  WorldStatus,
} from './types.js';
export {
  CONFIG_BY_DIFFICULTY,
  DEFAULT_CONFIG,
  DIFFICULTIES,
  DIRECTIONS,
  KEY_COLORS,
} from './types.js';

export { makeRng, type Rng } from './rng.js';
export { manhattan, inBounds, step as stepDirection } from './geometry.js';
export { cellAt, isTerminal, totalTreasures } from './world.js';

export { step } from './step.js';
export { observe } from './observation.js';
export { score, type ScoreBreakdown } from './score.js';

export { createWorld, type CreateWorldOptions } from './procgen/index.js';
export { isSolvable } from './procgen/solver.js';
export { distanceMap, generateLayout } from './procgen/layout.js';

export type {
  Challenge,
  ChallengeId,
  ChallengeManifest,
  ChallengeScore,
  ChallengeStatus,
  DifficultyManifest,
} from './challenge.js';

export {
  PROBE_CONFIG_BY_DIFFICULTY,
  createProbe,
  observeProbe,
  scoreProbe,
  stepProbe,
  type Answer as ProbeAnswer,
  type Fact as ProbeFact,
  type ProbeAction,
  type ProbeConfig,
  type ProbeObservation,
  type ProbeScoreBreakdown,
  type ProbeState,
  type ProbeStatus,
  type ProbeTurn,
  type TurnKind,
} from './memory-probe/index.js';

export const SIM_VERSION = '0.2.0';
export const SUPPORTED_CHALLENGES = ['treasure-hunt', 'memory-probe'] as const;
