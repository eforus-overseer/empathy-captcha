/** Seeded PRNG (mulberry32) so a run can be replayed with ?seed=. */

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** Weighted pick; weights must be positive. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T;
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (n) => Math.floor(next() * n),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick from empty list');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = tmp;
      }
      return out;
    },
    weighted: (items, weight) => {
      if (items.length === 0) throw new Error('weighted pick from empty list');
      const weights = items.map((it) => Math.max(0, weight(it)));
      const total = weights.reduce((s, w) => s + w, 0);
      if (total <= 0) return rng.pick(items);
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i] as number;
        if (r < 0) return items[i] as (typeof items)[number];
      }
      return items[items.length - 1] as (typeof items)[number];
    },
  };
  return rng;
}

/** Parse a seed from a URL parameter; falls back to a random 31-bit int. */
export function parseSeed(raw: string | null | undefined, fallback = () => randomSeed()): number {
  if (raw == null || raw.trim() === '') return fallback();
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return fallback();
  return n >>> 0;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}
