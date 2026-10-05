/** Shared types for the engine, challenges and renderers. No DOM here. */

export type Act = 1 | 2 | 3;

export type ChallengeType =
  | 'checkbox'
  | 'grid'
  | 'text'
  | 'choice'
  | 'hold'
  | 'slider'
  | 'wait';

export type Tag = 'anchor' | 'harsh' | 'silly' | 'behavioural';

/** What a renderer resolves with when the player submits. */
export type Answer =
  | { kind: 'checkbox'; checked: boolean }
  | { kind: 'grid'; selected: number[] }
  | { kind: 'text'; text: string }
  | { kind: 'choice'; index: number; label: string }
  | { kind: 'hold'; completed: boolean; choice?: string; jitterPx: number }
  | { kind: 'slider'; value: number; durationMs: number }
  | { kind: 'wait'; waitedMs: number };

export interface Evaluation {
  empathyDelta: number;
  suspicionDelta: number;
  /** One-line interrogator reaction. */
  note: string;
}

/** Behavioural stats for one challenge, computed from the recorder. */
export interface ChallengeStats {
  durationMs: number;
  timeToFirstInputMs: number | null;
  pathLengthPx: number;
  straightLinePx: number;
  /** straightLine / pathLength; 1 = perfectly straight, null if no movement. */
  efficiency: number | null;
  directionChanges: number;
  /** Pauses > 800ms between pointer samples before the first input. */
  hesitations: number;
  keyIntervalIqrMs: number | null;
  pointerSampleCount: number;
  clickCount: number;
  blurCount: number;
}

export interface Challenge<C = unknown> {
  id: string;
  act: Act;
  type: ChallengeType;
  tags: Tag[];
  prompt: string;
  config: C;
  /** Theoretical empathy range this challenge can award, for normalisation. */
  empathyRange: [min: number, max: number];
  evaluate(answer: Answer, stats: ChallengeStats): Evaluation;
}

export interface Scores {
  empathy: number; // 0..100
  humanness: number; // 0..100
  verdict: Verdict;
  readouts: Readouts;
}

export type Verdict = 'HUMAN' | 'REPLICANT' | 'INCONCLUSIVE';

export interface Readouts {
  pupilDilation: number;
  blushResponse: number;
  respiration: number;
  capillary: number;
}
