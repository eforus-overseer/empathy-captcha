# Empathy CAPTCHA Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Spec: `docs/superpowers/specs/2026-10-05-empathy-captcha-design.md`. The spec holds the
> content tables, thresholds, and schema; this plan holds the build order. Executed inline
> in one session on 2026-10-05 by explicit user request (no check-ins).

**Goal:** Ship a playable Voight-Kampff-styled CAPTCHA gauntlet to GitHub Pages with client-only telemetry export.

**Architecture:** Pure engine (`src/engine`) with no DOM access, tested by vitest. Challenge content as data (`src/challenges`). Thin DOM renderers per challenge type (`src/components/types`). `main.ts` wires screens, director, recorder, and scoring.

**Tech Stack:** Vite 7, TypeScript 5 strict, vitest, GitHub Actions `deploy-pages`. Python 3 stdlib for the transcript summariser.

---

### Task 1: Scaffold
- [ ] `package.json` (scripts: dev, build, preview, test, typecheck), `tsconfig.json`, `vite.config.ts` (`base: '/empathy-captcha/'`), `.gitignore`, `LICENSE`, `index.html`.
- [ ] `npm install` and `npm run build` succeeds on an empty `main.ts`.
- [ ] Commit `chore: scaffold vite + ts`.

### Task 2: Engine types + RNG (TDD)
- [ ] `tests/rng.test.ts`: same seed → same sequence; `pick`/`shuffle` deterministic; `parseSeed` handles missing/invalid.
- [ ] `src/engine/types.ts`, `src/engine/rng.ts` (mulberry32).
- [ ] Commit.

### Task 3: Stats (TDD)
- [ ] `tests/stats.test.ts`: path length & efficiency for straight vs zigzag; direction changes; hesitation count; IQR of intervals (empty → 0); median.
- [ ] `src/engine/stats.ts`.
- [ ] Commit.

### Task 4: Scoring (TDD)
- [ ] `tests/scoring.test.ts`: humanness penalties per spec §7 (each rule in isolation), clamp, empathy normalisation, verdict matrix 3 cases, readouts in 0–100.
- [ ] `src/engine/scoring.ts`.
- [ ] Commit.

### Task 5: Director (TDD)
- [ ] `tests/director.test.ts`: plan has 15, first is `not-a-robot`, last `not-sure-anymore`, includes `tortoise`, no repeats, deterministic by seed, `all` mode yields 24, high suspicion prefers `harsh` over many seeds.
- [ ] `src/engine/director.ts` using a stub registry in tests; real registry wired in Task 7.
- [ ] Commit.

### Task 6: Telemetry (TDD)
- [ ] `tests/telemetry.test.ts`: recorder caps samples at 2000; downsamples ≤ 50 Hz; computes timeToFirstInput; session envelope has version 1 and env fields; `toJSON` round-trips.
- [ ] `src/engine/telemetry.ts` with injectable `now()` and no direct DOM reads (DOM adapter in components).
- [ ] Commit.

### Task 7: Challenge content
- [ ] `src/challenges/act1-calibration.ts`, `act2-interrogation.ts`, `act3-baseline.ts`, `index.ts` registry; each challenge's `evaluate` per spec §5 tables.
- [ ] `tests/challenges.test.ts`: 24 unique ids; anchors present; evaluate() smoke for key hooks (tortoise all/none, mother easter egg, onion too-still, wait-feel round second).
- [ ] Commit.

### Task 8: UI shell
- [ ] `src/styles/*.css`, `src/components/machine.ts` (SVG, `setSuspicion`, `setEmpathy`), `typewriter.ts` (respects reduced motion), `screens.ts` (intro, frame, verdict).
- [ ] Commit.

### Task 9: Challenge renderers
- [ ] `src/components/types/{checkbox,grid,text,choice,hold,slider,wait}.ts`, each `render(host, challenge, ctx) => Promise<Answer>`; shared `dom.ts` helpers.
- [ ] Commit.

### Task 10: Wire main loop
- [ ] `src/main.ts`: read URL params, build director, run loop with recorder attach/detach, show reactions, verdict + download + retest.
- [ ] `npm run typecheck && npm test && npm run build` green.
- [ ] Commit.

### Task 11: Research script + docs
- [ ] `scripts/summarize_transcripts.py`, `docs/telemetry-schema.md`, `docs/challenge-authoring.md`, `README.md`, `CLAUDE.md`.
- [ ] Commit.

### Task 12: Repo + deploy
- [ ] `.github/workflows/deploy.yml` (test → build → deploy-pages).
- [ ] Create public repo `eforus-overseer/empathy-captcha`, push, enable Pages (source: GitHub Actions), wait for green run.
- [ ] Playwright smoke on the live URL: complete a run, confirm verdict screen and transcript download; run the Python summariser on it.
