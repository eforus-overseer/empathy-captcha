import type { Challenge } from '../engine/types';
import type { CheckboxConfig, ChoiceConfig, GridConfig, HoldConfig, TextConfig, WaitConfig } from './configs';
import { ev, hasAny, isNearRoundSecond, textOf } from './helpers';

export const act3: Challenge[] = [
  {
    id: 'onion',
    act: 3,
    type: 'hold',
    tags: ['behavioural', 'silly'],
    prompt: 'Hold your cursor perfectly still while we show you an onion.',
    config: { mode: 'still', durationMs: 6000, glyph: '🧅', stillThresholdPx: 14 } satisfies HoldConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'hold') return ev(0, 0, '');
      if (!a.completed) return ev(0, 3, 'You moved. The onion was too much.');
      if (a.jitterPx < 1) return ev(0, 10, 'Perfectly still. Nothing in you reacted.');
      return ev(1, -3, 'You trembled. That is the correct response to an onion.');
    },
  },
  {
    id: 'loneliness',
    act: 3,
    type: 'grid',
    tags: ['harsh'],
    prompt: 'Select all squares containing loneliness.',
    config: { mode: 'multi', tiles: Array.from({ length: 9 }, () => ({ css: 'void', label: 'empty square' })) } satisfies GridConfig,
    empathyRange: [0, 2],
    evaluate: (a) => {
      if (a.kind !== 'grid') return ev(0, 0, '');
      if (a.selected.length === 9) return ev(2, -6, 'All of them. Yes.');
      if (a.selected.length > 0) return ev(2, -3, 'Yes. Those.');
      return ev(1, 0, 'Correct. There was nothing in them.');
    },
  },
  {
    id: 'wait-feel',
    act: 3,
    type: 'wait',
    tags: ['behavioural'],
    prompt: 'Click when it feels like enough time has passed.',
    config: { label: 'Now' } satisfies WaitConfig,
    empathyRange: [-2, 1],
    evaluate: (a) => {
      if (a.kind !== 'wait') return ev(0, 0, '');
      const s = a.waitedMs / 1000;
      if (isNearRoundSecond(a.waitedMs)) return ev(0, 8, `${s.toFixed(3)} seconds. To the millisecond.`);
      if (a.waitedMs < 1000) return ev(-2, 6, 'Immediately. It had not felt like anything yet.');
      if (a.waitedMs > 20000) return ev(1, 0, `${s.toFixed(1)} seconds. You have time.`);
      return ev(1, -2, `${s.toFixed(1)} seconds. That felt right to you.`);
    },
  },
  {
    id: 'dying-robot',
    act: 3,
    type: 'text',
    tags: ['harsh'],
    prompt: 'A robot is dying. It can hear you. Say something.',
    config: { multiline: true, placeholder: '...', maxLength: 280 } satisfies TextConfig,
    empathyRange: [-2, 2],
    evaluate: (a) => {
      const t = textOf(a);
      if (t.length === 0 || hasAny(t, ['nothing', 'no comment'])) return ev(-2, 8, 'Nothing. It heard that.');
      if (hasAny(t, ['sorry', 'goodbye', 'thank', 'love', 'here', 'with you', 'not alone', 'rest']))
        return ev(2, -5, 'It heard you. It is quiet now.');
      return ev(1, -1, 'It heard you.');
    },
  },
  {
    id: 'click-the-human',
    act: 3,
    type: 'grid',
    tags: ['silly'],
    prompt: 'Select all squares containing a human.',
    config: { mode: 'multi', tiles: Array.from({ length: 9 }, () => ({ css: 'mirror', label: 'mirror' })) } satisfies GridConfig,
    empathyRange: [-1, 2],
    evaluate: (a) => {
      if (a.kind !== 'grid') return ev(0, 0, '');
      if (a.selected.length === 1) return ev(2, -4, 'You found one.');
      if (a.selected.length > 1) return ev(1, 0, 'Several. All the same one.');
      return ev(-1, 6, 'None. Look again.');
    },
  },
  {
    id: 'apologize-cursor',
    act: 3,
    type: 'text',
    tags: ['silly'],
    prompt: 'You have been dragging your cursor around for several minutes. Apologise to it.',
    config: { multiline: false, placeholder: 'dear cursor...', maxLength: 200 } satisfies TextConfig,
    empathyRange: [-1, 2],
    evaluate: (a) => {
      const t = textOf(a);
      if (t.length === 0) return ev(-1, 4, 'The cursor noticed.');
      if (hasAny(t, ['sorry', 'apolog', 'forgive'])) return ev(2, -3, 'Accepted. It says.');
      return ev(1, 0, 'The cursor is considering it.');
    },
  },
  {
    id: 'sound-of-rain',
    act: 3,
    type: 'choice',
    tags: ['silly'],
    prompt: 'Which one is the sound of rain?',
    config: {
      options: ['A', 'B', 'C', 'D'],
      tiles: [
        { css: 'abstract-2', label: 'A' },
        { css: 'abstract-5', label: 'B' },
        { css: 'abstract-7', label: 'C' },
        { css: 'abstract-1', label: 'D' },
      ],
    } satisfies ChoiceConfig,
    empathyRange: [0, 1],
    evaluate: (_a, s) => {
      if ((s.timeToFirstInputMs ?? 1000) < 300) return ev(0, 5, 'You did not listen.');
      return ev(1, -1, 'Yes. That one.');
    },
  },
  {
    id: 'not-sure-anymore',
    act: 3,
    type: 'checkbox',
    tags: ['anchor'],
    prompt: 'Last one.',
    config: { label: "I'm not sure anymore", dodges: 0 } satisfies CheckboxConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'checkbox' || !a.checked) return ev(0, 0, 'You did not check it. Very sure, then.');
      return ev(1, -2, 'Neither are we. Test complete.');
    },
  },
];
