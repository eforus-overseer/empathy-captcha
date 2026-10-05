/** Pure numeric helpers over recorded pointer samples and key timings. */

/** [t(ms), x, y] */
export type Sample = [number, number, number];

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

/** Interquartile range; null for fewer than 2 values. */
export function iqr(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const s = [...values].sort((a, b) => a - b);
  const q = (p: number): number => {
    const idx = (s.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    const w = idx - lo;
    return (s[lo] as number) * (1 - w) + (s[hi] as number) * w;
  };
  return q(0.75) - q(0.25);
}

export function pathLength(samples: readonly Sample[]): number {
  let len = 0;
  for (let i = 1; i < samples.length; i++) {
    const [, x0, y0] = samples[i - 1] as Sample;
    const [, x1, y1] = samples[i] as Sample;
    len += Math.hypot(x1 - x0, y1 - y0);
  }
  return len;
}

export function straightLine(samples: readonly Sample[]): number {
  if (samples.length < 2) return 0;
  const [, x0, y0] = samples[0] as Sample;
  const [, x1, y1] = samples[samples.length - 1] as Sample;
  return Math.hypot(x1 - x0, y1 - y0);
}

/** straight / path. null when there is no movement. */
export function efficiency(samples: readonly Sample[]): number | null {
  const p = pathLength(samples);
  if (p === 0) return null;
  return Math.min(1, straightLine(samples) / p);
}

/** Count heading changes greater than `thresholdRad` between consecutive segments. */
export function directionChanges(samples: readonly Sample[], thresholdRad = Math.PI / 4): number {
  let changes = 0;
  let prevAngle: number | null = null;
  for (let i = 1; i < samples.length; i++) {
    const [, x0, y0] = samples[i - 1] as Sample;
    const [, x1, y1] = samples[i] as Sample;
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (dx === 0 && dy === 0) continue;
    const angle = Math.atan2(dy, dx);
    if (prevAngle !== null) {
      let d = Math.abs(angle - prevAngle);
      if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > thresholdRad) changes++;
    }
    prevAngle = angle;
  }
  return changes;
}

/**
 * Hesitations: gaps longer than `gapMs` between consecutive timestamps (pointer
 * samples plus the challenge start) that occur before `untilMs` (first input).
 */
export function hesitations(
  times: readonly number[],
  startMs: number,
  untilMs: number | null,
  gapMs = 800,
): number {
  const limit = untilMs ?? Number.POSITIVE_INFINITY;
  const ts = [startMs, ...times.filter((t) => t <= limit)].sort((a, b) => a - b);
  if (untilMs !== null) ts.push(untilMs);
  let count = 0;
  for (let i = 1; i < ts.length; i++) {
    if ((ts[i] as number) - (ts[i - 1] as number) > gapMs) count++;
  }
  return count;
}

/** Mean absolute distance from the centroid, in px. 0 for < 2 samples. */
export function jitter(samples: readonly Sample[]): number {
  if (samples.length < 2) return 0;
  const cx = samples.reduce((s, p) => s + p[1], 0) / samples.length;
  const cy = samples.reduce((s, p) => s + p[2], 0) / samples.length;
  return samples.reduce((s, p) => s + Math.hypot(p[1] - cx, p[2] - cy), 0) / samples.length;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Mean straight-line/path efficiency over the segments between consecutive
 * clicks (and from start to the first click). A bot that moves directly to
 * each target scores ~1 here even when its overall path wanders.
 * null when no segment contains movement.
 */
export function segmentEfficiency(samples: readonly Sample[], clickTimes: readonly number[]): number | null {
  const cuts = [...clickTimes].sort((a, b) => a - b);
  const effs: number[] = [];
  let start = 0;
  for (const cut of [...cuts, Number.POSITIVE_INFINITY]) {
    const seg = samples.slice(start).filter((s) => s[0] <= cut);
    const e = efficiency(seg);
    if (e !== null) effs.push(e);
    start += seg.length;
    if (cut === Number.POSITIVE_INFINITY) break;
  }
  if (effs.length === 0) return null;
  return effs.reduce((a, b) => a + b, 0) / effs.length;
}
