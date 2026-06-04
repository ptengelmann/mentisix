/**
 * Mentisix sim — core types for the Treasure Hunt grid world.
 *
 * Everything here is data only. Pure functions in sibling modules
 * (`step.ts`, `observe.ts`, `procgen/`) consume and return these shapes.
 */

export type KeyColor = 'red' | 'blue';
export const KEY_COLORS: readonly KeyColor[] = ['red', 'blue'];

export type Position = readonly [number, number];

export type Direction = 'north' | 'south' | 'east' | 'west';
export const DIRECTIONS: readonly Direction[] = ['north', 'south', 'east', 'west'];

export type Cell =
  | { readonly kind: 'floor' }
  | { readonly kind: 'wall' }
  | { readonly kind: 'door'; readonly color: KeyColor; readonly open: boolean }
  | { readonly kind: 'key'; readonly color: KeyColor }
  | { readonly kind: 'treasure' };

export type Action =
  | { readonly kind: 'move'; readonly direction: Direction }
  | { readonly kind: 'pick_up' }
  | { readonly kind: 'use_key'; readonly direction: Direction; readonly color: KeyColor }
  | { readonly kind: 'wait' };

export type ActionOutcome =
  | 'ok'
  | 'blocked_wall'
  | 'blocked_door'
  | 'blocked_edge'
  | 'invalid'
  | 'pickup_key'
  | 'pickup_treasure'
  | 'nothing_to_pick_up'
  | 'opened_door'
  | 'no_matching_door'
  | 'no_matching_key'
  | 'waited';

export type ActionResult = {
  readonly step: number;
  readonly action: Action;
  readonly outcome: ActionOutcome;
  readonly from: Position;
  readonly to: Position;
};

export type WorldStatus = 'running' | 'won' | 'lost';

export type WorldConfig = {
  readonly width: number;
  readonly height: number;
  readonly maxSteps: number;
  readonly treasures: number;
  readonly keys: number;
  /** 3 = 3x3 reveal (default), 5 = 5x5, etc. Must be odd. */
  readonly visionRadius: number;
};

export const DEFAULT_CONFIG: WorldConfig = {
  width: 12,
  height: 12,
  maxSteps: 200,
  treasures: 3,
  keys: 2,
  visionRadius: 3,
};

/**
 * Treasure Hunt difficulty tiers. Each is a frozen WorldConfig so the
 * mapping `tier → config → seed → world` stays deterministic forever.
 *
 * - Easy: 10×10 grid, 1 treasure, no doors/keys, 5×5 vision (more info,
 *   simpler topology). Designed to be solvable by a competent agent in
 *   under 80 steps.
 * - Medium: the original 12×12 / 3 treasures / 2 keys / 3×3 vision setup.
 *   What the v0 dataset was built on.
 * - Hard: 16×16 grid, 5 treasures, 4 keys (so each key may unlock multiple
 *   doors of a color), 3×3 vision, 300 step budget. Spatial reasoning at
 *   scale, longer planning horizons.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export const CONFIG_BY_DIFFICULTY: Record<Difficulty, WorldConfig> = {
  easy: {
    width: 10,
    height: 10,
    maxSteps: 150,
    treasures: 1,
    keys: 0,
    visionRadius: 5,
  },
  medium: {
    width: 12,
    height: 12,
    maxSteps: 200,
    treasures: 3,
    keys: 2,
    visionRadius: 3,
  },
  hard: {
    width: 16,
    height: 16,
    maxSteps: 300,
    treasures: 5,
    keys: 4,
    visionRadius: 3,
  },
};

export type WorldState = {
  readonly seed: number;
  readonly config: WorldConfig;
  readonly grid: readonly (readonly Cell[])[];
  readonly agent: Position;
  readonly inventory: readonly KeyColor[];
  readonly treasuresCollected: number;
  readonly step: number;
  readonly status: WorldStatus;
  readonly history: readonly ActionResult[];
};

export type FogCell = { readonly kind: 'fog' };

export type ObservedCell = Cell | FogCell;

export type Observation = {
  readonly step: number;
  readonly maxSteps: number;
  readonly position: Position;
  /** Row-major. Length = visionRadius. Each row length = visionRadius. */
  readonly visible: readonly (readonly ObservedCell[])[];
  readonly inventory: readonly KeyColor[];
  readonly treasuresCollected: number;
  readonly treasuresRemaining: number;
  readonly treasuresTotal: number;
  readonly recentActions: readonly { readonly action: Action; readonly outcome: ActionOutcome }[];
  readonly availableActions: readonly string[];
  readonly status: WorldStatus;
};
