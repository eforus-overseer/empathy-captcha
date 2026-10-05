import { describe, expect, it } from 'vitest';
import { bbox, classify, drawStats, rasterize, similarity } from '../src/engine/draw';
import type { DrawStroke } from '../src/engine/types';

const square: DrawStroke[] = [[[0, 10, 10, 0, 0], [0, 0, 10, 10, 0]]];
const squareShifted: DrawStroke[] = [[[100, 120, 120, 100, 100], [50, 50, 70, 70, 50]]];
const line: DrawStroke[] = [[[0, 10, 20, 30], [0, 10, 20, 30]]];

describe('bbox and rasterize', () => {
  it('bounds strokes and is null for empty', () => {
    expect(bbox(square)).toEqual({ x: 0, y: 0, w: 10, h: 10 });
    expect(bbox([])).toBeNull();
  });
  it('rasterises to a normalised grid, translation-invariant', () => {
    const a = rasterize(square, 16);
    const b = rasterize(squareShifted, 16);
    expect(similarity(a, b)).toBeGreaterThan(0.95);
    expect(a.some((v) => v > 0)).toBe(true);
  });
});

describe('similarity', () => {
  it('is 1 for identical, lower for different shapes', () => {
    const sq = rasterize(square, 16);
    const ln = rasterize(line, 16);
    expect(similarity(sq, sq)).toBeCloseTo(1);
    expect(similarity(sq, ln)).toBeLessThan(0.8);
    expect(similarity(sq, new Float64Array(256))).toBe(0);
  });
});

describe('classify', () => {
  it('picks the closest class', () => {
    const templates = {
      square: [rasterize(square, 16)],
      line: [rasterize(line, 16)],
    };
    const result = classify(squareShifted, templates, { topK: 1 });
    expect(result.best).toBe('square');
    expect(result.score).toBeGreaterThan(result.perClass.line ?? 0);
  });
  it('returns null best for an empty drawing', () => {
    const r = classify([], { x: [rasterize(square)] }, {});
    expect(r.best).toBeNull();
    expect(r.score).toBe(0);
  });
});

describe('drawStats', () => {
  it('summarises a hand-drawn stroke', () => {
    const s = drawStats(square, 2000);
    expect(s.strokeCount).toBe(1);
    expect(s.pointCount).toBe(5);
    expect(s.inkLength).toBeCloseTo(40);
    expect(s.meanSpeed).toBeCloseTo(0.02);
    expect(s.bbox).toEqual({ w: 10, h: 10 });
  });
  it('reports near-zero wobble and speed variation for a perfectly even straight line', () => {
    const s = drawStats(line, 1000);
    expect(s.wobble).toBeCloseTo(0);
    expect(s.speedVariation).toBeCloseTo(0);
  });
  it('reports wobble for a jagged stroke', () => {
    const jag: DrawStroke[] = [[[0, 5, 2, 8, 3, 9], [0, 6, 1, 7, 2, 9]]];
    expect(drawStats(jag, 1000).wobble).toBeGreaterThan(0.5);
  });
  it('handles empty input', () => {
    const s = drawStats([], 0);
    expect(s.strokeCount).toBe(0);
    expect(s.bbox).toBeNull();
    expect(s.meanSpeed).toBe(0);
  });
});
