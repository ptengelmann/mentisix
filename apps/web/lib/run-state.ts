import type {
  Action,
  Cell,
  KeyColor,
  Observation,
  Position,
  ProbeObservation,
  ScoreBreakdown,
  TurnKind,
  WorldStatus,
} from '@mentisix/sim';
import type { RunEvent, RunStatus, WorldSnapshot } from '@mentisix/types';

export type ViewerStatus = 'idle' | 'starting' | 'live' | 'done' | 'error';

export type ReasoningEntry = {
  step: number;
  text: string;
  tokensUsed: number;
  msUsed: number;
  /** Turn kind for memory-probe runs; absent for treasure-hunt. */
  turnKind?: TurnKind;
};

export type MpFact = {
  key: string;
  value: string;
  /** Turn index when this fact was first revealed via a tell. */
  tellTurn: number;
};

export type MpAnswer = {
  turn: number;
  key: string;
  given: string;
  expected?: string;
  correct?: boolean;
};

export type MpState = {
  schedule: readonly TurnKind[];
  /** Total facts the seed will reveal across the run. */
  factsExpected: number;
  /** Turns expected from mp_hello; used as the strip's denominator. */
  maxTurns: number;
  /** Current playhead in turn space. */
  currentTurn: number;
  /** Tells revealed so far. Order = reveal order. */
  facts: MpFact[];
  /** Ask resolutions so far, including correctness. */
  answers: MpAnswer[];
  /** Key being asked at the current turn, between observation and mp_action. */
  pendingAskKey: string | null;
  /** Cumulative counters from the last mp_state event. */
  factsRevealed: number;
  answersGiven: number;
  answersCorrect: number;
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
  /** Memory Probe state. Null until mp_hello arrives. */
  mp: MpState | null;
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
  mp: null,
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
    if (state.mp) {
      const probe = e.observation as ProbeObservation;
      const current = probe.current;
      const mp = state.mp;
      let facts = mp.facts;
      let pendingAskKey: string | null = null;
      if (current.kind === 'tell') {
        const already = facts.some((f) => f.key === current.fact.key);
        if (!already) {
          facts = [
            ...facts,
            { key: current.fact.key, value: current.fact.value, tellTurn: probe.turn },
          ];
        }
      } else if (current.kind === 'ask') {
        pendingAskKey = current.key;
      }
      return {
        ...state,
        step: e.step,
        mp: { ...mp, currentTurn: probe.turn, facts, pendingAskKey },
      };
    }
    const obs = e.observation as Observation;
    return {
      ...state,
      step: e.step,
      treasuresTotal: obs.treasuresTotal ?? state.treasuresTotal,
    };
  }

  if (e.kind === 'thinking') {
    const turnKind = state.mp ? state.mp.schedule[state.mp.currentTurn] : undefined;
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
          ...(turnKind ? { turnKind } : {}),
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

  if (e.kind === 'mp_hello') {
    return {
      ...state,
      status: 'live',
      runId: e.runId,
      seed: e.seed,
      maxSteps: e.maxTurns,
      mp: {
        schedule: e.schedule,
        factsExpected: e.factCount,
        maxTurns: e.maxTurns,
        currentTurn: 0,
        facts: [],
        answers: [],
        pendingAskKey: null,
        factsRevealed: 0,
        answersGiven: 0,
        answersCorrect: 0,
      },
    };
  }

  if (e.kind === 'mp_action') {
    if (!state.mp) return state;
    // Only ask turns carry `expected` + `correct`. Tell/distractor turns
    // produce an answer field but it's ignored by the grader; we don't
    // surface it on the strip.
    if (e.expected === undefined) return state;
    const answer: MpAnswer = {
      turn: e.step,
      key: state.mp.pendingAskKey ?? '?',
      given: e.answer,
      expected: e.expected,
      correct: e.correct,
    };
    return {
      ...state,
      mp: {
        ...state.mp,
        answers: [...state.mp.answers, answer],
        pendingAskKey: null,
      },
    };
  }

  if (e.kind === 'mp_state') {
    if (!state.mp) return state;
    return {
      ...state,
      mp: {
        ...state.mp,
        currentTurn: e.turn,
        factsRevealed: e.factsRevealed,
        answersGiven: e.answersGiven,
        answersCorrect: e.answersCorrect,
      },
    };
  }

  return state;
}
