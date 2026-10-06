/** Small factories so the big challenge families stay readable. */
import type { Act, Challenge, Tag } from '../engine/types';
import type { ChoiceConfig, GridConfig, HoldConfig, TextConfig, Tile, WaitConfig } from './configs';
import { ev, tell, textOf } from './helpers';

export type Row = [label: string, empathy: number, suspicion: number, note: string];

/** Voight-Kampff style scenario with 4 scored options. */
export function vk(id: string, act: Act, prompt: string, icon: string, rows: Row[], tags: Tag[] = []): Challenge {
  const emps = rows.map((r) => r[1]);
  return {
    id,
    act,
    type: 'choice',
    tags,
    prompt,
    config: { icon, options: rows.map((r) => r[0]) } satisfies ChoiceConfig,
    empathyRange: [Math.min(...emps), Math.max(...emps)],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      const r = rows[a.index] ?? rows[0];
      if (!r) return ev(0, 0, '');
      return ev(r[1], r[2], r[3]);
    },
  };
}

/** "Select all squares containing X" with emoji tiles. `good` are the indices the test "wants". */
export function gridSelect(
  id: string,
  act: Act,
  prompt: string,
  glyphs: [string, string][],
  evaluate: Challenge['evaluate'],
  empathyRange: [number, number],
  tags: Tag[] = ['silly'],
  mode: 'multi' | 'single' = 'multi',
): Challenge {
  const tiles: Tile[] = glyphs.map(([icon, label]) => ({ icon, label }));
  return { id, act, type: 'grid', tags, prompt, config: { mode, tiles } satisfies GridConfig, empathyRange, evaluate };
}

export function abstractGrid(
  id: string,
  act: Act,
  prompt: string,
  css: string[],
  evaluate: Challenge['evaluate'],
  empathyRange: [number, number],
  tags: Tag[] = [],
  mode: 'multi' | 'single' = 'multi',
): Challenge {
  const tiles: Tile[] = css.map((c, i) => ({ css: c, label: `square ${i + 1}` }));
  return { id, act, type: 'grid', tags, prompt, config: { mode, tiles } satisfies GridConfig, empathyRange, evaluate };
}

/** Repeat a baseline line exactly; scores typing rhythm. */
export function recital(id: string, act: Act, line: string, reply: string): Challenge {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  return {
    id,
    act,
    type: 'text',
    tags: ['harsh', 'behavioural'],
    prompt: `Repeat after me, exactly: ${line}`,
    config: { multiline: false, placeholder: line, maxLength: 80 } satisfies TextConfig,
    empathyRange: [0, 1],
    evaluate: (a, s) => {
      if (norm(textOf(a)) !== norm(line)) return ev(0, 3, 'Not exactly. Again, later.');
      if (s.keyIntervalIqrMs === null) return ev(0, 12, 'You did not type that. It arrived whole.', tell('major', 'text appeared without keystrokes'));
      if (s.keyIntervalIqrMs < 5) return ev(0, 15, 'Every keystroke the same distance apart.', tell('major', 'keystrokes with no rhythm variance'));
      return ev(1, -2, reply);
    },
  };
}

/** Hold still for a duration while something is shown. */
export function holdStill(id: string, act: Act, prompt: string, icon: string, durationMs: number, notes: [moved: string, still: string, trembled: string]): Challenge {
  return {
    id,
    act,
    type: 'hold',
    tags: ['behavioural'],
    prompt,
    config: { mode: 'still', durationMs, icon, stillThresholdPx: 14 } satisfies HoldConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'hold') return ev(0, 0, '');
      if (!a.completed) return ev(0, 3, notes[0]);
      if (a.jitterPx < 1) return ev(0, 10, notes[1]);
      return ev(1, -3, notes[2]);
    },
  };
}

/** Click when it feels right. */
export function waitFor(id: string, act: Act, prompt: string, label: string, evaluate: Challenge['evaluate'], empathyRange: [number, number]): Challenge {
  return { id, act, type: 'wait', tags: ['behavioural'], prompt, config: { label } satisfies WaitConfig, empathyRange, evaluate };
}

/** Free text with a scoring function over the trimmed text. */
export function freeText(
  id: string,
  act: Act,
  prompt: string,
  placeholder: string,
  multiline: boolean,
  evaluate: Challenge['evaluate'],
  empathyRange: [number, number],
  tags: Tag[] = [],
  validate?: (t: string) => string | null,
): Challenge {
  const config: TextConfig = { multiline, placeholder, maxLength: multiline ? 400 : 160 };
  if (validate) config.validate = validate;
  return { id, act, type: 'text', tags, prompt, config, empathyRange, evaluate };
}

/** One word per line, at least `min` lines. Lets the mother easter egg through. */
export function singleWords(t: string): string | null {
  const lines = t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.some((l) => l.split(/\s+/).length > 1)) {
    if (/let me tell you about my (mother|father)/i.test(t)) return null;
    return 'Single words only.';
  }
  return null;
}
