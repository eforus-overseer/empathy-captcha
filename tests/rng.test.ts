import { describe, expect, it } from 'vitest';
import { mulberry32, parseSeed } from '../src/engine/rng';

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
    for (const v of seqA) expect(v).toBeGreaterThanOrEqual(0);
    for (const v of seqA) expect(v).toBeLessThan(1);
  });

  it('differs across seeds', () => {
    expect(mulberry32(1).next()).not.toEqual(mulberry32(2).next());
  });

  it('shuffle is a permutation and deterministic', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const s1 = mulberry32(7).shuffle(items);
    const s2 = mulberry32(7).shuffle(items);
    expect(s1).toEqual(s2);
    expect([...s1].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]); // not mutated
  });

  it('weighted pick favours heavier items', () => {
    const rng = mulberry32(3);
    let heavy = 0;
    for (let i = 0; i < 1000; i++) {
      if (rng.weighted(['light', 'heavy'], (x) => (x === 'heavy' ? 9 : 1)) === 'heavy') heavy++;
    }
    expect(heavy).toBeGreaterThan(800);
    expect(heavy).toBeLessThan(960);
  });

  it('throws on empty pick', () => {
    expect(() => mulberry32(1).pick([])).toThrow();
  });
});

describe('parseSeed', () => {
  it('parses a valid integer', () => {
    expect(parseSeed('123')).toBe(123);
  });
  it('falls back on garbage, negatives, floats, and empties', () => {
    const fb = () => 999;
    expect(parseSeed('abc', fb)).toBe(999);
    expect(parseSeed('-4', fb)).toBe(999);
    expect(parseSeed('1.5', fb)).toBe(999);
    expect(parseSeed('', fb)).toBe(999);
    expect(parseSeed(null, fb)).toBe(999);
  });
});
