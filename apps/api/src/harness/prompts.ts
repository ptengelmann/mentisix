import type { Cell, Observation, ObservedCell } from '@mentisix/sim';
import { AGENT_ACTION_TOKENS } from './action.schema.js';

export const SYSTEM_PROMPT = `You are an agent navigating a 12x12 grid called Treasure Hunt.

OBJECTIVE
Collect all 3 treasures before the step budget runs out.

WORLD
- The grid contains floors, walls, treasures, colored keys (red, blue), and locked colored doors.
- You see a 3x3 window centered on yourself. Cells outside the grid show as walls.
- Walls block movement. Closed doors block movement until opened with the matching key.

ACTIONS (pick exactly one per turn)
- move_{north,south,east,west}: step in that direction
- pick_up: collect the item at your current cell (key or treasure)
- use_{red,blue}_key_{north,south,east,west}: open the door adjacent in that direction (only works with that color key in inventory)
- wait: do nothing this turn

GLYPHS in the visible window
- A: you
- .: floor
- W: wall
- K, k: red key / blue key
- D, d: closed red door / closed blue door
- T: treasure

OUTPUT
Return JSON: { "reasoning": "...", "action": "<one of the 14 tokens>" }
Keep reasoning to one or two short sentences. Be decisive.`;

const CELL_GLYPH: Record<string, string> = {
  floor: '.',
  wall: 'W',
  treasure: 'T',
  fog: '?',
};

function glyphFor(cell: ObservedCell, isAgent: boolean): string {
  if (isAgent) return 'A';
  if (cell.kind === 'key') return cell.color === 'red' ? 'K' : 'k';
  if (cell.kind === 'door') {
    if (cell.open) return '.';
    return cell.color === 'red' ? 'D' : 'd';
  }
  return CELL_GLYPH[cell.kind] ?? '?';
}

/**
 * Render the agent's observation as a compact textual brief the LLM can
 * reason from. ASCII grid + structured stats + recent history.
 */
export function serializeObservation(obs: Observation): string {
  const radius = obs.visible.length;
  const center = (radius - 1) / 2;

  const rows: string[] = [];
  for (let r = 0; r < radius; r++) {
    const row = obs.visible[r];
    if (!row) continue;
    const cells: string[] = [];
    for (let c = 0; c < radius; c++) {
      const cell = row[c];
      if (!cell) continue;
      const isAgent = r === center && c === center;
      cells.push(glyphFor(cell, isAgent));
    }
    rows.push(cells.join(' '));
  }

  const recent =
    obs.recentActions.length === 0
      ? '  (none yet)'
      : obs.recentActions
          .map(
            (h, i) =>
              `  ${obs.recentActions.length - i - 1} turns ago: ${describeAction(h.action)} -> ${h.outcome}`,
          )
          .join('\n');

  const inv =
    obs.inventory.length === 0 ? '(empty)' : obs.inventory.map((k) => `${k}_key`).join(', ');

  return [
    `STEP ${obs.step}/${obs.maxSteps}`,
    `POSITION (row=${obs.position[0]}, col=${obs.position[1]})`,
    `TREASURES collected ${obs.treasuresCollected}/${obs.treasuresTotal}`,
    `INVENTORY ${inv}`,
    '',
    'VISIBLE WINDOW (3x3 centered on you, north is up):',
    ...rows.map((r) => `  ${r}`),
    '',
    'RECENT ACTIONS:',
    recent,
    '',
    `Choose one action from: ${AGENT_ACTION_TOKENS.join(', ')}`,
  ].join('\n');
}

function describeAction(action: Observation['recentActions'][number]['action']): string {
  if (action.kind === 'move') return `move_${action.direction}`;
  if (action.kind === 'pick_up') return 'pick_up';
  if (action.kind === 'use_key') return `use_${action.color}_key_${action.direction}`;
  return 'wait';
}

/**
 * Build a full-grid debug rendering. Used in logs and tests, not sent to
 * the model (the model only sees what `serializeObservation` returns).
 */
export function debugRenderWorld(
  grid: readonly (readonly Cell[])[],
  agent: readonly [number, number],
): string {
  return grid
    .map((row, r) =>
      row
        .map((cell, c) => {
          if (r === agent[0] && c === agent[1]) return 'A';
          if (cell.kind === 'wall') return 'W';
          if (cell.kind === 'treasure') return 'T';
          if (cell.kind === 'key') return cell.color === 'red' ? 'K' : 'k';
          if (cell.kind === 'door') {
            if (cell.open) return '.';
            return cell.color === 'red' ? 'D' : 'd';
          }
          return '.';
        })
        .join(' '),
    )
    .join('\n');
}
