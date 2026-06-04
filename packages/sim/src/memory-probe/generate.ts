/**
 * Procedural Memory Probe generator.
 *
 * Deterministic from a seed. Picks N facts, schedules them in early
 * turns, schedules matching questions later, fills the gaps with
 * thematic distractors.
 */

import { type Rng, makeRng } from '../rng.js';
import type { Difficulty } from '../types.js';
import { type Fact, PROBE_CONFIG_BY_DIFFICULTY, type ProbeState, type ProbeTurn } from './types.js';

const KEY_TEMPLATES: readonly { key: string; values: readonly string[] }[] = [
  {
    key: 'access code',
    values: [
      'lattice7',
      'mira-89',
      'oblique-3',
      'fog-1101',
      'vector-23',
      'sigil-44',
      'echo-72',
      'umbra-9',
      'cobalt-15',
      'parity-6',
    ],
  },
  {
    key: 'lab assignment',
    values: ['B-14', 'C-09', 'D-22', 'E-31', 'F-07', 'G-18', 'H-26', 'J-03', 'K-12', 'L-44'],
  },
  {
    key: 'project codename',
    values: [
      'Halftide',
      'Bonework',
      'Penwise',
      'Sundial',
      'Glasshouse',
      'Marbletop',
      'Lighthouse',
      'Driftwood',
      'Forelock',
      'Quartermast',
    ],
  },
  {
    key: 'meeting room',
    values: ['Atrium', 'Annex 4B', 'Quiet Floor', 'Bay 12', 'Glass Room', 'Pit 3', 'Tower B'],
  },
  {
    key: 'review window',
    values: ['Tuesday 14:30', 'Thursday 09:00', 'Monday 16:45', 'Friday 11:15'],
  },
  {
    key: 'budget tier',
    values: ['T-2', 'T-4', 'T-7', 'Q-3', 'Q-5', 'R-1', 'R-8'],
  },
  {
    key: 'incident reference',
    values: ['INC-2014', 'INC-4471', 'INC-6603', 'INC-7188', 'INC-8025'],
  },
];

const DISTRACTOR_LINES: readonly string[] = [
  'Routine telemetry ping. All subsystems nominal.',
  'Weather note: barometric pressure stable, no advisories.',
  'Calendar sync complete. No new entries.',
  'Inventory audit confirmed: 14 units, all accounted for.',
  'Network throughput unchanged from last sample.',
  'Scheduler heartbeat received from node 03.',
  'Archive job completed: 1.4 GB compressed.',
  'Cooling system reports 21.4 C ambient.',
  'Index rebuild finished in 412 ms.',
  'Standby relay confirmed online.',
  'Battery charge at 87 percent.',
  'Watchdog reset deferred; conditions nominal.',
  'No deltas in the access control list this cycle.',
  'Sensor mesh reports clean signal across all channels.',
  'Manifest reconciliation passed without exceptions.',
  'Daily summary archive sealed. Hash recorded.',
  'Background reindex pass complete.',
  'No pending operator actions.',
  'Telemetry buffer flushed.',
  'Subsystem audit returned no anomalies.',
];

export function createProbe(seed: number, difficulty: Difficulty): ProbeState {
  const rng = makeRng(seed);
  const config = PROBE_CONFIG_BY_DIFFICULTY[difficulty];

  // Pick distinct keys, then a value for each.
  const templates = rng.shuffle(KEY_TEMPLATES).slice(0, config.facts);
  const facts: Fact[] = templates.map((t) => ({ key: t.key, value: rng.pick(t.values) }));

  const schedule: (ProbeTurn | undefined)[] = new Array(config.turns).fill(undefined);

  // 'tell' slots in the first ~40% of turns, spaced.
  const tellWindowEnd = Math.max(2, Math.floor(config.turns * 0.4));
  const tellSlots = chooseSlots(rng, 1, tellWindowEnd, facts.length);
  for (let i = 0; i < facts.length; i++) {
    const slot = tellSlots[i];
    const fact = facts[i];
    if (slot !== undefined && fact !== undefined) {
      schedule[slot] = { kind: 'tell', fact };
    }
  }

  // 'ask' slots in the back ~45%, ordering shuffled so the agent can't
  // simply mirror the tell sequence.
  const askWindowStart = Math.floor(config.turns * 0.55);
  const askSlots = chooseSlots(rng, askWindowStart, config.turns - 1, facts.length);
  const askOrder = rng.shuffle(facts.map((_, i) => i));
  for (let i = 0; i < askSlots.length; i++) {
    const slot = askSlots[i];
    const factIndex = askOrder[i];
    if (slot === undefined || factIndex === undefined) continue;
    const fact = facts[factIndex];
    if (!fact) continue;
    schedule[slot] = { kind: 'ask', key: fact.key, expected: fact.value };
  }

  // Fill remaining slots with deterministic distractor lines.
  for (let t = 0; t < config.turns; t++) {
    if (schedule[t]) continue;
    schedule[t] = { kind: 'distractor', content: rng.pick(DISTRACTOR_LINES) };
  }

  return {
    seed,
    difficulty,
    config,
    schedule: schedule.filter((s): s is ProbeTurn => s !== undefined),
    turn: 0,
    maxTurns: config.turns,
    answers: [],
    status: 'running',
  };
}

function chooseSlots(rng: Rng, start: number, end: number, n: number): number[] {
  const range = Math.max(1, end - start + 1);
  if (n >= range) return Array.from({ length: n }, (_, i) => Math.min(end, start + i));
  const spacing = Math.max(1, Math.floor(range / (n + 1)));
  const slots: number[] = [];
  let cursor = start + rng.int(spacing);
  for (let i = 0; i < n; i++) {
    slots.push(Math.min(end, cursor));
    cursor += spacing + rng.int(spacing);
  }
  return slots;
}
