import {
  type Challenge,
  type ChallengeManifest,
  type ChallengeScore,
  type ChallengeStatus,
  type Difficulty,
  PROBE_CONFIG_BY_DIFFICULTY,
  type ProbeObservation,
  type ProbeState,
  createProbe,
  observeProbe,
  scoreProbe,
  stepProbe,
} from '@mentisix/sim';
import { SYSTEM_PROMPT, serializeObservation } from './prompts.js';
import type { MemoryProbeResponse } from './schema.js';

export const MEMORY_PROBE_MANIFEST: ChallengeManifest = {
  id: 'memory-probe',
  label: 'Memory Probe',
  tagline: 'In-context recall under distractor noise.',
  description:
    'The agent is told facts early in the run, then asked to recall them after a stretch of unrelated turns. Tests focused memory and resistance to plausible-sounding distractors.',
  difficulties: [
    {
      id: 'easy',
      label: 'Easy',
      description: '1 fact, 1 question, 20 turns total.',
      maxSteps: PROBE_CONFIG_BY_DIFFICULTY.easy.turns,
    },
    {
      id: 'medium',
      label: 'Medium',
      description: '2 facts, 2 questions, 40 turns total.',
      maxSteps: PROBE_CONFIG_BY_DIFFICULTY.medium.turns,
    },
    {
      id: 'hard',
      label: 'Hard',
      description: '3 facts, 3 questions, 80 turns total.',
      maxSteps: PROBE_CONFIG_BY_DIFFICULTY.hard.turns,
    },
  ],
};

export const memoryProbeChallenge: Challenge<ProbeState, MemoryProbeResponse, ProbeObservation> = {
  id: 'memory-probe',
  manifest: MEMORY_PROBE_MANIFEST,

  systemPrompt(_difficulty: Difficulty): string {
    return SYSTEM_PROMPT;
  },

  init(seed: number, difficulty: Difficulty): ProbeState {
    return createProbe(seed, difficulty);
  },

  observe(state: ProbeState): ProbeObservation {
    return observeProbe(state);
  },

  serializeObservation(observation: ProbeObservation): string {
    return serializeObservation(observation);
  },

  step(state: ProbeState, action: MemoryProbeResponse): ProbeState {
    return stepProbe(state, { reasoning: action.reasoning, answer: action.answer });
  },

  isTerminal(state: ProbeState): boolean {
    return state.status !== 'running';
  },

  status(state: ProbeState): ChallengeStatus {
    return state.status;
  },

  score(state: ProbeState): ChallengeScore {
    const b = scoreProbe(state);
    return {
      won: b.won,
      score: b.score,
      stepsUsed: b.stepsUsed,
      maxSteps: b.maxSteps,
    };
  },

  stepsUsed(state: ProbeState): number {
    return state.turn;
  },

  maxSteps(state: ProbeState): number {
    return state.maxTurns;
  },
};
