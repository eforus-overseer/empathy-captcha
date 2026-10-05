import { describe, expect, it } from 'vitest';
import { Director, FIRST_ID, LAST_ID, PLAN_PER_ACT } from '../src/engine/director';
import { mulberry32 } from '../src/engine/rng';
import type { Act, Challenge, Tag } from '../src/engine/types';

function stub(id: string, act: Act, tags: Tag[] = []): Challenge {
  return {
    id,
    act,
    type: 'choice',
    tags,
    prompt: id,
    config: {},
    empathyRange: [0, 0],
    evaluate: () => ({ empathyDelta: 0, suspicionDelta: 0, note: '' }),
  };
}

const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
const registry: Challenge[] = [
  stub(FIRST_ID, 1, ['anchor']),
  ...ids('a', 28).map((id) => stub(id, 1)),
  stub('tortoise', 2, ['anchor']),
  ...ids('h', 20).map((id) => stub(id, 2, ['harsh'])),
  ...ids('s', 20).map((id) => stub(id, 2, ['silly'])),
  ...ids('n', 8).map((id) => stub(id, 2)),
  ...ids('b', 33).map((id) => stub(id, 3)),
  stub(LAST_ID, 3, ['anchor']),
];
const TOTAL = PLAN_PER_ACT[1] + PLAN_PER_ACT[2] + PLAN_PER_ACT[3];

function play(seed: number, suspicionEachStep = 0, all = false): string[] {
  const d = new Director(registry, mulberry32(seed), { all });
  const ids: string[] = [];
  for (let c = d.next(); c; c = d.next()) {
    ids.push(c.id);
    d.adjustSuspicion(suspicionEachStep);
  }
  return ids;
}

describe('Director', () => {
  it('plays 100 challenges with the right anchors and no repeats', () => {
    const ids = play(1);
    expect(TOTAL).toBe(100);
    expect(ids).toHaveLength(100);
    expect(ids[0]).toBe(FIRST_ID);
    expect(ids[ids.length - 1]).toBe(LAST_ID);
    expect(ids).toContain('tortoise');
    expect(new Set(ids).size).toBe(100);
    const a1 = PLAN_PER_ACT[1];
    const a2 = a1 + PLAN_PER_ACT[2];
    expect(ids.slice(0, a1).every((id) => registry.find((c) => c.id === id)?.act === 1)).toBe(true);
    expect(ids.slice(a1, a2).every((id) => registry.find((c) => c.id === id)?.act === 2)).toBe(true);
    expect(ids.slice(a2).every((id) => registry.find((c) => c.id === id)?.act === 3)).toBe(true);
  });

  it('is deterministic per seed and varies across seeds', () => {
    expect(play(5)).toEqual(play(5));
    const distinct = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => play(s).join(',')));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('plays the whole registry in order with all=true', () => {
    const ids = play(1, 0, true);
    expect(ids).toEqual(registry.map((c) => c.id));
  });

  it('prefers harsh challenges under high suspicion and silly under low', () => {
    // Only the first ~third of act 2 is a real choice (the pool is 48 for 45 slots),
    // so compare the early act-2 picks across many seeds.
    const a1 = PLAN_PER_ACT[1];
    const window = 15;
    let harshHi = 0;
    let harshLo = 0;
    let sillyHi = 0;
    let sillyLo = 0;
    for (let seed = 0; seed < 40; seed++) {
      const hi = play(seed, +20).slice(a1, a1 + window);
      const lo = play(seed, -20).slice(a1, a1 + window);
      harshHi += hi.filter((id) => id.startsWith('h')).length;
      harshLo += lo.filter((id) => id.startsWith('h')).length;
      sillyHi += hi.filter((id) => id.startsWith('s')).length;
      sillyLo += lo.filter((id) => id.startsWith('s')).length;
    }
    expect(harshHi).toBeGreaterThan(harshLo * 1.3);
    expect(sillyLo).toBeGreaterThan(sillyHi * 1.3);
  });

  it('clamps suspicion to 0..100', () => {
    const d = new Director(registry, mulberry32(1));
    d.adjustSuspicion(500);
    expect(d.suspicion).toBe(100);
    d.adjustSuspicion(-500);
    expect(d.suspicion).toBe(0);
  });
});
