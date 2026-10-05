/**
 * Client-only behavioural recorder. Takes raw events through plain method
 * calls so it can be unit tested without a DOM; the DOM adapter lives in
 * components/recorder-dom.ts.
 */
import {
  directionChanges,
  hesitations,
  iqr,
  pathLength,
  segmentEfficiency,
  straightLine,
  type Sample,
} from './stats';
import type { Act, Answer, ChallengeStats, ChallengeType, Evaluation, Scores } from './types';

export const TRANSCRIPT_VERSION = 1;
export const MAX_SAMPLES = 2000;
export const MIN_SAMPLE_GAP_MS = 20; // <= 50 Hz

export interface ChallengeRecord {
  id: string;
  act: Act;
  type: ChallengeType;
  startedAt: number; // epoch ms
  endedAt: number;
  timeToFirstInputMs: number | null;
  pointerSamples: Sample[]; // [tRel, x, y] relative to challenge start / frame
  clicks: Sample[];
  keyIntervalsMs: number[];
  blurs: number;
  answer: Answer | null;
  evaluation: Evaluation | null;
  stats: ChallengeStats;
}

export interface SessionEnv {
  userAgent: string;
  webdriver: boolean;
  viewport: { w: number; h: number };
  pointerFine: boolean;
  touch: boolean;
  language: string;
  timezone: string;
  reducedMotion: boolean;
}

export interface SessionTranscript {
  version: number;
  sessionId: string;
  startedAt: string; // ISO
  endedAt: string | null;
  seed: number;
  agentLabel: string | null;
  mode: 'standard' | 'all';
  env: SessionEnv;
  challenges: ChallengeRecord[];
  scores: (Scores & { suspicionFinal: number; penalties: { rule: string; delta: number }[] }) | null;
}

/** Records one challenge. Call start(), feed events, then finish(). */
export class ChallengeRecorder {
  private startMs = 0;
  private startEpoch = 0;
  private lastSampleMs = -Infinity;
  private firstInputMs: number | null = null;
  private lastKeyMs: number | null = null;
  readonly samples: Sample[] = [];
  readonly clicks: Sample[] = [];
  readonly keyIntervals: number[] = [];
  blurs = 0;

  constructor(
    private readonly meta: { id: string; act: Act; type: ChallengeType },
    private readonly now: () => number = () => performance.now(),
    private readonly epoch: () => number = () => Date.now(),
  ) {}

  start(): void {
    this.startMs = this.now();
    this.startEpoch = this.epoch();
  }

  private rel(): number {
    return Math.round(this.now() - this.startMs);
  }

  pointer(x: number, y: number): void {
    const t = this.rel();
    if (t - this.lastSampleMs < MIN_SAMPLE_GAP_MS) return;
    if (this.samples.length >= MAX_SAMPLES) return;
    this.lastSampleMs = t;
    this.samples.push([t, Math.round(x), Math.round(y)]);
  }

  click(x: number, y: number): void {
    const t = this.rel();
    this.markInput(t);
    this.clicks.push([t, Math.round(x), Math.round(y)]);
  }

  key(): void {
    const t = this.rel();
    this.markInput(t);
    if (this.lastKeyMs !== null) this.keyIntervals.push(t - this.lastKeyMs);
    this.lastKeyMs = t;
  }

  /** Any other deliberate input (drag start, slider, hold begin). */
  input(): void {
    this.markInput(this.rel());
  }

  blur(): void {
    this.blurs++;
  }

  private markInput(t: number): void {
    if (this.firstInputMs === null) this.firstInputMs = t;
  }

  finish(answer: Answer | null, evaluation: Evaluation | null): ChallengeRecord {
    const endRel = this.rel();
    const stats: ChallengeStats = {
      durationMs: endRel,
      timeToFirstInputMs: this.firstInputMs,
      pathLengthPx: Math.round(pathLength(this.samples)),
      straightLinePx: Math.round(straightLine(this.samples)),
      efficiency: segmentEfficiency(
        this.samples,
        this.clicks.map((c) => c[0]),
      ),
      directionChanges: directionChanges(this.samples),
      hesitations: hesitations(
        this.samples.map((s) => s[0]),
        0,
        this.firstInputMs,
      ),
      keyIntervalIqrMs: iqr(this.keyIntervals),
      pointerSampleCount: this.samples.length,
      clickCount: this.clicks.length,
      blurCount: this.blurs,
    };
    return {
      ...this.meta,
      startedAt: this.startEpoch,
      endedAt: this.startEpoch + endRel,
      timeToFirstInputMs: this.firstInputMs,
      pointerSamples: this.samples,
      clicks: this.clicks,
      keyIntervalsMs: this.keyIntervals,
      blurs: this.blurs,
      answer,
      evaluation,
      stats,
    };
  }

  /** Stats so far, for challenges that evaluate on behaviour before finish(). */
  peekStats(): ChallengeStats {
    return this.finish(null, null).stats;
  }
}

export function newSessionId(rand: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'VK-';
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return s;
}

export function newTranscript(
  seed: number,
  agentLabel: string | null,
  mode: 'standard' | 'all',
  env: SessionEnv,
  sessionId = newSessionId(),
  startedAt = new Date(),
): SessionTranscript {
  return {
    version: TRANSCRIPT_VERSION,
    sessionId,
    startedAt: startedAt.toISOString(),
    endedAt: null,
    seed,
    agentLabel,
    mode,
    env,
    challenges: [],
    scores: null,
  };
}

export function transcriptFilename(t: SessionTranscript): string {
  return `empathy-captcha-${t.sessionId}.json`;
}
