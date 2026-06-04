import { inBounds } from './geometry.js';
import type { Observation, ObservedCell, WorldState } from './types.js';
import { cellAt } from './world.js';

const ACTION_VOCABULARY = [
  'move_north',
  'move_south',
  'move_east',
  'move_west',
  'pick_up',
  'use_key:red:north',
  'use_key:red:south',
  'use_key:red:east',
  'use_key:red:west',
  'use_key:blue:north',
  'use_key:blue:south',
  'use_key:blue:east',
  'use_key:blue:west',
  'wait',
] as const;

/**
 * Build the agent's observation for the current world state. The visible
 * window is a (2r+1) x (2r+1) grid centered on the agent, where r is
 * `visionRadius`. Out-of-bounds cells become walls; cells the agent cannot
 * see become fog.
 */
export function observe(world: WorldState): Observation {
  const radius = world.config.visionRadius;
  if (radius < 0 || radius % 2 === 0) {
    throw new Error(`observe: visionRadius must be odd, got ${radius}`);
  }
  const half = (radius - 1) / 2;
  const [ar, ac] = world.agent;

  const visible: ObservedCell[][] = [];
  for (let dr = -half; dr <= half; dr++) {
    const row: ObservedCell[] = [];
    for (let dc = -half; dc <= half; dc++) {
      const r = ar + dr;
      const c = ac + dc;
      if (!inBounds([r, c], world.config.width, world.config.height)) {
        row.push({ kind: 'wall' });
      } else {
        const cell = cellAt(world, [r, c]);
        row.push(cell ?? { kind: 'fog' });
      }
    }
    visible.push(row);
  }

  const treasuresTotal = world.config.treasures;
  const treasuresRemaining = Math.max(0, treasuresTotal - world.treasuresCollected);

  return {
    step: world.step,
    maxSteps: world.config.maxSteps,
    position: world.agent,
    visible,
    inventory: world.inventory,
    treasuresCollected: world.treasuresCollected,
    treasuresRemaining,
    treasuresTotal,
    recentActions: world.history.map((h) => ({ action: h.action, outcome: h.outcome })),
    availableActions: ACTION_VOCABULARY,
    status: world.status,
  };
}
