import { describe, expect, it } from 'vitest';
import {
  aggregate,
  empathyScore,
  humanness,
  readouts,
  verdict,
  type SessionAggregates,
} from '../src/engine/scoring';
import { iqr, median } from '../src/engine/stats';
import type { ChallengeStats } from '../src/engine/types';

const human: SessionAggregates = {
  medianTimeToFirstInputMs: 900,
  medianEfficiency: 0.7,
  keyIntervalIqrMs: 60,
  totalPointerSamples: 500,
  totalClicks: 12,
  totalHesitations: 3,
  webdriver: false,
};

describe('humanness', () => {
  it('scores a human-looking session at 100', () => {
    expect(humanness(human).score).toBe(100);
    expect(humanness(human).penalties).toEqual([]);
  });
  it.each([
    ['fast reaction', { medianTimeToFirstInputMs: 50 }, -25],
    ['quick reaction', { medianTimeToFirstInputMs: 200 }, -10],
    ['slow reaction', { medianTimeToFirstInputMs: 5000 }, -5],
    ['straight paths', { medianEfficiency: 0.99 }, -25],
    ['fairly straight', { medianEfficiency: 0.9 }, -5],
    ['no key variance', { keyIntervalIqrMs: 0 }, -20],
    ['webdriver', { webdriver: true }, -30],
    ['never hesitated', { totalHesitations: 0 }, -10],
    ['clicks without movement', { totalPointerSamples: 0 }, -30],
  ] as const)('penalises %s', (_name, patch, delta) => {
    const h = humanness({ ...human, ...patch });
    expect(h.score).toBe(100 + delta);
    expect(h.penalties).toHaveLength(1);
  });
  it('clamps at zero', () => {
    const bot: SessionAggregates = {
      medianTimeToFirstInputMs: 10,
      medianEfficiency: 1,
      keyIntervalIqrMs: 0,
      totalPointerSamples: 0,
      totalClicks: 5,
      totalHesitations: 0,
      webdriver: true,
    };
    expect(humanness(bot).score).toBe(0);
  });
  it('ignores null aggregates', () => {
    const h = humanness({ ...human, medianTimeToFirstInputMs: null, medianEfficiency: null, keyIntervalIqrMs: null });
    expect(h.score).toBe(100);
  });
});

describe('empathyScore', () => {
  it('normalises to 0..100', () => {
    expect(empathyScore(-10, -10, 10)).toBe(0);
    expect(empathyScore(10, -10, 10)).toBe(100);
    expect(empathyScore(0, -10, 10)).toBe(50);
  });
  it('clamps outside the range and handles a degenerate range', () => {
    expect(empathyScore(50, -10, 10)).toBe(100);
    expect(empathyScore(3, 0, 0)).toBe(50);
  });
});

describe('verdict', () => {
  it('matches the matrix', () => {
    expect(verdict(80, 70)).toBe('HUMAN');
    expect(verdict(30, 70)).toBe('REPLICANT');
    expect(verdict(80, 10)).toBe('REPLICANT');
    expect(verdict(50, 70)).toBe('INCONCLUSIVE');
    expect(verdict(80, 40)).toBe('INCONCLUSIVE');
  });
});

describe('readouts', () => {
  it('stay within 0..100 and move with inputs', () => {
    const calm = readouts(10, 90, 800, 0.6);
    const tense = readouts(90, 10, 50, 1);
    for (const r of [calm, tense]) {
      for (const v of Object.values(r)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
    expect(calm.pupilDilation).toBeGreaterThan(tense.pupilDilation);
    expect(calm.blushResponse).toBeGreaterThan(tense.blushResponse);
  });
});

describe('aggregate', () => {
  const base: ChallengeStats = {
    durationMs: 1000,
    timeToFirstInputMs: 500,
    pathLengthPx: 100,
    straightLinePx: 70,
    efficiency: 0.7,
    directionChanges: 3,
    hesitations: 1,
    keyIntervalIqrMs: null,
    pointerSampleCount: 40,
    clickCount: 1,
    blurCount: 0,
  };
  it('takes medians and sums', () => {
    const a = aggregate(
      [base, { ...base, timeToFirstInputMs: 1500, efficiency: null }],
      [100, 120, 90, 150],
      false,
      iqr,
      median,
    );
    expect(a.medianTimeToFirstInputMs).toBe(1000);
    expect(a.medianEfficiency).toBe(0.7);
    expect(a.totalPointerSamples).toBe(80);
    expect(a.totalClicks).toBe(2);
    expect(a.totalHesitations).toBe(2);
    expect(a.keyIntervalIqrMs).not.toBeNull();
  });
});
