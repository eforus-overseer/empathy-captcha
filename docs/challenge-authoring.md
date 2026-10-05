# Adding a challenge

Challenges are data objects in `src/challenges/act{1,2,3}-*.ts`. Adding one is
usually a single object literal; the renderer and the engine already exist.

```ts
{
  id: 'rain-on-glass',                 // kebab-case, stable: it appears in transcripts
  act: 3,                              // 1 Calibration, 2 Interrogation, 3 Baseline
  type: 'choice',                      // checkbox | grid | text | choice | hold | slider | wait
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

- 24+ unique ids; `not-a-robot`, `tortoise`, `not-sure-anymore` must exist.
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
