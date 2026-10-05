/** Drawing challenges: cursive writing with a finger, and sketch-the-animal. */
import { classify, drawStats } from '../engine/draw';
import type { Challenge } from '../engine/types';
import type { DrawConfig } from './configs';
import { templates } from '../data/templates';
import { ev } from './helpers';

/** A finger/mouse signature or word. Scores whether a hand actually drew it. */
function cursive(id: string, act: 2 | 3, prompt: string, word: string | undefined, reply: string): Challenge {
  const config: DrawConfig = { mode: 'cursive' };
  if (word) config.word = word;
  return {
    id,
    act,
    type: 'draw',
    tags: ['behavioural'],
    prompt,
    config,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      if (a.kind !== 'draw') return ev(0, 0, '');
      const s = drawStats(a.strokes, a.durationMs);
      if (s.pointCount < 4) return ev(-1, 6, 'You wrote nothing. A signature is a kind of promise.');
      if (s.wobble < 0.04 && s.speedVariation < 0.08) return ev(0, 14, 'No tremor, no hesitation. That is not a hand. That is a plotter.');
      if (a.pointerType === 'touch') return ev(1, -4, `${reply} Written with a finger. Good.`);
      if (s.meanSpeed > 4) return ev(0, 8, 'Drawn faster than a hand can move.');
      return ev(1, -2, reply);
    },
  };
}

/** Draw an animal; compared against Quick, Draw! templates. */
function sketch(id: string, act: 2 | 3, animal: string, glyph: string, prompt: string): Challenge {
  const config: DrawConfig = { mode: 'sketch', target: animal, glyph };
  return {
    id,
    act,
    type: 'draw',
    tags: ['behavioural'],
    prompt,
    config,
    empathyRange: [-1, 2],
    evaluate: (a) => {
      if (a.kind !== 'draw') return ev(0, 0, '');
      const s = drawStats(a.strokes, a.durationMs);
      if (s.pointCount < 6) return ev(-1, 5, 'A blank page. Nothing wanted to be drawn.');
      const result = classify(a.strokes, templates(), { topK: 3 });
      const matched = result.best === animal && result.score > 0.45;
      // behaviour: a machine draws fast, even-speed, barely wobbling
      if (s.wobble < 0.05 && s.speedVariation < 0.1) {
        return ev(0, 14, matched ? `A flawless ${animal}. Too flawless.` : 'Flawless strokes. No human draws like that.');
      }
      if (matched) return ev(2, -5, `That is a ${animal}. We recognised it. So would a child.`);
      if (result.best && result.score > 0.4) return ev(1, -2, `We thought it was a ${result.best}. Close enough. It had feeling.`);
      return ev(1, -1, 'We could not tell what it was. Neither could we, honestly. It is yours.');
    },
  };
}

export const actDraw: Challenge[] = [
  cursive('cursive-human', 2, "Write the word 'human' in cursive. Use your finger if you have a trackpad.", 'human', 'Human.'),
  cursive('cursive-sign', 3, 'Sign your name. Any name. The one you use when no one is watching.', undefined, 'Signed.'),
  cursive('cursive-sorry', 3, "Write 'sorry' in your own hand.", 'sorry', 'Sorry. We felt that.'),
  sketch('sketch-sheep', 2, 'sheep', '🐑', 'Draw a sheep. Electric or otherwise.'),
  sketch('sketch-cat', 2, 'cat', '🐈', 'Draw a cat from memory.'),
  sketch('sketch-turtle', 2, 'sea turtle', '🐢', 'Draw the tortoise. You remember the tortoise.'),
  sketch('sketch-bird', 3, 'bird', '🐦', 'Draw a bird. It hit the window earlier.'),
  sketch('sketch-fish', 3, 'fish', '🐟', 'Draw the fish from the bowl.'),
  sketch('sketch-dog', 3, 'dog', '🐕', 'Draw a dog. The old one, if you like.'),
];
