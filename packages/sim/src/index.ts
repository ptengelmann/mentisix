/**
 * @mentisix/sim — grid-world cognition engine.
 *
 * v0 scope (next PR): "Treasure Hunt" — 12x12 grid, fog of war, 3 treasures
 * behind locked doors, 2 keys, procedural seeds. Pure TypeScript: no I/O,
 * no DOM, no network. Consumed by apps/api for run execution and by
 * apps/web for client-side replay rendering.
 */

import type { ChallengeSlug } from '@mentisix/types';

export const SUPPORTED_CHALLENGES: readonly ChallengeSlug[] = ['treasure-hunt'] as const;

export const SIM_VERSION = '0.0.0';
