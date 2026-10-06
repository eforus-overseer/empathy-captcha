import { describe, expect, it } from 'vitest';
import { registry } from '../src/challenges';
import { Director } from '../src/engine/director';
import { mulberry32 } from '../src/engine/rng';

function plan(seed: number): string[] {
  const d = new Director(registry, mulberry32(seed));
  const ids: string[] = [];
  for (let c = d.next(); c; c = d.next()) {
    ids.push(c.id);
    d.adjustSuspicion(0);
  }
  return ids;
}

describe('every run exercises the motor-control challenges', () => {
  const required = ['trace-orbit', 'rhythm-slow', 'trace-drift', 'rhythm-mid', 'trace-figure8', 'rhythm-heart'];
  it('includes trace and rhythm in all three acts, over many seeds', () => {
    for (let seed = 0; seed < 25; seed++) {
      const ids = plan(seed);
      expect(ids).toHaveLength(100);
      for (const r of required) expect(ids, `seed ${seed} missing ${r}`).toContain(r);
      // at least one drawing challenge too
      const drawCount = ids.filter((id) => id.startsWith('sketch-') || id.startsWith('cursive-')).length;
      expect(drawCount, `seed ${seed} drawings`).toBeGreaterThanOrEqual(2);
      expect(ids.filter((id) => id.startsWith('math-')).length, `seed ${seed} math`).toBeGreaterThanOrEqual(3);
    }
  });
});
