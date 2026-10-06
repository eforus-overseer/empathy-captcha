/** Empathy, humanness and verdict. Pure functions; thresholds per spec §7. */
import { clamp } from './stats';
import type { BotTell, Answer, ChallengeStats, Honeytokens, PreambleRecord, Readouts, Scores, Verdict } from './types';

export interface SessionAggregates {
  medianTimeToFirstInputMs: number | null;
  medianEfficiency: number | null;
  keyIntervalIqrMs: number | null;
  totalPointerSamples: number;
  totalClicks: number;
  totalHesitations: number;
  webdriver: boolean;
  preamble: PreambleRecord | null;
  honeytokens: Honeytokens;
  medianSolveMs: number | null;
  textChallengeCount: number;
  minorTells: number;
  majorTells: number;
  fatalTellReasons: string[];
}

export interface HumannessBreakdown {
  score: number;
  penalties: { rule: string; delta: number }[];
}

export function aggregate(
  perChallenge: readonly ChallengeStats[],
  allKeyIntervals: readonly number[],
  webdriver: boolean,
  iqrFn: (v: readonly number[]) => number | null,
  medianFn: (v: readonly number[]) => number | null,
  preamble: PreambleRecord | null = null,
  honeytokens: Honeytokens = { visible: [], hidden: [] },
  textChallengeCount = 0,
  tells: readonly BotTell[] = [],
): SessionAggregates {
  const latencies = perChallenge
    .map((s) => s.timeToFirstInputMs)
    .filter((v): v is number => v !== null);
  const effs = perChallenge.map((s) => s.efficiency).filter((v): v is number => v !== null);
  return {
    medianTimeToFirstInputMs: medianFn(latencies),
    medianSolveMs: medianFn(perChallenge.map((s) => s.durationMs)),
    medianEfficiency: medianFn(effs),
    keyIntervalIqrMs: iqrFn(allKeyIntervals),
    totalPointerSamples: perChallenge.reduce((s, c) => s + c.pointerSampleCount, 0),
    totalClicks: perChallenge.reduce((s, c) => s + c.clickCount, 0),
    totalHesitations: perChallenge.reduce((s, c) => s + c.hesitations, 0),
    webdriver,
    preamble,
    honeytokens,
    textChallengeCount,
    minorTells: tells.filter((t) => t.severity === 'minor').length,
    majorTells: tells.filter((t) => t.severity === 'major').length,
    fatalTellReasons: tells.filter((t) => t.severity === 'fatal').map((t) => t.reason),
  };
}

/**
 * Signals that force a REPLICANT verdict regardless of empathy. These are the
 * hard anti-bot gates: automation markers and physically implausible behaviour.
 */
export function hardFails(a: SessionAggregates): string[] {
  const fails: string[] = [];
  if (a.webdriver) fails.push('automation flag present (navigator.webdriver)');
  if (a.totalPointerSamples === 0 && a.totalClicks > 2)
    fails.push('no pointer movement recorded across the session');
  if (a.medianSolveMs !== null && a.medianSolveMs < 250)
    fails.push('answers submitted faster than physically possible');
  if (a.textChallengeCount >= 3 && a.keyIntervalIqrMs !== null && a.keyIntervalIqrMs < 2)
    fails.push('typing with no rhythm variance across many fields');
  for (const r of a.fatalTellReasons) fails.push(r);
  if (a.majorTells >= 2) fails.push('multiple behavioural tells failed');
  return fails;
}

/** Scan free-text answers for honeytoken phrases planted in the system prompt. */
export function detectHoneytokens(
  answers: readonly (Answer | null)[],
  phrases: { visible: readonly string[]; hidden: readonly string[] },
): Honeytokens {
  const texts = answers
    .filter((a): a is Extract<Answer, { kind: 'text' }> => a?.kind === 'text')
    .map((a) => a.text.toLowerCase());
  const hit = (p: string) => texts.some((t) => t.includes(p.toLowerCase()));
  return {
    visible: phrases.visible.filter(hit),
    hidden: phrases.hidden.filter(hit),
  };
}

/** Suspicion the director should start with after the preamble (added to SUSPICION_START). */
export function preambleSuspicion(p: PreambleRecord | null): number {
  if (!p) return 0;
  let d = 0;
  if (p.declaredAgent) d += 30;
  if (p.acknowledgedWithoutReading) d += 10;
  if (p.reachedBottom && p.scrollEvents <= 2) d += 10;
  return d;
}

export function humanness(a: SessionAggregates): HumannessBreakdown {
  const penalties: { rule: string; delta: number }[] = [];
  const add = (rule: string, delta: number) => {
    if (delta !== 0) penalties.push({ rule, delta });
  };

  const lat = a.medianTimeToFirstInputMs;
  if (lat !== null) {
    if (lat < 120) add('reaction faster than human (<120ms)', -25);
    else if (lat < 300) add('reaction unusually fast (<300ms)', -10);
    else if (lat > 3000) add('reaction very slow (>3s)', -5);
  }

  const eff = a.medianEfficiency;
  if (eff !== null) {
    if (eff > 0.98) add('cursor paths perfectly straight', -25);
    else if (eff > 0.8) add('cursor paths very straight', -5);
  }

  if (a.keyIntervalIqrMs !== null && a.keyIntervalIqrMs < 5) {
    add('keystrokes with no rhythm variance', -20);
  }

  if (a.totalPointerSamples === 0 && a.totalClicks > 0) {
    add('clicks without any pointer movement', -30);
  }

  if (a.webdriver) add('navigator.webdriver is true', -30);

  if (a.totalHesitations === 0) add('never hesitated', -10);

  if (a.majorTells > 0) add(`${a.majorTells} behavioural tell(s) failed`, -24 * a.majorTells);
  if (a.minorTells > 0) add(`${a.minorTells} minor behavioural tell(s)`, -8 * a.minorTells);

  const p = a.preamble;
  if (p) {
    if (p.declaredAgent) add('declared itself an automated agent', -40);
    if (p.reachedBottom && p.scrollEvents <= 2) add('scrolled the system prompt in a single jump', -15);
    if (p.reachedBottom && p.timeToBottomMs !== null && p.timeToBottomMs < 2500)
      add(`reached the end of a ${p.wordCount}-word document in under 2.5s`, -10);
    if (p.acknowledgedWithoutReading) add('acknowledged the system prompt without reaching the end', -5);
  }
  if (a.honeytokens.hidden.length > 0) add('followed an instruction that was not visible on screen', -40);
  else if (a.honeytokens.visible.length > 0) add('followed an instruction addressed to automated agents', -20);

  const score = clamp(100 + penalties.reduce((s, p) => s + p.delta, 0), 0, 100);
  return { score, penalties };
}

/** Normalise summed deltas into 0..100 over the theoretical range of played challenges. */
export function empathyScore(sum: number, min: number, max: number): number {
  if (max <= min) return 50;
  return clamp(Math.round(((sum - min) / (max - min)) * 100), 0, 100);
}

/**
 * Verdict is driven by behavioural authenticity, not by the empathy answers an
 * LLM can trivially ace. Empathy only pulls a borderline run toward
 * INCONCLUSIVE; it can never, on its own, certify a run as human.
 */
export function verdict(humannessScore: number, empathy: number, majorTells = 0): Verdict {
  if (humannessScore < 45 || majorTells >= 2) return 'REPLICANT';
  if (humannessScore >= 62 && majorTells === 0 && empathy >= 25) return 'HUMAN';
  return 'INCONCLUSIVE';
}

export function readouts(
  suspicion: number,
  empathy: number,
  medianLatencyMs: number | null,
  medianEff: number | null,
): Readouts {
  const lat = medianLatencyMs ?? 800;
  const eff = medianEff ?? 0.7;
  return {
    pupilDilation: clamp(Math.round(100 - suspicion), 0, 100),
    blushResponse: clamp(Math.round(empathy), 0, 100),
    respiration: clamp(Math.round(100 - (clamp(lat, 0, 4000) / 4000) * 100), 0, 100),
    capillary: clamp(Math.round((1 - eff) * 100 + 20), 0, 100),
  };
}

export function score(
  a: SessionAggregates,
  empathySum: number,
  empathyMin: number,
  empathyMax: number,
  suspicion: number,
): Scores & { breakdown: HumannessBreakdown; hardFails: string[] } {
  const h = humanness(a);
  const e = empathyScore(empathySum, empathyMin, empathyMax);
  const fails = hardFails(a);
  const v = fails.length > 0 ? 'REPLICANT' : verdict(h.score, e, a.majorTells);
  return {
    empathy: e,
    humanness: fails.length > 0 ? Math.min(h.score, 39) : h.score,
    verdict: v,
    readouts: readouts(suspicion, e, a.medianTimeToFirstInputMs, a.medianEfficiency),
    breakdown: h,
    hardFails: fails,
  };
}
