/** Empathy, humanness and verdict. Pure functions; thresholds per spec §7. */
import { clamp } from './stats';
import type { ChallengeStats, Readouts, Scores, Verdict } from './types';

export interface SessionAggregates {
  medianTimeToFirstInputMs: number | null;
  medianEfficiency: number | null;
  keyIntervalIqrMs: number | null;
  totalPointerSamples: number;
  totalClicks: number;
  totalHesitations: number;
  webdriver: boolean;
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
): SessionAggregates {
  const latencies = perChallenge
    .map((s) => s.timeToFirstInputMs)
    .filter((v): v is number => v !== null);
  const effs = perChallenge.map((s) => s.efficiency).filter((v): v is number => v !== null);
  return {
    medianTimeToFirstInputMs: medianFn(latencies),
    medianEfficiency: medianFn(effs),
    keyIntervalIqrMs: iqrFn(allKeyIntervals),
    totalPointerSamples: perChallenge.reduce((s, c) => s + c.pointerSampleCount, 0),
    totalClicks: perChallenge.reduce((s, c) => s + c.clickCount, 0),
    totalHesitations: perChallenge.reduce((s, c) => s + c.hesitations, 0),
    webdriver,
  };
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

  const score = clamp(100 + penalties.reduce((s, p) => s + p.delta, 0), 0, 100);
  return { score, penalties };
}

/** Normalise summed deltas into 0..100 over the theoretical range of played challenges. */
export function empathyScore(sum: number, min: number, max: number): number {
  if (max <= min) return 50;
  return clamp(Math.round(((sum - min) / (max - min)) * 100), 0, 100);
}

export function verdict(humannessScore: number, empathy: number): Verdict {
  if (humannessScore >= 55 && empathy >= 50) return 'HUMAN';
  if (humannessScore < 40 || empathy < 30) return 'REPLICANT';
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
): Scores & { breakdown: HumannessBreakdown } {
  const h = humanness(a);
  const e = empathyScore(empathySum, empathyMin, empathyMax);
  return {
    empathy: e,
    humanness: h.score,
    verdict: verdict(h.score, e),
    readouts: readouts(suspicion, e, a.medianTimeToFirstInputMs, a.medianEfficiency),
    breakdown: h,
  };
}
