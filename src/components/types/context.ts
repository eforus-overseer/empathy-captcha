import type { ChallengeRecorder } from '../../engine/telemetry';
import type { Answer } from '../../engine/types';

export interface SolveGate {
  /** True once the minimum solve time has elapsed. */
  ready(): boolean;
  /** Resolves when the minimum solve time has elapsed. */
  whenReady(): Promise<void>;
  /** Invokes cb immediately if ready, otherwise when it becomes ready. */
  onReady(cb: () => void): void;
}

export interface RenderCtx {
  recorder: ChallengeRecorder;
  frame: HTMLElement;
  reducedMotion: boolean;
  gate: SolveGate;
}

export type Renderer<C> = (host: HTMLElement, config: C, ctx: RenderCtx) => Promise<Answer>;
