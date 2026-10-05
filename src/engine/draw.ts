/**
 * Pure helpers for the drawing challenges: normalise strokes into a square
 * occupancy grid, compare shapes, classify a sketch against Quick, Draw!
 * templates, and summarise the behaviour of the hand that drew it.
 *
 * No DOM. Strokes are [xs, ys] arrays in whatever pixel space the renderer
 * captured; everything here is scale- and translation-invariant.
 */
import type { DrawStroke } from './types';

export interface DrawStats {
  strokeCount: number;
  pointCount: number;
  inkLength: number;
  /** Mean deviation of per-segment heading, radians. Straight machine lines ~0. */
  wobble: number;
  /** Pixels per ms, averaged over moving segments. */
  meanSpeed: number;
  /** Coefficient of variation of segment speeds. Constant-speed draws ~0. */
  speedVariation: number;
  bbox: { w: number; h: number } | null;
}

function flat(strokes: readonly DrawStroke[]): { xs: number[]; ys: number[]; breaks: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  const breaks: number[] = [];
  for (const [sx, sy] of strokes) {
    breaks.push(xs.length);
    const n = Math.min(sx.length, sy.length);
    for (let i = 0; i < n; i++) {
      xs.push(sx[i] as number);
      ys.push(sy[i] as number);
    }
  }
  return { xs, ys, breaks };
}

export function bbox(strokes: readonly DrawStroke[]): { x: number; y: number; w: number; h: number } | null {
  const { xs, ys } = flat(strokes);
  if (xs.length === 0) return null;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Rasterise strokes into a size*size occupancy grid, normalised to the bounding box. */
export function rasterize(strokes: readonly DrawStroke[], size = 16): Float64Array {
  const grid = new Float64Array(size * size);
  const box = bbox(strokes);
  if (!box) return grid;
  const scale = Math.max(box.w, box.h) || 1;
  const offX = (scale - box.w) / 2;
  const offY = (scale - box.h) / 2;
  const put = (x: number, y: number) => {
    const gx = Math.min(size - 1, Math.max(0, Math.floor(((x - box.x + offX) / scale) * size)));
    const gy = Math.min(size - 1, Math.max(0, Math.floor(((y - box.y + offY) / scale) * size)));
    grid[gy * size + gx] = 1;
  };
  for (const [sx, sy] of strokes) {
    const n = Math.min(sx.length, sy.length);
    for (let i = 0; i < n; i++) {
      put(sx[i] as number, sy[i] as number);
      if (i > 0) {
        // interpolate so sparse strokes still fill the grid
        const x0 = sx[i - 1] as number;
        const y0 = sy[i - 1] as number;
        const x1 = sx[i] as number;
        const y1 = sy[i] as number;
        const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (scale / size));
        for (let k = 1; k < steps; k++) put(x0 + ((x1 - x0) * k) / steps, y0 + ((y1 - y0) * k) / steps);
      }
    }
  }
  return grid;
}

/** Cosine similarity of two occupancy grids, 0..1. */
export function similarity(a: Float64Array, b: Float64Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] as number;
    const bv = b[i] as number;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface Classification {
  best: string | null;
  score: number; // mean of top-k template similarities for the best class
  perClass: Record<string, number>;
}

/**
 * Classify a drawing against template strokes grouped by class name. For each
 * class we take the mean of the top-k most similar templates, then pick the
 * best class. Templates are pre-rasterised lazily and cached by the caller.
 */
export function classify(
  strokes: readonly DrawStroke[],
  templates: Record<string, Float64Array[]>,
  opts: { size?: number; topK?: number } = {},
): Classification {
  const size = opts.size ?? 16;
  const topK = opts.topK ?? 3;
  const g = rasterize(strokes, size);
  const perClass: Record<string, number> = {};
  let best: string | null = null;
  let bestScore = 0;
  for (const [name, grids] of Object.entries(templates)) {
    const sims = grids.map((t) => similarity(g, t)).sort((a, b) => b - a);
    const top = sims.slice(0, topK);
    const mean = top.length ? top.reduce((a, b) => a + b, 0) / top.length : 0;
    perClass[name] = mean;
    if (mean > bestScore) {
      bestScore = mean;
      best = name;
    }
  }
  return { best, score: bestScore, perClass };
}

export function drawStats(strokes: readonly DrawStroke[], durationMs: number): DrawStats {
  const box = bbox(strokes);
  let pointCount = 0;
  let inkLength = 0;
  const headings: number[] = [];
  const speeds: number[] = [];
  for (const [sx, sy] of strokes) {
    const n = Math.min(sx.length, sy.length);
    pointCount += n;
    let prevAngle: number | null = null;
    for (let i = 1; i < n; i++) {
      const dx = (sx[i] as number) - (sx[i - 1] as number);
      const dy = (sy[i] as number) - (sy[i - 1] as number);
      const d = Math.hypot(dx, dy);
      inkLength += d;
      if (d > 0) {
        speeds.push(d);
        const a = Math.atan2(dy, dx);
        if (prevAngle !== null) {
          let diff = Math.abs(a - prevAngle);
          if (diff > Math.PI) diff = 2 * Math.PI - diff;
          headings.push(diff);
        }
        prevAngle = a;
      }
    }
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const meanSpeedPx = mean(speeds);
  const sd = speeds.length
    ? Math.sqrt(mean(speeds.map((s) => (s - meanSpeedPx) ** 2)))
    : 0;
  return {
    strokeCount: strokes.length,
    pointCount,
    inkLength,
    wobble: mean(headings),
    meanSpeed: durationMs > 0 ? inkLength / durationMs : 0,
    speedVariation: meanSpeedPx > 0 ? sd / meanSpeedPx : 0,
    bbox: box ? { w: box.w, h: box.h } : null,
  };
}
