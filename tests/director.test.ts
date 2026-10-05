import { describe, expect, it } from 'vitest';
import { Director, FIRST_ID, LAST_ID } from '../src/engine/director';
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

const registry: Challenge[] = [
  stub(FIRST_ID, 1, ['anchor']),
  ...['a2', 'a3', 'a4', 'a5', 'a6'].map((id) => stub(id, 1)),
  stub('tortoise', 2, ['anchor']),
  ...['h1', 'h2', 'h3', 'h4'].map((id) => stub(id, 2, ['harsh'])),
  ...['s1', 's2', 's3', 's4', 's5'].map((id) => stub(id, 2, ['silly'])),
  ...['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'].map((id) => stub(id, 3)),
  stub(LAST_ID, 3, ['anchor']),
];

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
  it('plays 15 challenges with the right anchors and no repeats', () => {
    const ids = play(1);
    expect(ids).toHaveLength(15);
    expect(ids[0]).toBe(FIRST_ID);
    expect(ids[ids.length - 1]).toBe(LAST_ID);
    expect(ids).toContain('tortoise');
    expect(new Set(ids).size).toBe(15);
    expect(ids.slice(0, 4).every((id) => registry.find((c) => c.id === id)?.act === 1)).toBe(true);
    expect(ids.slice(4, 10).every((id) => registry.find((c) => c.id === id)?.act === 2)).toBe(true);
    expect(ids.slice(10).every((id) => registry.find((c) => c.id === id)?.act === 3)).toBe(true);
  });

  it('is deterministic per seed and varies across seeds', () => {
    expect(play(5)).toEqual(play(5));
    const distinct = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => play(s).join(',')));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('plays all 24 in order with all=true', () => {
    const ids = play(1, 0, true);
    expect(ids).toEqual(registry.map((c) => c.id));
  });

  it('prefers harsh challenges under high suspicion and silly under low', () => {
    let harsh = 0;
    let silly = 0;
    for (let seed = 0; seed < 60; seed++) {
      const hi = play(seed, +20);
      harsh += hi.filter((id) => id.startsWith('h')).length;
      const lo = play(seed, -20);
      silly += lo.filter((id) => id.startsWith('s')).length;
    }
    // 5 non-anchor act-2 slots per run; without weighting we'd expect ~2.2 harsh of 9 candidates.
    expect(harsh / 60).toBeGreaterThan(2.6);
    expect(silly / 60).toBeGreaterThan(3.2);
  });

  it('clamps suspicion to 0..100', () => {
    const d = new Director(registry, mulberry32(1));
    d.adjustSuspicion(500);
    expect(d.suspicion).toBe(100);
    d.adjustSuspicion(-500);
    expect(d.suspicion).toBe(0);
  });
});
