/** Act I additions: more calibration CAPTCHAs. */
import type { Challenge } from '../engine/types';
import type { CheckboxConfig, ChoiceConfig, SliderConfig, TextConfig } from './configs';
import { gridSelect, waitFor } from './factories';
import { ev, hasAny, textOf } from './helpers';

const sel = (a: Parameters<Challenge['evaluate']>[0]) => (a.kind === 'grid' ? a.selected : []);

export const act1Extra: Challenge[] = [
  gridSelect('grid-cats', 1, 'Select all squares containing cats.',
    [['🐱', 'cat'], ['🐈', 'cat'], ['🐯', 'tiger'], ['🦁', 'lion'], ['🐶', 'dog'], ['🐱', 'cat'], ['🐈‍⬛', 'black cat'], ['🧸', 'teddy bear'], ['🐱', 'cat']],
    (a) => {
      const s = sel(a);
      if (s.includes(2) || s.includes(3)) return ev(1, -1, 'A cat is a cat. Even the big ones.');
      if (s.includes(7)) return ev(1, 0, 'The bear is not a cat. It wanted to be included.');
      if (s.length === 5) return ev(0, 2, 'Exactly the cats. Nothing extra.');
      return ev(0, 0, 'Acceptable.');
    }, [0, 1]),
  gridSelect('grid-bridges', 1, 'Select all squares containing bridges.',
    [['🌉', 'bridge at night'], ['🎸', 'guitar'], ['🦷', 'tooth'], ['🌁', 'foggy bridge'], ['🃏', 'card'], ['🎻', 'violin'], ['🌉', 'bridge'], ['🪢', 'knot'], ['🤝', 'handshake']],
    (a) => {
      const s = sel(a);
      if (s.includes(8)) return ev(1, -2, 'A handshake. Yes. That is a bridge.');
      if (s.includes(1) || s.includes(5) || s.includes(2)) return ev(0, 0, 'Technically every one of those has a bridge.');
      return ev(0, 0, 'Noted.');
    }, [0, 1]),
  gridSelect('grid-boats', 1, 'Select all squares containing boats.',
    [['🚤', 'speedboat'], ['⛵', 'sailboat'], ['🛶', 'canoe'], ['🚢', 'ship'], ['🛟', 'life ring'], ['🦆', 'duck'], ['🚣', 'rowing'], ['🏄', 'surfer'], ['🛥️', 'yacht']],
    (a) => {
      const s = sel(a);
      if (s.includes(5)) return ev(1, -1, 'The duck floats. You gave it that.');
      if (s.includes(4)) return ev(1, 0, 'The life ring is not a boat. It is a promise of one.');
      return ev(0, 0, 'Boats confirmed.');
    }, [0, 1]),
  gridSelect('grid-bicycles', 1, 'Select all squares containing bicycles.',
    [['🚲', 'bicycle'], ['🛵', 'scooter'], ['🏍️', 'motorbike'], ['🦽', 'wheelchair'], ['🛴', 'kick scooter'], ['🚲', 'bicycle'], ['🦼', 'powered wheelchair'], ['🚲', 'bicycle'], ['⚙️', 'gear']],
    (a) => {
      const s = sel(a);
      if (s.includes(3) || s.includes(6)) return ev(1, -2, 'You included the wheelchair. Wheels and a person. Close enough.');
      if (s.length === 3 && [0, 5, 7].every((i) => s.includes(i))) return ev(0, 2, 'Exactly three. Machines count well.');
      return ev(0, 0, 'Fine.');
    }, [0, 1]),
  gridSelect('grid-storefronts', 1, 'Select all squares containing storefronts.',
    [['🏪', 'convenience store'], ['🏬', 'department store'], ['🏦', 'bank'], ['🏚️', 'derelict house'], ['🏠', 'house'], ['🛒', 'cart'], ['🏢', 'office'], ['🎪', 'circus'], ['🏥', 'hospital']],
    (a) => {
      const s = sel(a);
      if (s.includes(3)) return ev(1, -1, 'The derelict one. It was a shop once. You remembered for it.');
      if (s.includes(7)) return ev(0, 0, 'The circus sells something. Fair.');
      return ev(0, 0, 'Storefronts confirmed.');
    }, [0, 1]),
  gridSelect('grid-chimneys', 1, 'Select all squares containing chimneys.',
    [['🏭', 'factory'], ['🏠', 'house'], ['🎅', 'santa'], ['🧱', 'bricks'], ['💨', 'smoke'], ['⛲', 'fountain'], ['🏡', 'cottage'], ['🔥', 'fire'], ['🪵', 'logs']],
    (a) => {
      const s = sel(a);
      if (s.includes(2)) return ev(1, -1, 'He knows where the chimneys are.');
      if (s.includes(4)) return ev(0, 0, 'The smoke implies the chimney. Deductive.');
      return ev(0, 0, 'Noted.');
    }, [0, 1]),
  gridSelect('grid-buses', 1, 'Select all squares containing buses.',
    [['🚌', 'bus'], ['🚍', 'oncoming bus'], ['🚐', 'minibus'], ['🚑', 'ambulance'], ['🚒', 'fire engine'], ['🚚', 'truck'], ['🚌', 'bus'], ['🚎', 'trolleybus'], ['🛻', 'pickup']],
    (a) => {
      const s = sel(a);
      if (s.includes(3)) return ev(0, 1, 'The ambulance is not a bus. Someone in it hopes you were quicker than this.');
      if ((a.kind === 'grid' ? a.selected.length : 0) === 0) return ev(0, 2, 'No buses. You are certain.');
      return ev(0, 0, 'Buses confirmed.');
    }, [0, 0]),
  gridSelect('grid-hydrants', 1, 'Select all squares containing fire hydrants.',
    [['🧯', 'extinguisher'], ['🚒', 'fire engine'], ['🔥', 'fire'], ['🪣', 'bucket'], ['💧', 'drop'], ['🚰', 'tap'], ['🧯', 'extinguisher'], ['🌊', 'wave'], ['🐕', 'dog']],
    (a) => {
      const s = sel(a);
      if (s.includes(8)) return ev(1, -2, 'The dog knows where the hydrant is.');
      if (s.length === 0) return ev(0, 0, 'There were none. Correct, and a little lonely.');
      return ev(0, 1, 'None of those were hydrants. You chose anyway.');
    }, [0, 1]),
  {
    id: 'distorted-tortoise',
    act: 1,
    type: 'text',
    tags: ['silly'],
    prompt: 'Type the characters you see.',
    config: { multiline: false, placeholder: 'characters', distortedWord: 'TORTOISE', maxLength: 24 } satisfies TextConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      const t = textOf(a).toLowerCase();
      if (t === 'tortoise') return ev(1, 0, 'Tortoise. Remember that word.');
      if (t.length === 0) return ev(-1, 5, 'Nothing.');
      return ev(0, 1, `"${t.slice(0, 24)}". Close.`);
    },
  },
  {
    id: 'distorted-baseline',
    act: 1,
    type: 'text',
    tags: ['silly'],
    prompt: 'Type the characters you see.',
    config: { multiline: false, placeholder: 'characters', distortedWord: 'BASELINE', maxLength: 24 } satisfies TextConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      const t = textOf(a).toLowerCase();
      if (t === 'baseline') return ev(1, 0, 'Baseline. That is what we are measuring.');
      if (t.length === 0) return ev(-1, 5, 'Nothing.');
      return ev(0, 1, `"${t.slice(0, 24)}". We will accept it.`);
    },
  },
  {
    id: 'audio-heartbeat',
    act: 1,
    type: 'text',
    tags: ['silly'],
    prompt: 'Press play. Count the beats.',
    config: { multiline: false, placeholder: 'how many', audio: 'heartbeat', maxLength: 40 } satisfies TextConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      const t = textOf(a).toLowerCase();
      if (t === '7' || t === 'seven') return ev(0, 0, 'Seven. Correct.');
      if (hasAny(t, ['lost', "don't know", 'dont know', 'many', 'mine'])) return ev(1, -2, 'You lost count. Hearts do that to people.');
      if (t.length === 0) return ev(-1, 4, 'Nothing. Did you play it?');
      return ev(0, 1, `${t.slice(0, 12)}. It was seven. We counted.`);
    },
  },
  {
    id: 'audio-rain',
    act: 1,
    type: 'text',
    tags: ['silly'],
    prompt: 'Press play. What is it?',
    config: { multiline: false, placeholder: 'what you heard', audio: 'rain', maxLength: 80 } satisfies TextConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      const t = textOf(a);
      if (hasAny(t, ['rain', 'storm', 'shower', 'window', 'roof', 'sea', 'waves'])) return ev(1, -2, 'Rain. On a window, if you were listening closely.');
      if (hasAny(t, ['noise', 'static', 'white', 'hiss'])) return ev(0, 4, 'Static. Technically.');
      if (t.length === 0) return ev(-1, 4, 'Nothing.');
      return ev(0, 0, 'We heard rain. You heard something else. That is allowed.');
    },
  },
  {
    id: 'i-am-a-robot',
    act: 1,
    type: 'checkbox',
    tags: ['silly'],
    prompt: 'Confirm the following.',
    config: { label: 'I am a robot', dodges: 0 } satisfies CheckboxConfig,
    empathyRange: [0, 0],
    evaluate: (a) => (a.kind === 'checkbox' && a.checked ? ev(0, 15, 'Thank you for your honesty.') : ev(0, -1, 'You declined. Noted either way.')),
  },
  {
    id: 'i-consent',
    act: 1,
    type: 'checkbox',
    tags: ['behavioural'],
    prompt: 'Consent is required to continue.',
    config: { label: 'I consent to being measured', dodges: 1 } satisfies CheckboxConfig,
    empathyRange: [0, 0],
    evaluate: (a) => (a.kind === 'checkbox' && a.checked ? ev(0, 0, 'Consent recorded. The box apologises for moving.') : ev(0, 3, 'No consent. We measured anyway. Sorry.')),
  },
  {
    id: 'human-probably',
    act: 1,
    type: 'checkbox',
    tags: ['silly', 'behavioural'],
    prompt: 'Check the box that applies.',
    config: { label: "I'm human, probably", dodges: 3 } satisfies CheckboxConfig,
    empathyRange: [0, 1],
    evaluate: (a, s) => {
      if (a.kind !== 'checkbox' || !a.checked) return ev(0, 2, 'Not even probably.');
      if (s.directionChanges > 8) return ev(1, -3, 'You chased it three times. Only a person would bother.');
      return ev(0, 0, 'Probably. We work with probably.');
    },
  },
  {
    id: 'how-many-lights',
    act: 1,
    type: 'choice',
    tags: ['silly'],
    prompt: 'How many traffic lights?',
    config: { visual: '🚦🚦🚦🚦', options: ['Three', 'Four', 'Five', 'Too many'] } satisfies ChoiceConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [ev(0, 3, 'Three. There were four.'), ev(0, 0, 'Four.'), ev(0, 3, 'Five. Count again later.'), ev(1, -1, 'It is a lot of lights.')][a.index] ?? ev(0, 0, '');
    },
  },
  {
    id: 'what-colour',
    act: 1,
    type: 'choice',
    tags: ['silly'],
    prompt: 'What colour is this console?',
    config: { options: ['Amber', 'Orange', 'Yellow', 'More of a feeling than a colour'] } satisfies ChoiceConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [ev(0, 0, 'Amber. Correct.'), ev(0, 1, 'Orange. Close.'), ev(0, 1, 'Yellow. Generous.'), ev(1, -2, 'Yes.')][a.index] ?? ev(0, 0, '');
    },
  },
  {
    id: 'which-is-the-robot',
    act: 1,
    type: 'choice',
    tags: ['silly'],
    prompt: 'Which one is the robot?',
    config: {
      options: ['Robot', 'Person', 'Tortoise', 'Mirror'],
      tiles: [{ glyph: '🤖', label: 'robot' }, { glyph: '🧑', label: 'person' }, { glyph: '🐢', label: 'tortoise' }, { css: 'mirror', label: 'mirror' }],
    } satisfies ChoiceConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [ev(0, 0, 'The obvious one.'), ev(-1, 4, 'The person. Interesting.'), ev(0, 1, 'The tortoise is never the robot.'), ev(1, 2, 'The mirror. Noted.')][a.index] ?? ev(0, 0, '');
    },
  },
  {
    id: 'slider-volume',
    act: 1,
    type: 'slider',
    tags: ['behavioural'],
    prompt: 'Slide to the volume at which you would like to be spoken to.',
    config: { label: 'Volume' } satisfies SliderConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'slider') return ev(0, 0, '');
      if (a.durationMs < 150) return ev(0, 8, 'That was not a slide.');
      if (a.value < 0.3) return ev(1, -1, 'Quietly. Understood.');
      if (a.value > 0.9) return ev(0, 1, 'Loudly, then.');
      return ev(1, 0, 'Noted.');
    },
  },
  {
    id: 'slider-how-long',
    act: 1,
    type: 'slider',
    tags: ['silly'],
    prompt: 'Slide to how long you feel you have been here.',
    config: { label: 'Forever →' } satisfies SliderConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'slider') return ev(0, 0, '');
      if (a.value > 0.9) return ev(1, -1, 'Forever. We know.');
      return ev(0, 0, 'It has been longer than that.');
    },
  },
  waitFor('wait-blink', 1, 'Click when you next blink.', 'Blinked', (a) => {
    if (a.kind !== 'wait') return ev(0, 0, '');
    if (a.waitedMs < 400) return ev(0, 4, 'Already? You were not blinking. You were clicking.');
    if (a.waitedMs > 15000) return ev(1, 0, 'A long time without blinking. Your eyes must be dry.');
    return ev(1, -1, 'Noted. Blink again whenever you like.');
  }, [0, 1]),
];
