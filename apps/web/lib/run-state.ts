import type {
  Action,
  Cell,
  KeyColor,
  Observation,
  Position,
  ScoreBreakdown,
  WorldStatus,
} from '@mentisix/sim';
import type { RunEvent, RunStatus, WorldSnapshot } from '@mentisix/types';

export type ViewerStatus = 'idle' | 'starting' | 'live' | 'done' | 'error';

export type ReasoningEntry = {
  step: number;
  text: string;
  tokensUsed: number;
  msUsed: number;
};

export type RunUiState = {
  status: ViewerStatus;
  runId: string | null;
  seed: number | null;
  world: WorldSnapshot | null;
  grid: Cell[][] | null;
  agent: Position | null;
  inventory: readonly KeyColor[];
  treasuresCollected: number;
  treasuresTotal: number;
  step: number;
  maxSteps: number;
  tokensUsed: number;
  msUsed: number;
  reasonings: ReasoningEntry[];
  recentAction: Action | null;
  worldStatus: WorldStatus;
  terminalStatus: RunStatus | null;
  finalScore: ScoreBreakdown | null;
  error: string | null;
  /** Set of "r,c" cells the agent has ever observed (for fog of war). */
  seenCells: Set<string>;
};

export const initialState: RunUiState = {
  status: 'idle',
  runId: null,
  seed: null,
  world: null,
  grid: null,
  agent: null,
  inventory: [],
  treasuresCollected: 0,
  treasuresTotal: 0,
  step: 0,
  maxSteps: 200,
  tokensUsed: 0,
  msUsed: 0,
  reasonings: [],
  recentAction: null,
  worldStatus: 'running',
  terminalStatus: null,
  finalScore: null,
  error: null,
  seenCells: new Set(),
};

export type RunUiEvent =
  | { kind: 'reset' }
  | { kind: 'starting'; runId: string; seed: number }
  | { kind: 'sse'; event: RunEvent }
  | { kind: 'transport_error'; message: string };

function cloneGrid(grid: readonly (readonly Cell[])[]): Cell[][] {
  return grid.map((row) => row.slice() as Cell[]);
}

function markSeen(set: Set<string>, agent: Position, radius: number): Set<string> {
  const half = (radius - 1) / 2;
  const next = new Set(set);
  for (let dr = -half; dr <= half; dr++) {
    for (let dc = -half; dc <= half; dc++) {
      next.add(`${agent[0] + dr},${agent[1] + dc}`);
    }
  }
  return next;
}

export function reducer(state: RunUiState, evt: RunUiEvent): RunUiState {
  if (evt.kind === 'reset') return initialState;

  if (evt.kind === 'starting') {
    return {
      ...initialState,
      status: 'starting',
      runId: evt.runId,
      seed: evt.seed,
    };
  }

  if (evt.kind === 'transport_error') {
    return { ...state, status: 'error', error: evt.message };
  }

  const e = evt.event;

  if (e.kind === 'hello') {
    return {
      ...state,
      status: 'live',
      runId: e.runId,
      seed: e.seed,
      world: e.initialWorld,
      grid: cloneGrid(e.initialWorld.grid),
      agent: e.initialWorld.agent,
      maxSteps: e.initialWorld.maxSteps,
      seenCells: markSeen(new Set(), e.initialWorld.agent, e.initialWorld.visionRadius),
    };
  }

  if (e.kind === 'observation') {
    const obs = e.observation as Observation;
    return {
      ...state,
      step: e.step,
      treasuresTotal: obs.treasuresTotal ?? state.treasuresTotal,
    };
  }

  if (e.kind === 'thinking') {
    return {
      ...state,
      tokensUsed: state.tokensUsed + e.tokensUsed,
      reasonings: [
        ...state.reasonings,
        {
          step: e.step,
          text: e.reasoning ?? '',
          tokensUsed: e.tokensUsed,
          msUsed: e.msUsed,
        },
      ].slice(-200),
    };
  }

  if (e.kind === 'action') {
    return { ...state, recentAction: e.action };
  }

  if (e.kind === 'state') {
    const radius = state.world?.visionRadius ?? 3;
    const nextSeen = markSeen(state.seenCells, e.agent, radius);
    return {
      ...state,
      agent: e.agent,
      inventory: e.inventory,
      treasuresCollected: e.treasuresCollected,
      worldStatus: e.status,
      seenCells: nextSeen,
    };
  }

  if (e.kind === 'done') {
    return {
      ...state,
      status: 'done',
      terminalStatus: e.status,
      finalScore: e.score as ScoreBreakdown | null,
      tokensUsed: e.tokensUsed,
      msUsed: e.msUsed,
    };
  }

  if (e.kind === 'error') {
    return { ...state, status: 'error', error: e.message };
  }

  return state;
}
