import type { Challenge, ChallengeId, ChallengeManifest } from '@mentisix/sim';
import { memoryProbeChallenge } from './memory-probe/index.js';
import { treasureHuntChallenge } from './treasure-hunt/index.js';

/**
 * The set of challenges Mentisix supports. Adding a new challenge means:
 *
 * 1. Define a `Challenge<S, A, O>` implementation under
 *    `apps/api/src/challenges/<id>/`.
 * 2. Register it here.
 * 3. Add the slug to `ChallengeId` in `@mentisix/sim/src/challenge.ts`.
 * 4. Add the slug to `CHALLENGES` + `ChallengeSlug` in `@mentisix/types`.
 *
 * That's it. The harness, dataset, leaderboard, and dojo all pick it up
 * automatically.
 */
// biome-ignore lint/suspicious/noExplicitAny: registry erases the generic params on purpose
type AnyChallenge = Challenge<any, any, any>;

// Partial because the registry is grown one PR at a time. Adding a slug
// to `ChallengeId` does not require a same-PR implementation.
export const CHALLENGE_REGISTRY: Partial<Record<ChallengeId, AnyChallenge>> = {
  'treasure-hunt': treasureHuntChallenge,
  'memory-probe': memoryProbeChallenge,
};

export function getChallenge(id: ChallengeId): AnyChallenge {
  const challenge = CHALLENGE_REGISTRY[id];
  if (!challenge) throw new Error(`unknown challenge: ${id}`);
  return challenge;
}

export function challengeManifests(): ChallengeManifest[] {
  return (Object.values(CHALLENGE_REGISTRY) as AnyChallenge[]).map((c) => c.manifest);
}
