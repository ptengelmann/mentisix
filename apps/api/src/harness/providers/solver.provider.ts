import type { Cell, KeyColor, Observation, Position } from '@mentisix/sim';
import { Injectable } from '@nestjs/common';
import type { AgentActionToken } from '../action.schema.js';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

type SolverMemory = {
  /** "r,c" → cell we've directly observed. */
  knownCells: Map<string, Cell>;
};

const KEY_BIT: Record<KeyColor, number> = { red: 1, blue: 2 };

const DIRECTION_OFFSETS = {
  north: [-1, 0],
  south: [1, 0],
  east: [0, 1],
  west: [0, -1],
} as const;
type Dir = keyof typeof DIRECTION_OFFSETS;

/**
 * Reference player — BFS-driven Treasure Hunt solver.
 *
 * Sees only what real LLMs see (fog-limited observations). Builds an
 * internal map across turns, prioritises uncollected treasures, then keys,
 * then exploration of the unseen frontier. Uses keys to open doors when
 * the path requires it. Stateless tokens cost: zero.
 *
 * Memory keyed by runId; entries persist for the process lifetime. With
 * 12x12 cells per run this is a few KB even at hundreds of stale entries.
 */
@Injectable()
export class SolverProvider implements ModelProvider {
  readonly id = 'solver' as const;
  private readonly memory = new Map<string, SolverMemory>();

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const obs = input.observation;
    if (!obs) {
      return wait('solver: no structured observation');
    }
    const runKey = input.runId ?? '__default__';
    const mem = this.getMemory(runKey);
    this.absorbObservation(mem, obs);

    const decision = this.decide(mem, obs);
    return { response: decision, tokensUsed: 0 };
  }

  private getMemory(runId: string): SolverMemory {
    let mem = this.memory.get(runId);
    if (!mem) {
      mem = { knownCells: new Map() };
      this.memory.set(runId, mem);
    }
    return mem;
  }

  private absorbObservation(mem: SolverMemory, obs: Observation): void {
    const [ar, ac] = obs.position;
    const radius = obs.visible.length;
    const half = (radius - 1) / 2;
    for (let dr = -half; dr <= half; dr++) {
      for (let dc = -half; dc <= half; dc++) {
        const r = ar + dr;
        const c = ac + dc;
        if (r < 0 || c < 0) continue;
        const cell = obs.visible[dr + half]?.[dc + half];
        if (!cell || cell.kind === 'fog') continue;
        mem.knownCells.set(`${r},${c}`, cell);
      }
    }
  }

  private decide(mem: SolverMemory, obs: Observation): GenerateOutput['response'] {
    const here = mem.knownCells.get(`${obs.position[0]},${obs.position[1]}`);
    if (here?.kind === 'treasure' || here?.kind === 'key') {
      return {
        reasoning: `standing on ${here.kind}${'color' in here ? ` (${here.color})` : ''}; collect`,
        action: 'pick_up',
      };
    }

    const goals = this.findGoals(mem, obs);
    const inventoryBits = inventoryToBits(obs.inventory);

    for (const goal of goals) {
      const path = bfs(mem, obs.position, goal.pos, inventoryBits, goal.kind);
      if (!path || path.length < 2) continue;

      const next = path[1];
      if (!next) continue;

      const dir = directionFromTo(obs.position, next);
      if (!dir) continue;

      const nextCell = mem.knownCells.get(`${next[0]},${next[1]}`);
      if (nextCell?.kind === 'door' && !nextCell.open) {
        if ((inventoryBits & KEY_BIT[nextCell.color]) !== 0) {
          return {
            reasoning: `unlock ${nextCell.color} door to reach ${goal.kind}`,
            action: useKeyToken(nextCell.color, dir),
          };
        }
      }

      return {
        reasoning: `head ${dir} toward ${goal.kind}${goal.distance != null ? ` (~${goal.distance} steps)` : ''}`,
        action: moveToken(dir),
      };
    }

    return { reasoning: 'no reachable goal — wait', action: 'wait' };
  }

  /**
   * Goals in priority order: uncollected treasures, then keys whose color
   * isn't already in inventory, then the nearest unknown frontier cell
   * (target an unknown cell adjacent to a known-walkable cell — when the
   * agent steps onto it, the next observation reveals it).
   */
  private findGoals(
    mem: SolverMemory,
    obs: Observation,
  ): { pos: Position; kind: string; distance: number | null }[] {
    const goals: { pos: Position; kind: string; distance: number | null }[] = [];
    const inv = obs.inventory;

    for (const [k, cell] of mem.knownCells) {
      if (cell.kind !== 'treasure') continue;
      goals.push({ pos: parseKey(k), kind: 'treasure', distance: null });
    }
    for (const [k, cell] of mem.knownCells) {
      if (cell.kind !== 'key') continue;
      if (inv.includes(cell.color)) continue;
      goals.push({ pos: parseKey(k), kind: `${cell.color}-key`, distance: null });
    }

    const frontier = findFrontier(mem);
    for (const f of frontier) {
      goals.push({ pos: f, kind: 'unknown', distance: null });
    }

    return goals;
  }
}

function wait(reason: string): GenerateOutput {
  return {
    response: { reasoning: reason, action: 'wait' },
    tokensUsed: 0,
  };
}

function moveToken(dir: Dir): AgentActionToken {
  return `move_${dir}` as AgentActionToken;
}

function useKeyToken(color: KeyColor, dir: Dir): AgentActionToken {
  return `use_${color}_key_${dir}` as AgentActionToken;
}

function inventoryToBits(inv: readonly KeyColor[]): number {
  let bits = 0;
  for (const c of inv) bits |= KEY_BIT[c];
  return bits;
}

function parseKey(k: string): Position {
  const [r, c] = k.split(',').map(Number) as [number, number];
  return [r, c];
}

function directionFromTo(from: Position, to: Position): Dir | null {
  const dr = to[0] - from[0];
  const dc = to[1] - from[1];
  if (dr === -1 && dc === 0) return 'north';
  if (dr === 1 && dc === 0) return 'south';
  if (dr === 0 && dc === 1) return 'east';
  if (dr === 0 && dc === -1) return 'west';
  return null;
}

/**
 * BFS from `start` to `goal`. Passable cells: known floor, known open
 * door, known key, known treasure, known closed door whose color is in
 * `inventoryBits`. Unknown cells are passable only if the goal itself is
 * the 'unknown' kind — that way we walk into fog when exploring, but
 * never blindly route through it when chasing a known objective.
 */
function bfs(
  mem: SolverMemory,
  start: Position,
  goal: Position,
  inventoryBits: number,
  goalKind: string,
): Position[] | null {
  const goalKey = `${goal[0]},${goal[1]}`;
  const startKey = `${start[0]},${start[1]}`;
  if (startKey === goalKey) return [start];

  const exploringUnknown = goalKind === 'unknown';
  const parent = new Map<string, string>();
  const queue: Position[] = [start];
  const seen = new Set<string>([startKey]);

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    for (const dir of Object.keys(DIRECTION_OFFSETS) as Dir[]) {
      const [dr, dc] = DIRECTION_OFFSETS[dir];
      const next: Position = [cur[0] + dr, cur[1] + dc];
      const nk = `${next[0]},${next[1]}`;
      if (seen.has(nk)) continue;
      if (next[0] < 0 || next[1] < 0) continue;

      const cell = mem.knownCells.get(nk);

      if (!cell) {
        // unknown: only step in if this is our goal-cell or we're
        // exploring and this neighbour is precisely our goal
        if (!exploringUnknown) continue;
        if (nk !== goalKey) continue;
      } else if (!isPassable(cell, inventoryBits)) {
        continue;
      }

      seen.add(nk);
      parent.set(nk, `${cur[0]},${cur[1]}`);

      if (nk === goalKey) {
        return rebuild(parent, startKey, goalKey);
      }
      queue.push(next);
    }
  }
  return null;
}

function isPassable(cell: Cell, inventoryBits: number): boolean {
  if (cell.kind === 'wall') return false;
  if (cell.kind === 'door' && !cell.open) {
    return (inventoryBits & KEY_BIT[cell.color]) !== 0;
  }
  return true;
}

function rebuild(parent: Map<string, string>, startKey: string, goalKey: string): Position[] {
  const path: Position[] = [];
  let cur: string | undefined = goalKey;
  while (cur && cur !== startKey) {
    path.unshift(parseKey(cur));
    cur = parent.get(cur);
  }
  path.unshift(parseKey(startKey));
  return path;
}

function findFrontier(mem: SolverMemory): Position[] {
  const out: Position[] = [];
  const seen = new Set<string>();
  for (const [k, cell] of mem.knownCells) {
    if (cell.kind === 'wall') continue;
    const [r, c] = parseKey(k);
    for (const [dr, dc] of Object.values(DIRECTION_OFFSETS)) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0) continue;
      const nk = `${nr},${nc}`;
      if (mem.knownCells.has(nk)) continue;
      if (seen.has(nk)) continue;
      seen.add(nk);
      out.push([nr, nc]);
    }
  }
  return out;
}
