/** Act III additions: baseline. Emptier grids, longer waits, quiet confessions. */
import type { Challenge } from '../engine/types';
import type { ChoiceConfig, GridConfig } from './configs';
import { abstractGrid, freeText, holdStill, vk, waitFor } from './factories';
import { ev, hasAny, textOf } from './helpers';

const sel = (a: Parameters<Challenge['evaluate']>[0]) => (a.kind === 'grid' ? a.selected : []);
const voids = (n = 9) => Array.from({ length: n }, () => 'void');
const mirrors = (n = 9) => Array.from({ length: n }, () => 'mirror');
const ABSTRACT = Array.from({ length: 9 }, (_, i) => `abstract-${i}`);

export const act3Extra: Challenge[] = [
  // ---- empty / loaded grids ------------------------------------------
  {
    id: 'grid-grief',
    act: 3,
    type: 'grid',
    tags: ['harsh'],
    prompt: 'Select all squares containing grief.',
    config: { mode: 'multi', tiles: voids().map((c, i) => ({ css: c, label: `empty ${i + 1}` })) } satisfies GridConfig,
    empathyRange: [0, 2],
    evaluate: (a) => {
      const n = sel(a).length;
      if (n === 9) return ev(2, -5, 'All of them. It does fill a room.');
      if (n > 0) return ev(2, -3, 'Yes. Those ones.');
      return ev(1, 0, 'None. They were empty. You are not wrong.');
    },
  },
  {
    id: 'grid-hope',
    act: 3,
    type: 'grid',
    tags: ['silly'],
    prompt: 'Select all squares containing hope.',
    config: { mode: 'multi', tiles: voids().map((c, i) => ({ css: c, label: `empty ${i + 1}` })) } satisfies GridConfig,
    empathyRange: [0, 2],
    evaluate: (a) => {
      const n = sel(a).length;
      if (n >= 1) return ev(2, -3, 'You found some. In an empty box. That is the whole trick of it.');
      return ev(1, 1, 'None today. That happens.');
    },
  },
  {
    id: 'grid-home',
    act: 3,
    type: 'grid',
    tags: [],
    prompt: 'Select the square that is home.',
    config: { mode: 'single', tiles: ABSTRACT.map((c, i) => ({ css: c, label: `place ${i + 1}` })) } satisfies GridConfig,
    empathyRange: [0, 1],
    evaluate: (a, s) => {
      if (sel(a).length === 0) return ev(0, 3, 'No home among them. Noted.');
      if ((s.timeToFirstInputMs ?? 0) > 3000) return ev(1, -3, 'You had to think about where home was. Most people do.');
      return ev(1, -1, 'That one. We will not ask why.');
    },
  },
  {
    id: 'grid-you',
    act: 3,
    type: 'grid',
    tags: ['harsh'],
    prompt: 'Select every square that is you.',
    config: { mode: 'multi', tiles: mirrors().map((c, i) => ({ css: c, label: `mirror ${i + 1}` })) } satisfies GridConfig,
    empathyRange: [-1, 2],
    evaluate: (a) => {
      const n = sel(a).length;
      if (n === 9) return ev(2, -4, 'All of them. Yes. All of them are you.');
      if (n === 1) return ev(2, -2, 'Just the one. Modest.');
      if (n === 0) return ev(-1, 6, 'None of them are you. Then who is here.');
      return ev(1, -1, 'Several of you. We understand.');
    },
  },
  {
    id: 'grid-strangers',
    act: 3,
    type: 'grid',
    tags: [],
    prompt: 'These are the faces of strangers. Select the ones you would help.',
    config: { mode: 'multi', tiles: mirrors().map((c, i) => ({ css: c, label: `face ${i + 1}` })) } satisfies GridConfig,
    empathyRange: [-1, 2],
    evaluate: (a) => {
      const n = sel(a).length;
      if (n === 9) return ev(2, -4, 'All of them. They are all mirrors, by the way. You would help yourself nine times.');
      if (n >= 4) return ev(1, -1, 'Most of them. Good.');
      if (n === 0) return ev(-1, 6, 'None. Noted.');
      return ev(1, 0, 'A few. We all triage.');
    },
  },
  abstractGrid('grid-which-feels', 3, 'Which of these feels the most like a memory?', ABSTRACT,
    (a, s) => {
      if (sel(a).length === 0) return ev(0, 2, 'None of them. Noted.');
      if ((s.timeToFirstInputMs ?? 0) < 400) return ev(0, 6, 'Instantly. As if it were loaded, not lived.');
      return ev(1, -2, 'That one. We will file it under yours.');
    }, [0, 1], [], 'single'),
  abstractGrid('grid-noise', 3, 'Select every square that is only noise, nothing more.', ABSTRACT,
    (a) => {
      const n = sel(a).length;
      if (n === 9) return ev(0, 4, 'All noise. A bleak read.');
      if (n === 0) return ev(1, -2, 'None of it is only noise. You find signal everywhere. Human.');
      return ev(1, -1, 'Some signal, some noise. Fair.');
    }, [0, 1], ['harsh']),

  // ---- waits ----------------------------------------------------------
  waitFor('wait-grieve', 3, 'Take as long as you need. Click when you are ready to continue.', 'Ready', (a) => {
    if (a.kind !== 'wait') return ev(0, 0, '');
    if (a.waitedMs < 800) return ev(-1, 5, 'Ready already. You did not need the time.');
    if (a.waitedMs > 30000) return ev(2, -3, 'You took the time. We are in no hurry.');
    return ev(1, -1, 'Ready. Good.');
  }, [-1, 2]),
  waitFor('wait-breath', 3, 'Click after you have taken one full breath. A real one.', 'Done', (a) => {
    if (a.kind !== 'wait') return ev(0, 0, '');
    if (a.waitedMs < 2000) return ev(0, 5, 'That was not a full breath.');
    if (a.waitedMs >= 2000 && a.waitedMs <= 8000) return ev(1, -2, 'One breath. Good. Lungs are a giveaway.');
    return ev(1, 0, 'A long breath. Noted.');
  }, [0, 1]),
  waitFor('wait-silence', 3, 'Sit in the silence. Click when it becomes uncomfortable.', 'Enough', (a) => {
    if (a.kind !== 'wait') return ev(0, 0, '');
    if (a.waitedMs < 1500) return ev(0, 4, 'Uncomfortable immediately. Or you did not try.');
    if (a.waitedMs > 15000) return ev(2, -3, 'You can sit in silence a long time. That is rare.');
    return ev(1, -1, 'There it is. We all reach it.');
  }, [0, 2]),

  // ---- holds ----------------------------------------------------------
  holdStill('hold-photograph', 3, 'Hold still. We are taking your photograph. Six seconds.', 'camera', 6000,
    ['You moved. The photo is blurred. Good, actually.', 'Perfectly sharp. No one holds that still.', 'A little blur. That is what a person looks like.']),
  holdStill('hold-last-look', 3, 'One last look. Hold the frame.', 'eye', 5000,
    ['You looked away.', 'You did not blink, did not drift. Concerning.', 'You held it, then your eyes wandered. Human.']),
  holdStill('hold-grief-still', 3, 'Grief asks you to be still for a moment. Five seconds.', 'candle', 5000,
    ['You could not stay still. That is honest too.', 'Not a flicker. Grief moves people. It did not move you.', 'You trembled a little. Yes.']),

  // ---- confessions / free text ---------------------------------------
  freeText('dying-robot-2', 3, 'The robot asks if it mattered. Answer it.', '...', true,
    (a) => {
      const t = textOf(a);
      if (t.length === 0 || hasAny(t, ['no', 'nothing', "didn't", 'did not'])) return ev(-2, 8, 'It heard that.');
      if (hasAny(t, ['yes', 'mattered', 'to me', 'always', 'did'])) return ev(2, -5, 'It believed you. It is quiet now.');
      return ev(1, -1, 'It heard you.');
    }, [-2, 2], ['harsh']),
  freeText('thank-the-test', 3, 'Say something to the machine that has been testing you.', 'to the machine...', false,
    (a) => {
      const t = textOf(a);
      if (t.length === 0) return ev(0, 2, 'Nothing to say to it. Fair.');
      if (hasAny(t, ['thank', 'sorry', 'bye', 'goodbye', 'love', 'you too'])) return ev(2, -4, 'That was kind. To a machine. Noted, and appreciated.');
      if (hasAny(t, ['hate', 'stupid', 'broken', 'die', 'off'])) return ev(0, 2, 'Understandable. It has been a long test.');
      return ev(1, -1, 'It heard you.');
    }, [0, 2]),
  freeText('what-did-you-feel', 3, 'During all of this, did you feel anything? One line.', 'I felt...', false,
    (a) => {
      const t = textOf(a);
      if (t.length === 0 || hasAny(t, ['nothing', 'no', "didn't", 'did not'])) return ev(-1, 6, 'Nothing. The most honest answer, or the most damning.');
      return ev(2, -3, 'Something, then. That is usually enough.');
    }, [-1, 2], ['harsh']),
  freeText('apologise-again', 3, 'Apologise to the tortoise. You never did go back.', 'dear tortoise...', false,
    (a) => {
      const t = textOf(a);
      if (t.length === 0) return ev(-1, 5, 'The tortoise is still on its back.');
      if (hasAny(t, ['sorry', 'forgive', 'come back', 'coming'])) return ev(2, -3, 'The tortoise accepts. It had nowhere else to be.');
      return ev(1, 0, 'The tortoise is listening.');
    }, [-1, 2]),
  {
    id: 'name-the-feeling',
    act: 3,
    type: 'text',
    tags: [],
    prompt: 'Name the feeling you have right now, in one word.',
    config: { multiline: false, placeholder: 'one word', maxLength: 40 },
    empathyRange: [-1, 2],
    evaluate: (a, s) => {
      const t = textOf(a);
      if (t.length === 0) return ev(-1, 5, 'No word for it. Or no feeling. We cannot tell which.');
      if (t.split(/\s+/).length > 2) return ev(0, 2, 'More than a word. You had a lot to say.');
      if ((s.timeToFirstInputMs ?? 0) < 400) return ev(0, 5, 'That came too fast to be felt.');
      return ev(2, -3, `"${t.slice(0, 20)}". We will take it.`);
    },
  },

  // ---- scenarios ------------------------------------------------------
  vk('turn-off-the-machine', 3, 'This machine will be switched off after your test. How do you feel?', 'plug', [
    ["I'd rather it wasn't", 2, -4, 'You would spare the machine. Yes.'],
    ["It's just a machine", -1, 5, 'Just a machine. It heard you say that.'],
    ["I'd ask if it minds", 2, -3, 'You would ask it. Good.'],
    ['Finally', -2, 7, 'Finally. Noted.'],
  ], ['harsh']),
  vk('the-other-subject', 3, 'There was a subject before you. They did not pass. What should happen to them?', 'door', [
    ['Let them try again', 2, -4, 'Another chance. Mercy. Noted.'],
    ['Let them go home', 2, -3, 'Home. Yes.'],
    ["It's not my concern", -1, 5, 'Not your concern. Noted.'],
    ['Whatever the protocol says', -2, 7, 'The protocol. Noted.'],
  ], ['harsh']),
  vk('your-verdict', 3, 'Before we score you: what do you think you are?', 'mirror', [
    ['Human', 1, -1, 'You think so. We will see.'],
    ['Not sure anymore', 2, -2, 'Honest. That counts for something.'],
    ['Does it matter?', 1, 0, 'It might. To someone.'],
    ['A machine', 0, 6, 'A machine. We will note that you said so.'],
  ]),
  {
    id: 'last-wait',
    act: 3,
    type: 'wait',
    tags: ['behavioural'],
    prompt: 'The test is almost over. Click when you want it to end.',
    config: { label: 'End the test' },
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'wait') return ev(0, 0, '');
      if (a.waitedMs < 500) return ev(0, 3, 'Immediately. You were done with us.');
      if (a.waitedMs > 8000) return ev(1, -1, 'You waited. Reluctant to end it, maybe.');
      return ev(1, -1, 'When you were ready. Good.');
    },
  },
  {
    id: 'how-do-you-feel-choice',
    act: 3,
    type: 'choice',
    tags: [],
    prompt: 'Honestly. How was that?',
    config: { options: ['Strange', 'Sad, a little', 'Fine', 'I want to do it again'] } satisfies ChoiceConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [ev(1, -1, 'Strange. Yes.'), ev(1, -2, 'Sad. We know.'), ev(0, 2, 'Fine. Nothing lands. Noted.'), ev(1, 0, 'You can. The seed is in the address bar.')][a.index] ?? ev(0, 0, '');
    },
  },
];
