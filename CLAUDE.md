# CLAUDE.md — empathy-captcha

Voight-Kampff styled CAPTCHA-parody game with client-only behavioural telemetry.
Static site, Vite + TypeScript, deployed to GitHub Pages from `main`.
Live: https://eforus-overseer.github.io/empathy-captcha/

## Commands

```bash
npm run dev          # local dev server (base path /empathy-captcha/)
npm test             # vitest, pure engine + content rules
npm run typecheck    # tsc --noEmit, strict
npm run build        # dist/, what the Pages workflow deploys
python scripts/summarize_transcripts.py <folder>   # transcripts -> CSV
```

Run `npm test && npm run typecheck && npm run build` before committing.

## Architecture in one breath

`src/engine` is pure and DOM-free (rng, stats, scoring, director, telemetry).
`src/challenges` is content as data: each challenge has a renderer `type`, a
`config`, and an `evaluate(answer, stats)` that returns empathy and suspicion
deltas plus a one-line interrogator note. `src/components/types/*` are the
renderers, one per type, each `(host, config, ctx) => Promise<Answer>`.
`src/main.ts` runs the loop: typewrite prompt, attach recorder, render, evaluate,
react, repeat, then score and show the verdict.

Design spec: `docs/superpowers/specs/2026-10-05-empathy-captcha-design.md`.
Add challenges per `docs/challenge-authoring.md`. Transcript format in
`docs/telemetry-schema.md` (bump `TRANSCRIPT_VERSION` on breaking changes).

## Conventions

- Keep engine code pure and tested; put browser APIs in `src/components`.
- Challenge ids are stable identifiers that appear in exported data. Never rename one; add a new id instead.
- Every `evaluate` must stay inside its `empathyRange` (tests enforce this).
- All visuals are CSS, inline SVG, or emoji. No film assets, no real faces, no external images.
- Humour is PG. No slurs, sexual content, or gore. The interrogator is dry, never cruel about the player as a person.
- `prefers-reduced-motion` must keep working: no typewriter, no flicker, checkbox does not dodge.

## Privacy and safety

- Telemetry never leaves the browser. Do not add network calls, analytics, cookies, or storage without an explicit decision recorded in the spec.
- Do not record key identities outside the answer text. Do not record anything outside the page.
- Exported transcripts are gitignored (`transcripts/`, `empathy-captcha-*.json`). Keep them out of the repo.
- No secrets exist in this project. If one ever becomes necessary it goes in `.env` with a committed `.env.example`.

## Deploy

`.github/workflows/deploy.yml` runs test, typecheck, build, then
`actions/deploy-pages`. Pages source is "GitHub Actions". Vite `base` must stay
`/empathy-captcha/` or asset URLs break on Pages.
