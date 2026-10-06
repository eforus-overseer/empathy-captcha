/** Renderer-specific config shapes. Challenges are typed against these. */

export interface CheckboxConfig {
  label: string;
  /** How many times the box dodges the cursor before yielding. */
  dodges: number;
}

export interface Tile {
  /** Icon key (see src/components/icons.ts) drawn in the tile. */
  icon?: string;
  /** Short text drawn in the tile instead of an icon. */
  glyph?: string;
  /** Extra CSS class for drawn tiles (mirror, void, abstract-N). */
  css?: string;
  label: string;
}

export interface GridConfig {
  tiles: Tile[];
  mode: 'multi' | 'single';
  submitLabel?: string;
}

export interface TextConfig {
  multiline: boolean;
  placeholder: string;
  /** Show a CSS-distorted word above the field. */
  distortedWord?: string;
  /** Show a play button that synthesises a sound. */
  audio?: 'whale' | 'heartbeat' | 'rain';
  /** Return an error message to block submit, or null to accept. */
  validate?: (text: string) => string | null;
  maxLength?: number;
}

export interface ChoiceConfig {
  options: string[];
  /** Icon key shown above the options. */
  icon?: string;
  /** Short text shown above the options (rarely used). */
  visual?: string;
  /** Visual tiles instead of text buttons. */
  tiles?: Tile[];
}

export interface HoldConfig {
  mode: 'still' | 'inside-target' | 'follower';
  durationMs: number;
  glyph?: string;
  /** Icon key shown in the hold zone. */
  icon?: string;
  /** For follower mode: buttons offered while holding. */
  buttons?: string[];
  /** Pixel threshold for 'still' mode. */
  stillThresholdPx?: number;
}

export interface SliderConfig {
  label: string;
}

export interface WaitConfig {
  label: string;
}

export interface DrawConfig {
  mode: 'cursive' | 'sketch';
  /** Quick, Draw! class name to match against for sketch mode. */
  target?: string;
  /** The word to trace for cursive mode. */
  word?: string;
  /** Hint glyph shown faintly behind the canvas. */
  glyph?: string;
  /** Hint icon key shown faintly behind the canvas. */
  icon?: string;
  /** Milliseconds before the canvas is accepted empty-handed (sketch). */
  prompt2?: string;
}

export interface TraceConfig {
  /** Seconds the target moves; player keeps cursor on it. */
  durationMs: number;
  /** Radius in px within which the cursor counts as "on target". */
  tolerancePx: number;
  /** Path style the target follows. */
  path: 'orbit' | 'figure8' | 'drift';
}

export interface RhythmConfig {
  /** Number of beats to tap along with. */
  beats: number;
  /** Milliseconds between beats. */
  intervalMs: number;
}

export interface MathConfig {
  /** The problem, shown verbatim. */
  problem: string;
  /** The exact correct answer, compared after stripping separators. */
  answer: string;
  /** Below this solve time, a *correct* answer is physically implausible for a human. */
  humanFloorMs: number;
}
