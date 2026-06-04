import { describe, expect, it } from 'vitest';
import { makeRng } from '../src/rng.js';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('diverges across seeds', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    let same = 0;
    for (let i = 0; i < 100; i++) {
      if (a.next() === b.next()) same++;
    }
    // mulberry32 is good; exact collisions on doubles should be 0
    expect(same).toBe(0);
  });

  it('produces uniformly distributed doubles in [0, 1)', () => {
    const rng = makeRng(7);
    const N = 10_000;
    let sum = 0;
    let min = 1;
    let max = 0;
    for (let i = 0; i < N; i++) {
      const x = rng.next();
      sum += x;
      if (x < min) min = x;
      if (x > max) max = x;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(sum / N).toBeGreaterThan(0.48);
    expect(sum / N).toBeLessThan(0.52);
    expect(min).toBeLessThan(0.01);
    expect(max).toBeGreaterThan(0.99);
  });

  it('int(n) returns values in [0, n)', () => {
    const rng = makeRng(1234);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(10);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick returns an element of the input array', () => {
    const rng = makeRng(99);
    const items = ['a', 'b', 'c', 'd', 'e'];
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it('shuffle returns a permutation, not a mutation', () => {
    const rng = makeRng(2024);
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = rng.shuffle(original);
    expect(shuffled).not.toBe(original);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
  });
});
