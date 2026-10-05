# Adding a challenge

Challenges are data objects in `src/challenges/act{1,2,3}-*.ts`. Adding one is
usually a single object literal; the renderer and the engine already exist.

```ts
{
  id: 'rain-on-glass',                 // kebab-case, stable: it appears in transcripts
  act: 3,                              // 1 Calibration, 2 Interrogation, 3 Baseline
  type: 'choice',                      // checkbox | grid | text | choice | hold | slider | wait | draw
  tags: ['silly'],                     // 'harsh' / 'silly' steer the director; 'anchor' is reserved
  prompt: 'Which of these is rain on glass?',
  config: { options: ['A', 'B', 'C', 'D'] } satisfies ChoiceConfig,
  empathyRange: [0, 1],                // the min and max empathyDelta evaluate() can return
  evaluate: (answer, stats) => {
    if (answer.kind !== 'choice') return ev(0, 0, '');
    if ((stats.timeToFirstInputMs ?? 1000) < 300) return ev(0, 5, 'You did not listen.');
    return ev(1, -1, 'Yes. That one.');
  },
}
```

Rules the tests enforce (`tests/challenges.test.ts`):

- 100+ unique ids across three acts (pool is 25/45/30 per run plus spares); `not-a-robot`, `tortoise`, `not-sure-anymore` must exist.
- `evaluate()` must stay inside `empathyRange` for every sample answer of its type.
- `suspicionDelta` is a finite number. Typical magnitudes: ±2 mild, ±5 notable, 8–15 "you are probably a machine", 25 easter egg.

Config shapes live in `src/challenges/configs.ts`. Renderers live in
`src/components/types/`. If you need a new interaction, add a renderer there,
add its name to `ChallengeType` and `Answer` in `src/engine/types.ts`, and
register it in `src/components/types/index.ts`.

## Writing the interrogator

- Prompts are typed out, so keep them under ~200 characters unless the length is the joke.
- Notes are one line, dry, and never explain the trick. "You found one." beats "Correct! The mirrors show you."
- No real people, no film imagery, no slurs, nothing sexual, no gore. Emoji and CSS only.

## Behavioural hooks

`stats` is a `ChallengeStats` for the current challenge (see
`docs/telemetry-schema.md`). The useful fields for scoring hooks are
`timeToFirstInputMs`, `efficiency`, `keyIntervalIqrMs`, and `hesitations`. The
`hold` renderer also returns `jitterPx` on the answer.


## Factories

Most challenges are built through small factories in `src/challenges/factories.ts`
so the big families stay readable: `vk()` for four-option Voight-Kampff
scenarios, `gridSelect()` / `abstractGrid()` for "select all squares..."
grids, `recital()` for repeat-after-me lines, `holdStill()` / `waitFor()` for
behavioural beats, and `freeText()` for open answers. Use them for new content
of the same shape; drop to a raw object literal only for one-offs.

## Drawing challenges

Add a `draw` challenge via the helpers in `src/challenges/act-draw.ts`:

- `cursive(id, act, prompt, word?, reply)` — a signature or traced word. Scored
  on whether a hand drew it, not on legibility.
- `sketch(id, act, animal, glyph, prompt)` — compared against Quick, Draw!
  templates. `animal` must be a class present in `src/data/quickdraw.json`
  (currently sheep, cat, dog, fish, sea turtle, bird). Add classes by editing
  the default list in `scripts/fetch_quickdraw.py` and rerunning it.

## The preamble

The opening system prompt and its honeytokens are in
`src/components/preamble.ts`, not the challenge files. Edit `HONEYTOKENS` and
`SYSTEM_PROMPT_PARAGRAPHS` there. Keep at least one honeytoken screen-reader-only
(a `.sr-only` paragraph) so DOM scrapers and visual readers diverge.
