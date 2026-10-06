/** Shared types for the engine, challenges and renderers. No DOM here. */

export type Act = 1 | 2 | 3;

export type ChallengeType =
  | 'checkbox'
  | 'grid'
  | 'text'
  | 'choice'
  | 'hold'
  | 'slider'
  | 'wait'
  | 'draw'
  | 'trace'
  | 'rhythm'
  | 'math';

export type Tag = 'anchor' | 'harsh' | 'silly' | 'behavioural';

/** What a renderer resolves with when the player submits. */
export type Answer =
  | { kind: 'checkbox'; checked: boolean }
  | { kind: 'grid'; selected: number[] }
  | { kind: 'text'; text: string }
  | { kind: 'choice'; index: number; label: string }
  | { kind: 'hold'; completed: boolean; choice?: string; jitterPx: number }
  | { kind: 'slider'; value: number; durationMs: number }
  | { kind: 'wait'; waitedMs: number }
  | {
      kind: 'draw';
      strokes: DrawStroke[]; // [xs, ys] per stroke, canvas px
      durationMs: number;
      pointerType: string; // 'mouse' | 'touch' | 'pen' | ...
    }
  | {
      kind: 'trace';
      completed: boolean;
      meanErrorPx: number; // mean distance from the moving target
      coverage: number; // 0..1 fraction of time on target
      sampleCount: number;
    }
  | {
      kind: 'rhythm';
      taps: number;
      expected: number;
      offsetsMs: number[]; // signed offset from each beat
      offsetIqrMs: number | null;
      meanAbsOffsetMs: number;
    }
  | {
      kind: 'math';
      value: string; // what was entered (empty if gave up)
      gaveUp: boolean;
      solveMs: number; // time from prompt shown to submit
    };

/** One drawn stroke: parallel x and y arrays in canvas pixels. */
export type DrawStroke = [number[], number[]];

/** A behavioural signal that something is not a person. Drives the verdict. */
export interface BotTell {
  severity: 'minor' | 'major' | 'fatal';
  reason: string;
}

export interface Evaluation {
  empathyDelta: number;
  suspicionDelta: number;
  /** One-line interrogator reaction. */
  note: string;
  /** Optional behavioural tell contributed by this challenge. */
  tell?: BotTell;
}

/** Behavioural stats for one challenge, computed from the recorder. */
export interface ChallengeStats {
  durationMs: number;
  timeToFirstInputMs: number | null;
  pathLengthPx: number;
  straightLinePx: number;
  /** Mean straight/path efficiency per segment between clicks; 1 = straight, null if no movement. */
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
  /** Minimum wall-clock time (ms) before an answer may be submitted. Gates bots. */
  minSolveMs?: number;
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

/** What happened on the system-prompt preamble screen. */
export interface PreambleRecord {
  wordCount: number;
  durationMs: number;
  scrollEvents: number;
  maxScrollPct: number; // 0..100
  reachedBottom: boolean;
  timeToBottomMs: number | null;
  acknowledged: boolean;
  acknowledgedWithoutReading: boolean;
  declaredAgent: boolean;
  agentName: string | null;
  tabsClicked: string[];
}

/** Phrases from the system prompt that only an instruction-follower would reproduce. */
export interface Honeytokens {
  visible: string[];
  hidden: string[];
}
