/** Chooses which challenges a run plays, driven by a suspicion meter. */
import type { Rng } from './rng';
import { clamp } from './stats';
import type { Act, Challenge } from './types';

export const PLAN_PER_ACT: Record<Act, number> = { 1: 4, 2: 6, 3: 5 };
export const FIRST_ID = 'not-a-robot';
export const LAST_ID = 'not-sure-anymore';
export const MUST_INCLUDE: Record<Act, string[]> = { 1: [FIRST_ID], 2: ['tortoise'], 3: [LAST_ID] };

export const SUSPICION_START = 35;

export interface DirectorOptions {
  /** Play every registered challenge in registry order. */
  all?: boolean;
}

export class Director {
  private suspicionValue = SUSPICION_START;
  private readonly played: string[] = [];
  private readonly queue: Challenge[] = [];
  private readonly pools: Record<Act, Challenge[]>;
  private currentAct: Act = 1;
  private readonly all: boolean;

  constructor(
    private readonly registry: readonly Challenge[],
    private readonly rng: Rng,
    opts: DirectorOptions = {},
  ) {
    this.all = opts.all ?? false;
    this.pools = { 1: [], 2: [], 3: [] };
    for (const c of registry) this.pools[c.act].push(c);
    if (this.all) this.queue.push(...registry);
  }

  get suspicion(): number {
    return this.suspicionValue;
  }

  get playedIds(): readonly string[] {
    return this.played;
  }

  get total(): number {
    return this.all ? this.registry.length : PLAN_PER_ACT[1] + PLAN_PER_ACT[2] + PLAN_PER_ACT[3];
  }

  adjustSuspicion(delta: number): void {
    this.suspicionValue = clamp(this.suspicionValue + delta, 0, 100);
  }

  /** Returns the next challenge, or null when the run is complete. */
  next(): Challenge | null {
    if (this.all) {
      const c = this.queue.shift() ?? null;
      if (c) this.played.push(c.id);
      return c;
    }
    const act = this.actForIndex(this.played.length);
    if (act === null) return null;
    this.currentAct = act;
    const c = this.pickFromAct(act);
    if (c) this.played.push(c.id);
    return c;
  }

  private actForIndex(i: number): Act | null {
    const a1 = PLAN_PER_ACT[1];
    const a2 = a1 + PLAN_PER_ACT[2];
    const a3 = a2 + PLAN_PER_ACT[3];
    if (i < a1) return 1;
    if (i < a2) return 2;
    if (i < a3) return 3;
    return null;
  }

  private remainingInAct(act: Act): number {
    const before = act === 1 ? 0 : act === 2 ? PLAN_PER_ACT[1] : PLAN_PER_ACT[1] + PLAN_PER_ACT[2];
    return PLAN_PER_ACT[act] - (this.played.length - before);
  }

  private pickFromAct(act: Act): Challenge | null {
    const candidates = this.pools[act].filter((c) => !this.played.includes(c.id));
    if (candidates.length === 0) return null;

    const remaining = this.remainingInAct(act);
    const mustIds = MUST_INCLUDE[act].filter((id) => !this.played.includes(id));

    // Anchors: FIRST_ID opens the run, LAST_ID closes it, others when slots run out.
    if (act === 1 && this.played.length === 0) {
      return candidates.find((c) => c.id === FIRST_ID) ?? candidates[0] ?? null;
    }
    if (act === 3 && remaining === 1) {
      return candidates.find((c) => c.id === LAST_ID) ?? candidates[0] ?? null;
    }
    const nonLastMust = mustIds.filter((id) => id !== LAST_ID);
    if (nonLastMust.length > 0 && remaining - (mustIds.includes(LAST_ID) ? 1 : 0) <= nonLastMust.length) {
      const id = nonLastMust[0] as string;
      return candidates.find((c) => c.id === id) ?? null;
    }

    const eligible = candidates.filter((c) => c.id !== LAST_ID);
    const pool = eligible.length ? eligible : candidates;
    return this.rng.weighted(pool, (c) => this.weightFor(c));
  }

  private weightFor(c: Challenge): number {
    const s = this.suspicionValue;
    const harsh = c.tags.includes('harsh');
    const silly = c.tags.includes('silly');
    if (s > 60) return harsh ? 3 : silly ? 1 : 2;
    if (s < 40) return silly ? 3 : harsh ? 1 : 2;
    return 2;
  }

  get act(): Act {
    return this.currentAct;
  }
}
