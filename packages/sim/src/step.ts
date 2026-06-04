import { inBounds, step as stepDir } from './geometry.js';
import type {
  Action,
  ActionOutcome,
  ActionResult,
  Cell,
  KeyColor,
  Position,
  WorldState,
} from './types.js';
import { cellAt, isTerminal, setCell } from './world.js';

const HISTORY_CAP = 10;

/**
 * Apply an action to the world. Returns the next state with a structured
 * result appended to history. Pure: never mutates the input.
 */
export function step(world: WorldState, action: Action): WorldState {
  if (isTerminal(world)) return world;

  const stepIdx = world.step + 1;
  const from = world.agent;

  let outcome: ActionOutcome = 'invalid';
  let to: Position = from;
  let nextGrid: readonly (readonly Cell[])[] = world.grid;
  let nextInventory: readonly KeyColor[] = world.inventory;
  let nextTreasuresCollected = world.treasuresCollected;

  if (action.kind === 'move') {
    const target = stepDir(from, action.direction);
    if (!inBounds(target, world.config.width, world.config.height)) {
      outcome = 'blocked_edge';
    } else {
      const targetCell = cellAt(world, target);
      if (!targetCell) {
        outcome = 'blocked_edge';
      } else if (targetCell.kind === 'wall') {
        outcome = 'blocked_wall';
      } else if (targetCell.kind === 'door' && !targetCell.open) {
        outcome = 'blocked_door';
      } else {
        outcome = 'ok';
        to = target;
      }
    }
  } else if (action.kind === 'pick_up') {
    const here = cellAt(world, from);
    if (!here) {
      outcome = 'invalid';
    } else if (here.kind === 'key') {
      outcome = 'pickup_key';
      nextInventory = [...world.inventory, here.color];
      nextGrid = setCell(world.grid, from, { kind: 'floor' });
    } else if (here.kind === 'treasure') {
      outcome = 'pickup_treasure';
      nextTreasuresCollected = world.treasuresCollected + 1;
      nextGrid = setCell(world.grid, from, { kind: 'floor' });
    } else {
      outcome = 'nothing_to_pick_up';
    }
  } else if (action.kind === 'use_key') {
    const adj = stepDir(from, action.direction);
    const adjCell = cellAt(world, adj);
    if (!adjCell || adjCell.kind !== 'door' || adjCell.open) {
      outcome = 'no_matching_door';
    } else if (!world.inventory.includes(action.color) || adjCell.color !== action.color) {
      outcome = adjCell.color !== action.color ? 'no_matching_door' : 'no_matching_key';
    } else {
      outcome = 'opened_door';
      nextGrid = setCell(world.grid, adj, { kind: 'door', color: adjCell.color, open: true });
    }
  } else if (action.kind === 'wait') {
    outcome = 'waited';
  }

  const required = world.config.treasures;
  const won = nextTreasuresCollected >= required;
  const lost = !won && stepIdx >= world.config.maxSteps;
  const status = won ? 'won' : lost ? 'lost' : 'running';

  const result: ActionResult = { step: stepIdx, action, outcome, from, to };
  const history = [...world.history, result].slice(-HISTORY_CAP);

  return {
    ...world,
    grid: nextGrid,
    agent: to,
    inventory: nextInventory,
    treasuresCollected: nextTreasuresCollected,
    step: stepIdx,
    status,
    history,
  };
}
