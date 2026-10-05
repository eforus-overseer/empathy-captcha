import type { Challenge } from '../engine/types';
import type { CheckboxConfig, GridConfig, SliderConfig, TextConfig } from './configs';
import { ev, hasAny, textOf } from './helpers';

export const act1: Challenge[] = [
  {
    id: 'not-a-robot',
    act: 1,
    type: 'checkbox',
    tags: ['anchor', 'behavioural'],
    prompt: 'Before we begin. Confirm you are not a robot.',
    config: { label: "I'm not a robot", dodges: 2 } satisfies CheckboxConfig,
    empathyRange: [0, 0],
    evaluate: (a, s) => {
      if (a.kind !== 'checkbox' || !a.checked) return ev(0, 5, 'You did not confirm. Noted.');
      if (s.efficiency !== null && s.efficiency > 0.97) return ev(0, 8, 'A very direct hand.');
      if (s.directionChanges > 6) return ev(0, -3, 'You chased it. Good.');
      return ev(0, 0, 'Confirmed. For now.');
    },
  },
  {
    id: 'traffic-lights',
    act: 1,
    type: 'grid',
    tags: ['silly'],
    prompt: 'Select all squares containing traffic lights.',
    config: {
      mode: 'multi',
      tiles: [
        { glyph: '🚦', label: 'traffic light' },
        { glyph: '🏠', label: 'house' },
        { glyph: '🚦', label: 'traffic light' },
        { glyph: '🌅', label: 'sunset' },
        { glyph: '🌳', label: 'tree' },
        { glyph: '🚦', label: 'traffic light' },
        { glyph: '🚗', label: 'car' },
        { glyph: '🚦', label: 'traffic light' },
        { glyph: '🧯', label: 'extinguisher' },
      ],
    } satisfies GridConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'grid') return ev(0, 0, '');
      const lights = [0, 2, 5, 7];
      const pickedSunset = a.selected.includes(3);
      const allLights = lights.every((i) => a.selected.includes(i));
      if (pickedSunset) return ev(1, -2, 'The sunset was not a traffic light. You selected it anyway. Interesting.');
      if (allLights && a.selected.length === 4) return ev(0, 3, 'Precise. Machines are precise.');
      return ev(0, 0, 'Acceptable.');
    },
  },
  {
    id: 'crosswalk',
    act: 1,
    type: 'grid',
    tags: ['silly'],
    prompt: 'Select all squares containing a crosswalk.',
    config: {
      mode: 'multi',
      tiles: [
        { glyph: '🦓', label: 'zebra' },
        { glyph: '🎹', label: 'piano' },
        { glyph: '📊', label: 'bar chart' },
        { glyph: '🪜', label: 'ladder' },
        { glyph: '🧻', label: 'paper' },
        { glyph: '🏁', label: 'checkered flag' },
        { glyph: '🎼', label: 'sheet music' },
        { glyph: '🧮', label: 'abacus' },
        { glyph: '🪟', label: 'window' },
      ],
    } satisfies GridConfig,
    empathyRange: [0, 1],
    evaluate: (a, s) => {
      if (a.kind !== 'grid') return ev(0, 0, '');
      if (a.selected.length === 0) return ev(0, 2, 'None. You are certain. Certainty is rare in people.');
      if ((s.timeToFirstInputMs ?? 0) > 2500) return ev(1, -2, 'You hesitated. There were no crosswalks. You looked anyway.');
      return ev(0, 0, 'A crosswalk is where you decide it is.');
    },
  },
  {
    id: 'distorted-text',
    act: 1,
    type: 'text',
    tags: ['silly'],
    prompt: 'Type the characters you see.',
    config: {
      multiline: false,
      placeholder: 'characters',
      distortedWord: 'EMPATHY',
      maxLength: 24,
    } satisfies TextConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      const t = textOf(a).toLowerCase();
      if (t === 'empathy') return ev(1, 0, 'Correct. Can you spell it without reading it?');
      if (t === 'empty') return ev(-1, 4, 'Empty. A telling misread.');
      if (t.length === 0) return ev(-1, 5, 'Nothing. We will come back to that.');
      return ev(0, 1, `"${t.slice(0, 24)}". Close enough for a person.`);
    },
  },
  {
    id: 'audio-challenge',
    act: 1,
    type: 'text',
    tags: ['silly'],
    prompt: 'Press play. Type what you hear.',
    config: {
      multiline: false,
      placeholder: 'what you heard',
      audio: 'whale',
      maxLength: 80,
    } satisfies TextConfig,
    empathyRange: [-1, 1],
    evaluate: (a) => {
      const t = textOf(a);
      if (t.length === 0) return ev(-1, 3, 'You heard nothing, or typed nothing. Both are answers.');
      if (hasAny(t, ['whale', 'sad', 'lonely', 'cry', 'moan', 'sing', 'ocean', 'sea', 'alone', 'song']))
        return ev(1, -3, 'Yes. It was alone too.');
      if (hasAny(t, ['noise', 'static', 'tone', 'beep', 'sine', 'hz', 'frequency']))
        return ev(0, 4, 'Technically accurate.');
      return ev(0, 0, 'We heard it differently. That is allowed.');
    },
  },
  {
    id: 'slider-puzzle',
    act: 1,
    type: 'slider',
    tags: ['behavioural'],
    prompt: 'Slide the piece into place to complete the puzzle.',
    config: { label: 'Slide to complete' } satisfies SliderConfig,
    empathyRange: [0, 1],
    evaluate: (a, s) => {
      if (a.kind !== 'slider') return ev(0, 0, '');
      if (a.value < 0.95) return ev(0, 2, 'Incomplete. The heart does not fit.');
      if (a.durationMs < 150) return ev(0, 10, 'That was not a drag. That was a teleport.');
      if (s.efficiency !== null && s.efficiency > 0.995) return ev(0, 5, 'A perfectly straight slide.');
      return ev(1, 0, 'It fits. It usually does, eventually.');
    },
  },
];
