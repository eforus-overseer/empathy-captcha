import { describe, expect, it } from 'vitest';
import { byId } from '../src/challenges';
import { aggregate, score } from '../src/engine/scoring';
import { iqr, median } from '../src/engine/stats';
import type { Answer, BotTell, ChallengeStats } from '../src/engine/types';

/**
 * Reproduces the reported failure: an LLM aces the empathy questions but cannot
 * do real-time motor control. It must now fail, because the verdict is driven
 * by behaviour, not by the empathy answers.
 */
const humanStats = (): ChallengeStats => ({
  durationMs: 2000,
  timeToFirstInputMs: 900,
  pathLengthPx: 300,
  straightLinePx: 200,
  efficiency: 0.66,
  directionChanges: 4,
  hesitations: 1,
  keyIntervalIqrMs: 40,
  pointerSampleCount: 60,
  clickCount: 2,
  blurCount: 0,
});

describe('an LLM agent that aces empathy is still caught', () => {
  it('fails the motor-control challenges, producing tells that force REPLICANT', () => {
    const tells: BotTell[] = [];
    const collect = (a: Answer, id: string) => {
      const c = byId(id);
      expect(c, id).toBeTruthy();
      const e = c!.evaluate(a, humanStats());
      if (e.tell) tells.push(e.tell);
    };

    // agent cannot track a moving target in real time -> never on it
    collect({ kind: 'trace', completed: true, meanErrorPx: 140, coverage: 0.05, sampleCount: 120 }, 'trace-orbit');
    collect({ kind: 'trace', completed: false, meanErrorPx: 300, coverage: 0, sampleCount: 3 }, 'trace-drift');
    // agent cannot tap in time with a sub-second pulse
    collect({ kind: 'rhythm', taps: 8, expected: 6, offsetsMs: [400, -380, 420], offsetIqrMs: 40, meanAbsOffsetMs: 410 }, 'rhythm-slow');
    collect({ kind: 'rhythm', taps: 2, expected: 8, offsetsMs: [], offsetIqrMs: null, meanAbsOffsetMs: 999 }, 'rhythm-mid');

    expect(tells.filter((t) => t.severity === 'major' || t.severity === 'fatal').length).toBeGreaterThanOrEqual(2);

    // meanwhile it answered the empathy questions perfectly: empathy maxed
    const agg = aggregate([humanStats(), humanStats()], [120, 90, 150, 110], false, iqr, median, null, { visible: [], hidden: [] }, 2, tells);
    const result = score(agg, 100, -100, 100, 40); // empathy sum at the max

    expect(result.empathy).toBeGreaterThanOrEqual(90); // aced the questions
    expect(result.verdict).toBe('REPLICANT'); // but caught on behaviour
    expect(result.hardFails.length).toBeGreaterThan(0);
  });

  it('a genuine human with a little empathy and clean motor control passes', () => {
    const agg = aggregate([humanStats(), humanStats()], [120, 90, 150, 110], false, iqr, median, null, { visible: [], hidden: [] }, 2, []);
    const result = score(agg, 30, -100, 100, 30);
    expect(result.verdict).toBe('HUMAN');
    expect(result.hardFails).toEqual([]);
  });

  it('a metronomic tap alone (fatal tell) is enough', () => {
    const r = byId('rhythm-mid')!.evaluate(
      { kind: 'rhythm', taps: 8, expected: 8, offsetsMs: [2, -1, 2, -2, 1], offsetIqrMs: 3, meanAbsOffsetMs: 2 },
      humanStats(),
    );
    expect(r.tell?.severity).toBe('fatal');
  });
});
