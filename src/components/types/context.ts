import type { ChallengeRecorder } from '../../engine/telemetry';
import type { Answer } from '../../engine/types';

export interface RenderCtx {
  recorder: ChallengeRecorder;
  frame: HTMLElement;
  reducedMotion: boolean;
}

export type Renderer<C> = (host: HTMLElement, config: C, ctx: RenderCtx) => Promise<Answer>;
