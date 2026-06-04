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

export const SIM_VERSION = '0.1.0';
export const SUPPORTED_CHALLENGES = ['treasure-hunt'] as const;
