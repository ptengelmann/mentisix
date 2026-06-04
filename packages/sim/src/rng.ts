/**
 * Deterministic seeded RNG. mulberry32.
 *
 * Cheap, fast, good distribution for game purposes. Two runs with the same
 * seed produce identical streams. Returned function yields uniform doubles
 * in [0, 1).
 */
export type Rng = {
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
};

export function makeRng(seed: number): Rng {
  let s = seed >>> 0;

  function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(maxExclusive: number): number {
    if (maxExclusive <= 0) throw new Error(`rng.int: invalid bound ${maxExclusive}`);
    return Math.floor(next() * maxExclusive);
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('rng.pick: empty array');
    const item = items[int(items.length)];
    if (item === undefined) throw new Error('rng.pick: undefined item');
    return item;
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }

  return { next, int, pick, shuffle };
}
