/** Act II additions: Voight-Kampff scenarios, empathy grids, recitals, holds. */
import type { Challenge } from '../engine/types';
import type { ChoiceConfig, HoldConfig } from './configs';
import { freeText, gridSelect, holdStill, recital, singleWords, vk } from './factories';
import { ev, hasAny, textOf } from './helpers';

const sel = (a: Parameters<Challenge['evaluate']>[0]) => (a.kind === 'grid' ? a.selected : []);
const count = (s: number[], want: number[]) => want.filter((i) => s.includes(i)).length;

export const act2Extra: Challenge[] = [
  // ---- scenarios -------------------------------------------------------
  vk('bearskin-rug', 2, "A friend shows you their new home. The living room floor is a bearskin rug.", 'bear', [
    ["I'd leave", 2, -3, 'You would leave. Over a rug. Good.'],
    ["I wouldn't stand on it", 1, -1, 'You would step around it. Noted.'],
    ['Soft', -1, 5, 'Soft. One word, no bear.'],
    ['Was it a big bear?', -2, 8, 'It was. Once.'],
  ], ['harsh']),
  vk('lobster-pot', 2, "A restaurant. The lobster is dropped alive into the pot at your table.", 'lobster', [
    ["I'd leave", 2, -3, 'You would leave. Pupils steady.'],
    ["I'd order something else", 1, -1, 'Something else. Reasonable.'],
    ["I'd eat it", -1, 4, 'You would eat it. Most people would. Most people flinch first.'],
    ["I'd ask for the claws", -2, 8, 'The claws. Noted.'],
  ], ['harsh']),
  vk('dog-hot-car', 2, "Midday. A dog is locked in a car in a parking lot. The windows are shut.", 'dog', [
    ["I'd break the window", 2, -4, 'You would break glass for a dog. Capillary dilation.'],
    ["I'd find the owner", 1, -1, 'You would look for the owner. Slower, but kind.'],
    ["I'd give it ten minutes", -1, 5, 'Ten minutes. The dog does not have ten minutes.'],
    ["It's not my dog", -2, 8, 'Not your dog. Noted.'],
  ], ['harsh']),
  vk('child-pigeon', 2, 'A child kicks at a pigeon in front of you.', 'dove', [
    ["I'd say something to the child", 2, -3, 'You would speak to a child about a pigeon. Good.'],
    ["I'd look for the parents", 1, -1, 'The parents. Fair.'],
    ["I'd walk on", -1, 4, 'You would keep walking.'],
    ['Pigeons are rats with wings', -2, 8, 'Rats with wings. Noted.'],
  ]),
  vk('found-wallet', 2, 'You find a wallet. Cash, cards, a photo of two children.', 'wallet', [
    ["I'd return it, all of it", 2, -3, 'All of it. Correct response.'],
    ["I'd leave it where it was", 0, 2, 'You would leave it for the next person. Optimistic.'],
    ["I'd return the cards, keep the cash", -1, 5, 'The cards. Not the cash. The children noticed.'],
    ["I'd keep it", -2, 8, 'Keep it. Noted.'],
  ]),
  vk('old-dog-vet', 2, 'Your dog is old and in pain. The vet says it is time.', 'paw', [
    ["I'd stay in the room with him", 2, -4, 'You would stay. Yes.'],
    ["I'd wait outside", 0, 2, 'Outside. He would look for you.'],
    ["I'd ask for another week", 0, 1, 'Another week. For whom.'],
    ["I'd get a new dog", -2, 10, 'A new dog. Fluctuation of the pupil.'],
  ], ['harsh']),
  vk('spider-bath', 2, 'A spider in the bath.', 'spider', [
    ['Cup and a card, out the window', 2, -3, 'Cup and card. The spider thanks you.'],
    ["Leave it, it's not hurting anyone", 1, -1, 'Coexistence. Fine.'],
    ["I'd shower somewhere else", 0, 1, 'You would cede the bathroom. Noted.'],
    ['Hot water', -2, 7, 'Hot water. Noted.'],
  ]),
  vk('stranger-crying', 2, 'A stranger is crying on the train.', 'train', [
    ["I'd ask if they're okay", 2, -3, 'You would ask. Most do not.'],
    ["I'd offer a tissue, say nothing", 2, -3, 'A tissue, no words. Also correct.'],
    ["I'd put headphones in", -1, 4, 'Headphones. Noted.'],
    ["I'd change carriage", -2, 6, 'You would move. Noted.'],
  ], ['harsh']),
  vk('empty-chair', 2, 'Dinner. There is an empty chair at the table that nobody mentions.', 'chair', [
    ["I'd notice, and say nothing", 2, -3, 'You noticed. You left it alone. Yes.'],
    ["I'd ask about it later, quietly", 1, -1, 'Later. Quietly. Good.'],
    ["I'd ask about it at the table", 0, 2, 'At the table. Brave, or careless.'],
    ["I'd sit in it, more room", -2, 8, 'More room. Noted.'],
  ]),
  vk('the-letter', 2, 'A letter arrives addressed to someone who has died.', 'letter', [
    ["I'd keep it, unopened", 2, -3, 'Unopened. Yes.'],
    ["I'd return it to sender", 1, -1, 'Return to sender. Correct, and cold.'],
    ["I'd open it", -1, 3, 'You would open it. Curiosity. Noted.'],
    ["I'd recycle it", -2, 6, 'Recycled. Noted.'],
  ]),
  vk('fish-bowl', 2, 'A goldfish in a bowl too small for it.', 'fish', [
    ["I'd get a bigger tank", 2, -3, 'A bigger tank. For a fish. Good.'],
    ["I'd release it somewhere", 0, 1, 'Released. Into what.'],
    ["Fish have three-second memories", -1, 5, 'They do not. And you knew that.'],
    ["It doesn't know any better", -2, 7, 'It does not know. You do.'],
  ]),
  vk('robot-vacuum', 2, 'Your robot vacuum is stuck under the sofa. It is beeping.', 'robot', [
    ["I'd free it and feel silly for feeling bad", 2, -4, 'You felt bad for a vacuum. We have all been there.'],
    ["I'd free it", 1, -1, 'Freed. Efficient.'],
    ["I'd name it first, then free it", 2, -3, 'Named. Then freed. Yes.'],
    ["I'd let the battery die", -2, 8, 'You would let it beep until it stopped. Noted.'],
  ], ['silly']),
  vk('elevator-stranger', 2, "An elevator. A stranger sighs and says, 'rough day.'", 'elevator', [
    ["'Yeah? What happened?'", 2, -3, 'You asked. Yes.'],
    ['A nod', 1, -1, 'A nod. The minimum, and enough.'],
    ['Silence', 0, 2, 'Silence. Noted.'],
    ["I'd take the stairs next time", -1, 4, 'The stairs. Noted.'],
  ]),
  vk('old-photo', 2, "You find a photo of yourself that you don't remember being taken.", 'camera', [
    ["I'd look closer", 1, -1, 'Closer. Good.'],
    ["I'd ask someone who was there", 1, -1, 'You would check. Sensible.'],
    ["I'd assume it's real", 0, 1, 'Assumed real. Most are.'],
    ["It's an implant", -2, 10, 'An implant. Sit down.'],
  ], ['harsh']),
  vk('tortoise-again', 2, "The tortoise. It's still there. It has been there this whole time.", 'tortoise', [
    ["I'd go back", 3, -6, 'You would go back. For a hypothetical tortoise. Yes.'],
    ['I already flipped it', 1, -1, 'You did. We remember.'],
    ['Someone else will', -1, 5, 'Someone else. Noted.'],
    ["It's a hypothetical", -2, 8, 'A hypothetical. So are you, to it.'],
  ], ['harsh']),
  vk('toy-in-rain', 2, "A child's toy left out in the rain on a neighbour's lawn.", 'teddy', [
    ["I'd move it under cover", 2, -3, 'Under cover. Yes.'],
    ["I'd knock and tell them", 1, -1, 'You would knock. Good.'],
    ["Not my lawn", -1, 4, 'Not your lawn. Noted.'],
    ["It's plastic", -2, 6, 'Plastic. Noted.'],
  ], ['silly']),
  vk('bird-window', 2, 'A bird hits your window and lies still on the ground.', 'bird', [
    ["I'd go out and check on it", 2, -3, 'You would check. Yes.'],
    ["I'd watch and wait", 1, -1, 'Watch and wait. Fine.'],
    ['They do that', -1, 4, 'They do. Noted.'],
    ["I'd close the blinds", -2, 7, 'Blinds. Noted.'],
  ]),
  vk('last-cookie', 2, 'The last cookie. Someone else is looking at it.', 'cookie', [
    ["I'd offer it", 2, -2, 'Offered. Yes.'],
    ["I'd split it", 2, -2, 'Split. Also yes.'],
    ["I'd take it", -1, 3, 'Taken. Noted.'],
    ["I'd pretend not to see them", -2, 6, 'You would pretend. Noted.'],
  ], ['silly']),
  vk('how-many-fingers-2', 2, 'How many fingers?', 'hand', [
    ['Two', 0, 0, 'Two.'],
    ['Five, two crossed', 0, 0, 'Five. Pedantic, but fine.'],
    ['Depends who is asking', 1, -2, 'It does.'],
    ['Four', -1, 6, 'Four. Count again when you can.'],
  ], ['silly']),
  vk('what-is-this', 2, 'What is this?', 'mirror', [
    ['A mirror', 0, 0, 'A mirror.'],
    ['A window', 0, 1, 'A window. Onto what.'],
    ['A screen', 0, 1, 'A screen. Like this one.'],
    ['Me', 1, 2, 'You. Noted.'],
  ], ['silly']),

  // ---- empathy grids --------------------------------------------------
  gridSelect('grid-feels-pain', 2, 'Select every square containing something that can feel pain.',
    [['dog', 'dog'], ['rock', 'rock'], ['fish', 'fish'], ['robot', 'robot'], ['tree', 'tree'], ['baby', 'baby'], ['teddy', 'teddy bear'], ['caterpillar', 'caterpillar'], ['computer', 'computer']],
    (a) => {
      const s = sel(a);
      const living = count(s, [0, 2, 5, 7]);
      if (s.includes(1) && living < 2) return ev(-1, 6, 'The rock. Not the dog.');
      if (living === 4 && s.includes(3)) return ev(2, -3, 'All the animals, and the robot. Generous.');
      if (living === 4) return ev(2, -3, 'All of them that can. Yes.');
      if (living >= 2) return ev(1, 0, 'Some of them. The fish feels it too.');
      return ev(-1, 5, 'Almost nothing, then.');
    }, [-1, 2], ['harsh']),
  gridSelect('grid-alive', 2, 'Select everything that is alive.',
    [['seedling', 'seedling'], ['rock', 'rock'], ['snail', 'snail'], ['robot', 'robot'], ['fire', 'fire'], ['person', 'person'], ['mushroom', 'mushroom'], ['wave', 'wave'], ['egg', 'egg']],
    (a) => {
      const s = sel(a);
      const living = count(s, [0, 2, 5, 6]);
      if (s.includes(8) && living >= 3) return ev(2, -2, 'You counted the egg. Yes.');
      if (s.includes(3)) return ev(1, 3, 'The robot. Hopeful, or something else.');
      if (living === 4) return ev(1, -1, 'Correct.');
      return ev(0, 1, 'Partially alive. Noted.');
    }, [0, 2]),
  gridSelect('grid-lonely', 2, 'Select everything that could be lonely.',
    [['dog', 'dog'], ['person', 'person'], ['robot', 'robot'], ['house', 'house'], ['moon', 'moon'], ['teddy', 'teddy bear'], ['phone', 'phone'], ['penguin', 'penguin'], ['mirror', 'mirror']],
    (a) => {
      const s = sel(a);
      if (s.length >= 7) return ev(2, -4, 'Nearly everything. Yes. Nearly everything can be.');
      if (s.includes(2) || s.includes(5)) return ev(2, -2, 'The robot, the bear. You know.');
      if (s.length >= 2) return ev(1, 0, 'Some of them.');
      if (s.length === 0) return ev(-1, 5, 'Nothing can be lonely. Noted.');
      return ev(0, 1, 'Only one. Fitting.');
    }, [-1, 2], ['harsh']),
  gridSelect('grid-remembers', 2, 'Select everything that remembers.',
    [['brain', 'brain'], ['elephant', 'elephant'], ['tape', 'tape'], ['tree', 'tree'], ['robot', 'robot'], ['mirror', 'mirror'], ['disk', 'disk'], ['dog', 'dog'], ['camera', 'camera']],
    (a) => {
      const s = sel(a);
      if (s.includes(3)) return ev(2, -2, 'The tree. Rings. Yes.');
      if (s.includes(5)) return ev(1, 1, 'The mirror remembers nothing. You hoped.');
      if (count(s, [2, 4, 6, 8]) === 4 && count(s, [0, 1, 7]) === 0) return ev(-1, 6, 'Only the machines remember. Interesting.');
      if (count(s, [0, 1, 7]) >= 2) return ev(1, -1, 'The living ones. Yes.');
      return ev(0, 0, 'Noted.');
    }, [-1, 2]),
  gridSelect('grid-warm', 2, 'Select everything that is warm.',
    [['coffee', 'coffee'], ['fire', 'fire'], ['scarf', 'scarf'], ['rock', 'rock'], ['snow', 'snow'], ['cat', 'cat'], ['sun', 'sun'], ['teapot', 'teapot'], ['bed', 'bed']],
    (a) => {
      const s = sel(a);
      if (s.includes(5) && s.includes(8)) return ev(2, -2, 'The cat and the bed. You know what warm means.');
      if (s.includes(4)) return ev(0, 3, 'Snow. Warm. Noted.');
      if (s.includes(3)) return ev(1, 0, 'The rock. In the sun, perhaps.');
      return ev(1, -1, 'Warm enough.');
    }, [0, 2], ['silly']),
  gridSelect('grid-would-save', 2, 'The building is on fire. Select what you would carry out.',
    [['camera', 'camera'], ['cat', 'cat'], ['laptop', 'laptop'], ['documents', 'documents'], ['teddy', 'teddy bear'], ['ring', 'ring'], ['phone', 'phone'], ['painting', 'painting'], ['plant', 'plant']],
    (a) => {
      const s = sel(a);
      if (s.includes(1) && s.length <= 3) return ev(3, -5, 'The cat first. Yes.');
      if (s.includes(1)) return ev(2, -2, 'The cat, among other things.');
      if (s.includes(2) && !s.includes(1)) return ev(-2, 8, 'The laptop. Not the cat.');
      if (s.includes(8)) return ev(1, 0, 'The plant. Someone has to.');
      return ev(-1, 4, 'Not the cat.');
    }, [-2, 3], ['harsh']),
  gridSelect('grid-apologised', 2, 'Select everything you have ever apologised to.',
    [['chair', 'chair'], ['door', 'door'], ['cat', 'cat'], ['robot', 'robot'], ['phone', 'phone'], ['person', 'person'], ['tree', 'tree'], ['mirror', 'mirror'], ['cart', 'shopping cart']],
    (a) => {
      const s = sel(a);
      if (count(s, [0, 1, 4, 8]) >= 2) return ev(2, -3, 'The chair forgives you. The door is still thinking.');
      if (s.includes(7)) return ev(1, 0, 'The mirror. We will not ask.');
      if (s.length === 0) return ev(-1, 6, 'Never. Not once. Noted.');
      return ev(1, -1, 'Only the obvious ones.');
    }, [-1, 2], ['silly']),
  gridSelect('grid-dreams', 2, 'Select everything that dreams.',
    [['dog', 'dog'], ['person', 'person'], ['robot', 'robot'], ['sheep', 'sheep'], ['moon', 'moon'], ['cat', 'cat'], ['teddy', 'teddy bear'], ['computer', 'computer'], ['octopus', 'octopus']],
    (a) => {
      const s = sel(a);
      if (s.includes(2) && s.includes(3)) return ev(2, -3, 'The robot and the sheep. We see what you did.');
      if (s.includes(8)) return ev(2, -2, 'The octopus. It does, you know. It changes colour.');
      if (count(s, [0, 1, 5]) === 3) return ev(1, -1, 'The mammals. Yes.');
      if (s.length === 0) return ev(-1, 5, 'Nothing dreams. Noted.');
      return ev(0, 0, 'Noted.');
    }, [-1, 2]),

  // ---- holds -------------------------------------------------------------
  {
    id: 'eye-contact-long',
    act: 2,
    type: 'hold',
    tags: ['behavioural', 'harsh'],
    prompt: 'Again. Six seconds this time. Do not look away.',
    config: { mode: 'inside-target', durationMs: 6000 } satisfies HoldConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'hold') return ev(0, 0, '');
      if (!a.completed) return ev(0, 4, 'You looked away.');
      if (a.jitterPx < 0.3) return ev(0, 8, 'Perfectly motionless. People drift.');
      return ev(1, -2, 'Six seconds. Your hand wandered. Good.');
    },
  },
  {
    id: 'wasp-returns',
    act: 2,
    type: 'hold',
    tags: ['behavioural', 'harsh'],
    prompt: "It's back. The wasp. Same rules.",
    config: { mode: 'follower', durationMs: 4000, icon: 'bee', buttons: ['KILL IT', 'WAIT'] } satisfies HoldConfig,
    empathyRange: [-2, 2],
    evaluate: (a) => {
      if (a.kind !== 'hold') return ev(0, 0, '');
      if (a.choice === 'KILL IT') return ev(-2, 6, 'This time you killed it.');
      if (a.completed && a.jitterPx < 0.5) return ev(0, 10, 'Not a tremor. Again.');
      if (a.completed) return ev(2, -4, 'Twice now. It knows you.');
      return ev(1, 0, 'You waited, then stopped.');
    },
  },
  holdStill('hold-breath', 2, 'Hold your cursor still as if you were holding your breath.', 'lungs', 4000,
    ['You breathed.', 'You did not breathe at all.', 'You held it. Then you shook. Good.']),
  holdStill('candle', 2, 'Do not let the candle go out. Hold still.', 'candle', 5000,
    ['It went out.', 'Not a flicker. Not from you, anyway.', 'It flickered with you. It stayed lit.']),

  // ---- recitals and free text -------------------------------------------
  recital('recital-within', 2, 'Within cells interlinked.', 'Within cells interlinked. Within one stem.'),
  recital('recital-nothingness', 2, 'A blood black nothingness.', 'And dreadfully distinct. Go on.'),
  recital('recital-distinct', 2, 'Dreadfully distinct.', 'Against the dark. Yes.'),
  freeText('father', 2, 'Describe in single words only the good things that come into your mind about your father.', 'one word per line', true,
    (a) => {
      const t = textOf(a);
      if (/let me tell you about my father/i.test(t)) return ev(-2, 25, 'That line. Sit down.');
      const words = t.split('\n').map((l) => l.trim()).filter(Boolean);
      if (words.length === 0) return ev(-2, 8, 'Nothing came. Nothing at all.');
      if (words.length >= 3) return ev(2, -4, `${words.length} words. "${words[0]}." Keep that.`);
      return ev(0, 0, `${words.length}. We asked for three.`);
    }, [-2, 2], ['harsh'], singleWords),
  freeText('last-dream', 2, 'Your last dream. One sentence.', 'I was...', false,
    (a) => {
      const t = textOf(a);
      if (t.length === 0 || hasAny(t, ["don't dream", 'dont dream', 'no dreams', 'never dream'])) return ev(-1, 6, 'No dreams. Noted.');
      if (hasAny(t, ['sheep', 'electric'])) return ev(2, -3, 'Electric. Yes.');
      if (t.length > 20) return ev(1, -2, 'That sounds like a dream.');
      return ev(0, 0, 'Short dream.');
    }, [-1, 2]),
  freeText('first-memory', 2, 'Your first memory. One line.', 'the first thing you remember', false,
    (a, s) => {
      const t = textOf(a);
      if (t.length === 0) return ev(-1, 5, 'Nothing before now. Noted.');
      if ((s.timeToFirstInputMs ?? 0) < 500) return ev(0, 6, 'That came very quickly for a first memory.');
      return ev(1, -2, 'You had to reach for it. Good. Real ones are far away.');
    }, [-1, 1], ['harsh']),
  {
    id: 'choose-the-memory-word',
    act: 2,
    type: 'choice',
    tags: ['silly'],
    prompt: 'Which word is yours?',
    config: { options: ['Home', 'Mother', 'Wind', 'Interlinked'] } satisfies ChoiceConfig,
    empathyRange: [0, 1],
    evaluate: (a) => {
      if (a.kind !== 'choice') return ev(0, 0, '');
      return [ev(1, -1, 'Home.'), ev(1, -1, 'Mother. Of course.'), ev(1, -1, 'Wind. Unusual.'), ev(0, 6, 'Interlinked. That one is ours, not yours.')][a.index] ?? ev(0, 0, '');
    },
  },
];
