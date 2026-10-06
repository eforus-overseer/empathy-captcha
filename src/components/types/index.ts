import type { Challenge, ChallengeType } from '../../engine/types';
import type {
  CheckboxConfig,
  ChoiceConfig,
  GridConfig,
  HoldConfig,
  SliderConfig,
  TextConfig,
  WaitConfig,
  DrawConfig,
  TraceConfig,
  RhythmConfig,
  MathConfig,
} from '../../challenges/configs';
import { renderCheckbox } from './checkbox';
import { renderChoice } from './choice';
import { renderDraw } from './draw';
import { renderRhythm } from './rhythm';
import { renderMath } from './math';
import { renderTrace } from './trace';
import type { RenderCtx, Renderer } from './context';
import { renderGrid } from './grid';
import { renderHold } from './hold';
import { renderSlider } from './slider';
import { renderText } from './text';
import { renderWait } from './wait';

const renderers: { [K in ChallengeType]: Renderer<never> } = {
  checkbox: renderCheckbox as Renderer<never>,
  grid: renderGrid as Renderer<never>,
  text: renderText as Renderer<never>,
  choice: renderChoice as Renderer<never>,
  hold: renderHold as Renderer<never>,
  slider: renderSlider as Renderer<never>,
  wait: renderWait as Renderer<never>,
  draw: renderDraw as Renderer<never>,
  trace: renderTrace as Renderer<never>,
  rhythm: renderRhythm as Renderer<never>,
  math: renderMath as Renderer<never>,
};

export type AnyConfig = CheckboxConfig | GridConfig | TextConfig | ChoiceConfig | HoldConfig | SliderConfig | WaitConfig | DrawConfig | TraceConfig | RhythmConfig | MathConfig;

export function renderChallenge(host: HTMLElement, c: Challenge, ctx: RenderCtx) {
  const r = renderers[c.type] as Renderer<unknown>;
  return r(host, c.config, ctx);
}

export type { RenderCtx };
