import { describe, expect, it } from 'vitest';
import { byId } from '../src/challenges';
import type { ChallengeStats } from '../src/engine/types';

const stats = (): ChallengeStats => ({
  durationMs: 3000, timeToFirstInputMs: 500, pathLengthPx: 0, straightLinePx: 0,
  efficiency: null, directionChanges: 0, hesitations: 0, keyIntervalIqrMs: 40,
  pointerSampleCount: 0, clickCount: 1, blurCount: 0,
});

describe('math is a speed trap, not a quiz', () => {
  const c = byId('math-mult-1')!; // answer 3110318465891, floor 9000ms
  it('flags a correct answer delivered implausibly fast as a fatal tell', () => {
    const e = c.evaluate({ kind: 'math', value: '3,110,318,465,891', gaveUp: false, solveMs: 3000 }, stats());
    expect(e.tell?.severity).toBe('fatal');
  });
  it('accepts a slow correct answer as only a minor tell (a tool, not a bot)', () => {
    const e = c.evaluate({ kind: 'math', value: '3110318465891', gaveUp: false, solveMs: 25000 }, stats());
    expect(e.tell?.severity).toBe('minor');
  });
  it('rewards giving up with empathy and no tell', () => {
    const e = c.evaluate({ kind: 'math', value: '', gaveUp: true, solveMs: 5000 }, stats());
    expect(e.empathyDelta).toBeGreaterThan(0);
    expect(e.tell).toBeUndefined();
  });
  it('does not flag a wrong answer', () => {
    const e = c.evaluate({ kind: 'math', value: '42', gaveUp: false, solveMs: 2000 }, stats());
    expect(e.tell).toBeUndefined();
  });
});
