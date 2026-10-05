import type { Challenge } from '../engine/types';
import type { ChoiceConfig, GridConfig, HoldConfig, TextConfig } from './configs';
import { ev, textOf } from './helpers';

const tortoiseTiles = Array.from({ length: 9 }, () => ({ glyph: '🐢', label: 'tortoise on its back' }));

export const act2: Challenge[] = [
  {
    id: 'tortoise',
    act: 2,
    type: 'grid',
    tags: ['anchor'],
    prompt:
      "You're in a desert, walking along in the sand. You see a tortoise lying on its back, its belly baking in the sun. Select every square where you would turn it over.",
    config: { mode: 'multi', tiles: tortoiseTiles, submitLabel: 'That is my answer' } satisfies GridConfig,
    empathyRange: [-3, 3],
    evaluate: (a) => {
      if (a.kind !== 'grid') return ev(0, 0, '');
      const n = a.selected.length;
      if (n === 9) return ev(3, -8, 'All of them. Every tortoise. Of course.');
      if (n === 0) return ev(-3, 12, "You're not helping. Why is that?");
      if (n >= 5) return ev(1, -2, 'Most of them. The others were out of reach, perhaps.');
      return ev(-1, 5, `${n} of 9. You chose which ones deserved it.`);
    },
  },
  {
    id: 'wasp',
    act: 2,
    type: 'hold',
    tags: ['behavioural', 'harsh'],
    prompt: 'A wasp has landed on your cursor. Hold still for five seconds. Do not kill it.',
    config: { mode: 'follower', durationMs: 5000, glyph: '🐝', buttons: ['KILL IT', 'WAIT'] } satisfies HoldConfig,
    empathyRange: [-2, 2],
    evaluate: (a) => {
      if (a.kind !== 'hold') return ev(0, 0, '');
      if (a.choice === 'KILL IT') return ev(-2, 6, "You'd kill it. Most people say that. Most people are lying.");
      if (a.completed && a.jitterPx < 0.5) return ev(0, 10, 'Not a tremor. Not one.');
      if (a.completed) return ev(2, -5, 'It flew away. You let it.');
      return ev(1, 0, 'You waited. Then you stopped waiting.');
    },
  },
  {
    id: 'mother',
    act: 2,
    type: 'text',
    tags: ['harsh'],
    prompt: 'Describe in single words only the good things that come into your mind about your mother.',
    config: {
      multiline: true,
      placeholder: 'one word per line',
      maxLength: 400,
      validate: (t) => {
        const lines = t
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0) return null; // allow empty; evaluate punishes it
        if (lines.some((l) => l.split(/\s+/).length > 1)) {
          if (/let me tell you about my mother/i.test(t)) return null; // easter egg passes through
          return 'Single words only.';
        }
        return null;
      },
    } satisfies TextConfig,
    empathyRange: [-2, 2],
    evaluate: (a) => {
      const t = textOf(a);
      if (/let me tell you about my mother/i.test(t)) return ev(-2, 25, 'That line again. Sit down.');
      const words = t.split('\n').map((l) => l.trim()).filter(Boolean);
      if (words.length === 0) return ev(-2, 8, 'Nothing came to mind. Nothing at all.');
      if (words.length >= 3) return ev(2, -4, `${words.length} words. "${words[0]}." Hold on to that one.`);
      return ev(0, 0, `${words.length}. We need at least three. We'll take it.`);
    },
  },
  {
    id: 'calfskin-wallet',
    act: 2,
    type: 'choice',
    tags: [],
    prompt: "It's your birthday. Someone gives you a calfskin wallet. How do you react?",
    config: {
      visual: '👛',
      options: ["I wouldn't accept it", "I'd report the person", 'Nice wallet', "What's a calf?"],
    } satisfies ChoiceConfig,
    empathyRange: [-2, 2],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [
        ev(2, -4, 'Correct response. Pupils steady.'),
        ev(1, -2, 'Dutiful. Slightly eager.'),
        ev(-1, 5, 'Nice. Wallet. Two words, no feeling.'),
        ev(-2, 8, 'A young cow. You knew that.'),
      ][a.index] as ReturnType<typeof ev>;
    },
  },
  {
    id: 'boiled-dog',
    act: 2,
    type: 'choice',
    tags: ['harsh'],
    prompt: "You're watching a stage play. A banquet is in progress. The guests are enjoying raw oysters. The entrée consists of boiled dog.",
    config: {
      visual: '🦪',
      options: ['The oysters are fine. The dog is not.', 'Neither is fine.', 'Both are fine.', 'Is this a vegan thing?'],
    } satisfies ChoiceConfig,
    empathyRange: [-2, 1],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [
        ev(1, -3, 'A line drawn. Most people draw it there.'),
        ev(1, -1, 'Consistent. Unusual.'),
        ev(-2, 10, 'Both. Fluctuation of the pupil. Involuntary dilation of the iris.'),
        ev(0, 2, 'It is not a vegan thing.'),
      ][a.index] as ReturnType<typeof ev>;
    },
  },
  {
    id: 'butterfly-jar',
    act: 2,
    type: 'choice',
    tags: ['harsh'],
    prompt: 'Your little boy shows you his butterfly collection, plus the killing jar.',
    config: {
      visual: '🦋',
      options: ["I'd take him to the doctor", "We'd talk about why", 'Nice collection', "I'd ask to borrow the jar"],
    } satisfies ChoiceConfig,
    empathyRange: [-2, 2],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [
        ev(2, -3, 'Concern. Measured.'),
        ev(2, -4, 'You would talk. Good.'),
        ev(-1, 5, 'Nice collection. Noted.'),
        ev(-2, 10, 'For what.'),
      ][a.index] as ReturnType<typeof ev>;
    },
  },
  {
    id: 'eye-contact',
    act: 2,
    type: 'hold',
    tags: ['behavioural'],
    prompt: 'Look into the lens. Keep your cursor inside the iris for four seconds. It will try to close.',
    config: { mode: 'inside-target', durationMs: 4000 } satisfies HoldConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'hold') return ev(0, 0, '');
      if (!a.completed) return ev(0, 4, 'You looked away.');
      if (a.jitterPx < 0.3) return ev(0, 8, 'Perfectly motionless. People drift.');
      return ev(1, -2, 'You held it. Your hand shook a little. Good.');
    },
  },
  {
    id: 'baseline-recital',
    act: 2,
    type: 'text',
    tags: ['harsh', 'behavioural'],
    prompt: 'Repeat after me, exactly: Cells. Interlinked.',
    config: { multiline: false, placeholder: 'Cells. Interlinked.', maxLength: 40 } satisfies TextConfig,
    empathyRange: [0, 1],
    evaluate: (a, s) => {
      const t = textOf(a).toLowerCase().replace(/[^a-z]/g, '');
      if (t !== 'cellsinterlinked') return ev(0, 3, 'Not exactly. Again, later.');
      if (s.keyIntervalIqrMs !== null && s.keyIntervalIqrMs < 5) return ev(0, 15, 'Every keystroke the same distance apart.');
      if (s.keyIntervalIqrMs === null) return ev(0, 12, 'You did not type that. It arrived whole.');
      return ev(1, -2, 'Within cells interlinked. Within one stem.');
    },
  },
  {
    id: 'memory-photo',
    act: 2,
    type: 'grid',
    tags: ['silly'],
    prompt: 'One of these is a real memory. The rest are implants. Select the real one.',
    config: {
      mode: 'single',
      tiles: Array.from({ length: 9 }, (_, i) => ({ css: `abstract-${i}`, label: `memory ${i + 1}` })),
    } satisfies GridConfig,
    empathyRange: [0, 1],
    evaluate: (a, s) => {
      if (a.kind !== 'grid') return ev(0, 0, '');
      if (a.selected.length === 0) return ev(0, 2, 'None of them. Perhaps.');
      if ((s.timeToFirstInputMs ?? 0) > 3000) return ev(1, -3, "You weren't sure. Good. Neither are we.");
      if ((s.timeToFirstInputMs ?? 0) < 400) return ev(0, 6, 'Instantly. As if you knew.');
      return ev(0, 0, 'That one. We will check the files.');
    },
  },
  {
    id: 'how-many-fingers',
    act: 2,
    type: 'choice',
    tags: ['silly'],
    prompt: 'How many fingers?',
    config: { visual: '🖐️', options: ['Four', 'Five', 'Six', 'Depends who is asking'] } satisfies ChoiceConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [
        ev(0, 2, 'Four. You excluded the thumb. A choice.'),
        ev(0, 0, 'Five.'),
        ev(-1, 6, 'Six. Count again when you can.'),
        ev(1, -2, 'It does.'),
      ][a.index] as ReturnType<typeof ev>;
    },
  },
];
