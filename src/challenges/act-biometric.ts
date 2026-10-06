/**
 * Biometric challenges built to resist automation: follow a moving target,
 * and tap in time with a pulse. Both record fine-grained timing and movement,
 * and flag the two machine tells: inhuman precision and no relationship to the
 * stimulus at all.
 */
import type { Challenge } from '../engine/types';
import type { RhythmConfig, TraceConfig } from './configs';
import { ev, tell } from './helpers';

function trace(id: string, act: 1 | 2 | 3, prompt: string, path: TraceConfig['path'], durationMs: number): Challenge {
  return {
    id,
    act,
    type: 'trace',
    tags: ['behavioural'],
    prompt,
    config: { durationMs, tolerancePx: 26, path } satisfies TraceConfig,
    empathyRange: [0, 1],
    minSolveMs: 0,
    evaluate: (a) => {
      if (a.kind !== 'trace') return ev(0, 0, '');
      if (!a.completed || a.sampleCount < 10)
        return ev(0, 10, 'You did not follow it. A cursor that will not track is a tell.', tell('major', 'failed to track a moving target'));
      if (a.meanErrorPx < 3)
        return ev(0, 16, 'You tracked it to the pixel. No hand is that steady.', tell('fatal', 'tracked a moving target with inhuman precision'));
      if (a.coverage < 0.3)
        return ev(0, 10, 'You were never really on it.', tell('major', 'could not keep a cursor on a moving target'));
      if (a.coverage > 0.55) return ev(1, -4, 'You stayed with it. A little behind, the way people are.');
      return ev(0, 3, 'You lost it more than once. Human enough.');
    },
  };
}

function rhythm(id: string, act: 1 | 2 | 3, prompt: string, beats: number, intervalMs: number): Challenge {
  return {
    id,
    act,
    type: 'rhythm',
    tags: ['behavioural'],
    prompt,
    config: { beats, intervalMs } satisfies RhythmConfig,
    empathyRange: [0, 1],
    minSolveMs: 0,
    evaluate: (a) => {
      if (a.kind !== 'rhythm') return ev(0, 0, '');
      if (a.taps < Math.max(2, a.expected - 2))
        return ev(0, 10, 'You missed the beat entirely.', tell('major', 'could not tap in time with a pulse'));
      if (a.offsetIqrMs !== null && a.offsetIqrMs < 6)
        return ev(0, 16, 'Every tap the same distance off. That is a metronome, not a person.', tell('fatal', 'tapped with metronomic precision'));
      if (a.meanAbsOffsetMs > 320)
        return ev(0, 10, 'Your taps had no relation to the beat.', tell('major', 'taps unrelated to the pulse'));
      if (a.meanAbsOffsetMs < 220) return ev(1, -4, 'You felt the beat. Off by a little, like people are.');
      return ev(0, 2, 'Loosely in time.');
    },
  };
}

export const actBiometric: Challenge[] = [
  trace('trace-orbit', 1, 'A marker will move. Keep your cursor on it.', 'orbit', 5000),
  trace('trace-drift', 2, 'Follow the marker. Do not anticipate it.', 'drift', 6000),
  trace('trace-figure8', 3, 'One more. Stay with the marker.', 'figure8', 6000),
  rhythm('rhythm-slow', 1, 'Tap along with the pulse. Space bar or the button.', 6, 760),
  rhythm('rhythm-mid', 2, 'Again, a little faster. Tap on each pulse.', 8, 560),
  rhythm('rhythm-heart', 3, 'This is a resting heartbeat. Tap with it.', 8, 820),
];
