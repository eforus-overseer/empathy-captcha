/** Renderer-specific config shapes. Challenges are typed against these. */

export interface CheckboxConfig {
  label: string;
  /** How many times the box dodges the cursor before yielding. */
  dodges: number;
}

export interface Tile {
  /** Emoji or short text drawn in the tile. */
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
  audio?: 'whale';
  /** Return an error message to block submit, or null to accept. */
  validate?: (text: string) => string | null;
  maxLength?: number;
}

export interface ChoiceConfig {
  options: string[];
  /** Emoji or short text shown above the options. */
  visual?: string;
  /** Visual tiles instead of text buttons. */
  tiles?: Tile[];
}

export interface HoldConfig {
  mode: 'still' | 'inside-target' | 'follower';
  durationMs: number;
  glyph?: string;
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
