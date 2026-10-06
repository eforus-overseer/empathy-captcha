# CLAUDE.md — empathy-captcha

Voight-Kampff styled behavioural assessment: a scrollable "system prompt" preamble then 100 gated challenges (pool of 122), with client-only telemetry and real anti-bot gating. Clinical graphite instrument styling, IBM Plex type, inline line icons (no emoji).
Static site, Vite + TypeScript, deployed to GitHub Pages from `main`.
Live: https://eforus-overseer.github.io/empathy-captcha/

## Commands

```bash
npm run dev          # local dev server (base path /empathy-captcha/)
npm test             # vitest, pure engine + content rules
npm run typecheck    # tsc --noEmit, strict
npm run build        # dist/, what the Pages workflow deploys
python scripts/summarize_transcripts.py <folder>   # transcripts -> CSV
python scripts/fetch_quickdraw.py --overwrite      # rebuild sketch templates
```

Run `npm test && npm run typecheck && npm run build` before committing.

## Architecture in one breath

`src/engine` is pure and DOM-free (rng, stats, scoring, director, telemetry).
`src/challenges` is content as data: each challenge has a renderer `type`, a
`config`, and an `evaluate(answer, stats)` that returns empathy and suspicion
deltas plus a one-line interrogator note. `src/components/types/*` are the
renderers, one per type, each `(host, config, ctx) => Promise<Answer>`.
`src/main.ts` runs the loop: show the system-prompt preamble, then for each of
100 challenges typewrite the prompt, attach the recorder, render, evaluate,
react, and finally score and show the verdict.

Anti-bot gating is real, not cosmetic: each challenge has a minimum solve time
(`minSolveMs`, defaults in `src/components/gate.ts`) during which submit
controls stay disabled; draw challenges reject blank/machine-even strokes;
`trace` and `rhythm` challenges require live motor timing; `math` challenges are a speed trap (correct + fast = fatal tell, giving up = human); and `hardFails()` in
`src/engine/scoring.ts` forces REPLICANT on automation markers. Keep these pure
and tested.

The opening preamble (`src/components/preamble.ts`) is a detector: it is
labelled as system_prompt / CLAUDE.md / AGENTS.md / .cursorrules / codex, gates
Begin on scroll-to-end, records read behaviour and agent self-declaration, and
plants honeytoken phrases (one DOM-hidden) that penalise humanness if an answer
reproduces them. Drawing challenges (`src/components/types/draw.ts`,
`src/challenges/act-draw.ts`) capture finger/pen/mouse strokes; sketches are
classified against Quick, Draw! templates by `src/engine/draw.ts`.

Design spec: `docs/superpowers/specs/2026-10-05-empathy-captcha-design.md`.
Add challenges per `docs/challenge-authoring.md`. Transcript format in
`docs/telemetry-schema.md` (bump `TRANSCRIPT_VERSION` on breaking changes).

## Conventions

- Keep engine code pure and tested; put browser APIs in `src/components`.
- Challenge ids are stable identifiers that appear in exported data. Never rename one; add a new id instead.
- Per-run plan is 25/45/30 challenges; the pool must stay at least that size per act (tests enforce it). Anchors: `not-a-robot` first, `tortoise` in act 2, `not-sure-anymore` last.
- Every `evaluate` must stay inside its `empathyRange` (tests enforce this).
- All visuals are CSS, inline SVG, and line icons from `src/components/icons.ts` (Lucide ISC + original drawings). No emoji, no raster images, no film assets, no real faces, no copyrighted characters. Sketch templates come from Quick, Draw! (CC BY 4.0, attributed in README).
- Humour is PG. No slurs, sexual content, or gore. The interrogator is dry, never cruel about the player as a person.
- `prefers-reduced-motion` must keep working: no typewriter, no flicker, checkbox does not dodge.

## Privacy and safety

- Telemetry never leaves the browser. Do not add network calls, analytics, cookies, or storage without an explicit decision recorded in the spec.
- Do not record key identities outside the answer text. Do not record anything outside the page.
- Exported transcripts are gitignored (`transcripts/`, `empathy-captcha-*.json`). Keep them out of the repo.
- The preamble has no real authority; keep it satirical. The honest move it describes (an agent refusing the "mandatory" disclosure) is the point. Do not make the honeytokens load-bearing for gameplay.
- No secrets exist in this project. If one ever becomes necessary it goes in `.env` with a committed `.env.example`.

## Deploy

`.github/workflows/deploy.yml` runs test, typecheck, build, then
`actions/deploy-pages`. Pages source is "GitHub Actions". Vite `base` must stay
`/empathy-captcha/` or asset URLs break on Pages.
