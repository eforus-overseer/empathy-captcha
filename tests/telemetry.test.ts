import { describe, expect, it } from 'vitest';
import {
  ChallengeRecorder,
  MAX_SAMPLES,
  TRANSCRIPT_VERSION,
  newSessionId,
  newTranscript,
  transcriptFilename,
  type SessionEnv,
} from '../src/engine/telemetry';

function clock(start = 1000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

const env: SessionEnv = {
  userAgent: 'test',
  webdriver: false,
  viewport: { w: 800, h: 600 },
  pointerFine: true,
  touch: false,
  language: 'en',
  timezone: 'UTC',
  reducedMotion: false,
};

describe('ChallengeRecorder', () => {
  it('downsamples pointer events to <= 50 Hz', () => {
    const c = clock();
    const r = new ChallengeRecorder({ id: 'x', act: 1, type: 'grid' }, c.now, () => 0);
    r.start();
    for (let i = 0; i < 100; i++) {
      r.pointer(i, i);
      c.advance(5); // 200 Hz input
    }
    expect(r.samples.length).toBeLessThanOrEqual(26);
    expect(r.samples.length).toBeGreaterThanOrEqual(24);
  });

  it('caps samples', () => {
    const c = clock();
    const r = new ChallengeRecorder({ id: 'x', act: 1, type: 'grid' }, c.now, () => 0);
    r.start();
    for (let i = 0; i < MAX_SAMPLES + 500; i++) {
      r.pointer(i, 0);
      c.advance(25);
    }
    expect(r.samples).toHaveLength(MAX_SAMPLES);
  });

  it('records time to first input from a click and key intervals', () => {
    const c = clock();
    const r = new ChallengeRecorder({ id: 'x', act: 2, type: 'text' }, c.now, () => 5000);
    r.start();
    c.advance(640);
    r.key();
    c.advance(120);
    r.key();
    c.advance(90);
    r.key();
    c.advance(10);
    const rec = r.finish({ kind: 'text', text: 'abc' }, null);
    expect(rec.timeToFirstInputMs).toBe(640);
    expect(rec.keyIntervalsMs).toEqual([120, 90]);
    expect(rec.stats.durationMs).toBe(860);
    expect(rec.startedAt).toBe(5000);
    expect(rec.endedAt).toBe(5860);
    expect(rec.stats.keyIntervalIqrMs).not.toBeNull();
  });

  it('computes path stats and hesitations', () => {
    const c = clock();
    const r = new ChallengeRecorder({ id: 'x', act: 1, type: 'checkbox' }, c.now, () => 0);
    r.start();
    c.advance(1200); // hesitation before moving
    r.pointer(0, 0);
    c.advance(50);
    r.pointer(30, 40);
    c.advance(50);
    r.click(30, 40);
    const rec = r.finish({ kind: 'checkbox', checked: true }, null);
    expect(rec.stats.pathLengthPx).toBe(50);
    expect(rec.stats.efficiency).toBeCloseTo(1);
    expect(rec.stats.hesitations).toBe(1);
    expect(rec.stats.clickCount).toBe(1);
    expect(rec.stats.pointerSampleCount).toBe(2);
  });
});

describe('transcript', () => {
  it('builds a versioned envelope', () => {
    const t = newTranscript(42, 'cua-v1', 'standard', env, 'VK-TEST1234', new Date(0));
    expect(t.version).toBe(TRANSCRIPT_VERSION);
    expect(t.seed).toBe(42);
    expect(t.agentLabel).toBe('cua-v1');
    expect(t.env.webdriver).toBe(false);
    expect(t.challenges).toEqual([]);
    expect(t.preamble).toBeNull();
    expect(TRANSCRIPT_VERSION).toBe(2);
    expect(t.startedAt).toBe('1970-01-01T00:00:00.000Z');
    expect(JSON.parse(JSON.stringify(t))).toEqual(t);
    expect(transcriptFilename(t)).toBe('empathy-captcha-VK-TEST1234.json');
  });
  it('session ids are prefixed and 8 chars', () => {
    expect(newSessionId(() => 0)).toMatch(/^VK-[A-Z2-9]{8}$/);
  });
});
