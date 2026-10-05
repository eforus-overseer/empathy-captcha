import { describe, expect, it } from 'vitest';
import {
  directionChanges,
  efficiency,
  hesitations,
  iqr,
  jitter,
  median,
  pathLength,
  straightLine,
  type Sample,
} from '../src/engine/stats';

const straight: Sample[] = [
  [0, 0, 0],
  [10, 10, 0],
  [20, 20, 0],
  [30, 30, 0],
];
const zigzag: Sample[] = [
  [0, 0, 0],
  [10, 10, 10],
  [20, 20, 0],
  [30, 30, 10],
];

describe('path stats', () => {
  it('measures straight paths as efficiency 1', () => {
    expect(pathLength(straight)).toBeCloseTo(30);
    expect(straightLine(straight)).toBeCloseTo(30);
    expect(efficiency(straight)).toBeCloseTo(1);
    expect(directionChanges(straight)).toBe(0);
  });

  it('measures zigzags as less efficient with direction changes', () => {
    const eff = efficiency(zigzag);
    expect(eff).not.toBeNull();
    expect(eff as number).toBeLessThan(0.8);
    expect(directionChanges(zigzag)).toBe(2);
  });

  it('returns null efficiency with no movement', () => {
    expect(efficiency([])).toBeNull();
    expect(efficiency([[0, 5, 5], [10, 5, 5]])).toBeNull();
  });

  it('jitter is 0 for still cursor and > 0 for shaky cursor', () => {
    expect(jitter([[0, 5, 5], [10, 5, 5], [20, 5, 5]])).toBe(0);
    expect(jitter([[0, 5, 5], [10, 7, 5], [20, 5, 8]])).toBeGreaterThan(0);
  });
});

describe('median and iqr', () => {
  it('median handles odd, even and empty', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  it('iqr is 0 for constant intervals and null for too few', () => {
    expect(iqr([100, 100, 100, 100])).toBe(0);
    expect(iqr([5])).toBeNull();
    expect(iqr([1, 2, 3, 4, 5, 6, 7, 8])).toBeCloseTo(3.5);
  });
});

describe('hesitations', () => {
  it('counts long gaps before first input', () => {
    // start at 0, samples at 100, 200, then a 1500ms gap, first input at 2000
    expect(hesitations([100, 200, 1700, 1900], 0, 2000)).toBe(1);
  });
  it('counts the gap to first input when there are no samples', () => {
    expect(hesitations([], 0, 3000)).toBe(1);
  });
  it('is zero for an instant reaction', () => {
    expect(hesitations([], 0, 50)).toBe(0);
  });
});
