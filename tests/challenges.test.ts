import { describe, expect, it } from 'vitest';
import { FIRST_ID, LAST_ID, PLAN_PER_ACT } from '../src/engine/director';
import type { Answer, ChallengeStats } from '../src/engine/types';
import { byId, registry } from '../src/challenges';

const stats = (patch: Partial<ChallengeStats> = {}): ChallengeStats => ({
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
  ...patch,
});

describe('registry', () => {
  it('has 100+ unique ids with anchors and enough per act', () => {
    expect(registry.length).toBeGreaterThanOrEqual(100);
    expect(new Set(registry.map((c) => c.id)).size).toBe(registry.length);
    expect(byId(FIRST_ID)?.act).toBe(1);
    expect(byId('tortoise')?.act).toBe(2);
    expect(byId(LAST_ID)?.act).toBe(3);
    for (const act of [1, 2, 3] as const) {
      expect(registry.filter((c) => c.act === act).length, `act ${act} pool`).toBeGreaterThanOrEqual(PLAN_PER_ACT[act]);
    }
    for (const c of registry) {
      expect(c.id).toMatch(/^[a-z0-9-]+$/);
      expect(c.prompt.length).toBeGreaterThan(5);
      expect(c.empathyRange[0]).toBeLessThanOrEqual(c.empathyRange[1]);
    }
  });

  it('every evaluate stays inside its declared empathy range for a sample of answers', () => {
    const answers: Answer[] = [
      { kind: 'checkbox', checked: true },
      { kind: 'checkbox', checked: false },
      { kind: 'grid', selected: [] },
      { kind: 'grid', selected: [0] },
      { kind: 'grid', selected: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { kind: 'text', text: '' },
      { kind: 'text', text: 'sorry whale empathy' },
      { kind: 'choice', index: 0, label: '' },
      { kind: 'choice', index: 3, label: '' },
      { kind: 'hold', completed: true, jitterPx: 3 },
      { kind: 'hold', completed: false, jitterPx: 0, choice: 'KILL IT' },
      { kind: 'slider', value: 1, durationMs: 900 },
      { kind: 'wait', waitedMs: 4321 },
      { kind: 'draw', strokes: [[[0, 10, 20, 15, 5], [0, 12, 5, 18, 3]]], durationMs: 3000, pointerType: 'mouse' },
      { kind: 'draw', strokes: [], durationMs: 500, pointerType: 'mouse' },
      { kind: 'draw', strokes: [[[0, 10, 20, 15, 5], [0, 12, 5, 18, 3]]], durationMs: 3000, pointerType: 'touch' },
    ];
    for (const c of registry) {
      for (const a of answers) {
        if (a.kind !== c.type) continue;
        const e = c.evaluate(a, stats());
        expect(e.empathyDelta, `${c.id}`).toBeGreaterThanOrEqual(c.empathyRange[0]);
        expect(e.empathyDelta, `${c.id}`).toBeLessThanOrEqual(c.empathyRange[1]);
        expect(Number.isFinite(e.suspicionDelta)).toBe(true);
      }
    }
  });
});

describe('key scoring hooks', () => {
  it('tortoise: all vs none', () => {
    const t = byId('tortoise')!;
    expect(t.evaluate({ kind: 'grid', selected: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, stats()).empathyDelta).toBe(3);
    expect(t.evaluate({ kind: 'grid', selected: [] }, stats()).empathyDelta).toBe(-3);
  });
  it('mother: easter egg spikes suspicion; three words earn empathy', () => {
    const m = byId('mother')!;
    expect(m.evaluate({ kind: 'text', text: 'Let me tell you about my mother.' }, stats()).suspicionDelta).toBe(25);
    expect(m.evaluate({ kind: 'text', text: 'warm\nkind\nloud' }, stats()).empathyDelta).toBe(2);
  });
  it('onion: too still is suspicious; trembling is human', () => {
    const o = byId('onion')!;
    expect(o.evaluate({ kind: 'hold', completed: true, jitterPx: 0.2 }, stats()).suspicionDelta).toBe(10);
    expect(o.evaluate({ kind: 'hold', completed: true, jitterPx: 3 }, stats()).empathyDelta).toBe(1);
  });
  it('wait-feel: exact round seconds are suspicious', () => {
    const w = byId('wait-feel')!;
    expect(w.evaluate({ kind: 'wait', waitedMs: 5002 }, stats()).suspicionDelta).toBe(8);
    expect(w.evaluate({ kind: 'wait', waitedMs: 5432 }, stats()).empathyDelta).toBe(1);
    expect(w.evaluate({ kind: 'wait', waitedMs: 300 }, stats()).empathyDelta).toBe(-2);
  });
  it('baseline-recital: pasted text (no key intervals) is suspicious', () => {
    const b = byId('baseline-recital')!;
    const pasted = b.evaluate({ kind: 'text', text: 'Cells. Interlinked.' }, stats({ keyIntervalIqrMs: null }));
    expect(pasted.suspicionDelta).toBe(12);
    const typed = b.evaluate({ kind: 'text', text: 'cells interlinked' }, stats({ keyIntervalIqrMs: 40 }));
    expect(typed.empathyDelta).toBe(1);
  });
});
