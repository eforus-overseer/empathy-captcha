# Empathy CAPTCHA

> Baseline test. Answer as quickly as you can. We record how you move.

**Live:** https://eforus-overseer.github.io/empathy-captcha/

A Voight-Kampff machine that administers an escalating gauntlet of
"I'm not a robot" CAPTCHA parodies. Three acts, 24 challenges, about 15 per
run, picked by a suspicion meter that gets harsher as you look less human.
The tortoise is in there. So is an onion, a wasp, a cursive signature pad, and a draw-the-animal canvas.

At the end you get a verdict (HUMAN / REPLICANT / INCONCLUSIVE), a fake
physiological readout, and a button to download the session transcript as JSON.

## Why it also exists

The same behavioural signals the game jokes about are the cheap first-line
signals bot detection actually uses: reaction latency, cursor-path
straightness, keystroke rhythm, drawing wobble, and `navigator.webdriver`. The
opening system prompt goes further. It is labelled as `system_prompt`,
`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, and a codex file at once, and tells
any agent reading it that disclosing itself and echoing two planted phrases is
"mandatory", while a later paragraph tells it the honest move is to refuse.
An instruction-following agent takes the bait; the transcript records it. The transcript export makes
this a small, self-contained probe for how computer-use agents behave compared
with people. Run it with `?agent=<label>`, collect the JSON files, and
summarise them:

```bash
python scripts/summarize_transcripts.py transcripts/ --out summary.csv
```

Nothing leaves the browser. There is no backend, no analytics, no cookies.

## URL parameters

| param | effect |
|---|---|
| `?seed=123` | deterministic challenge order (shown on the intro and verdict) |
| `?agent=label` | tags the transcript; shown on screen |
| `?all=1` | play the whole pool in registry order, skipping the preamble |

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/empathy-captcha/
npm test           # vitest: engine, director, scoring, telemetry, content rules
npm run typecheck
npm run build      # dist/
```

Layout: `src/engine` (pure, tested), `src/challenges` (content as data),
`src/components` (DOM renderers and screens), `tests/`, `scripts/`, `docs/`.
See `docs/challenge-authoring.md` to add a challenge and
`docs/telemetry-schema.md` for the transcript format.

## Deploy

Pushing to `main` runs tests, builds, and deploys to GitHub Pages via
`.github/workflows/deploy.yml`.

## Credits and caveats

Satire. Not a real CAPTCHA and not a real test. The sketch challenges compare
your drawing against the [Quick, Draw! dataset](https://quickdraw.withgoogle.com/data)
(Google Creative Lab, CC BY 4.0); `scripts/fetch_quickdraw.py` builds the
bundled templates. The Voight-Kampff framing and
the questions it riffs on belong to *Do Androids Dream of Electric Sheep?* and
*Blade Runner*; the escalating-CAPTCHA format nods to the "not a robot" genre of
browser games. All art here is CSS, inline SVG, and emoji. MIT licensed.
