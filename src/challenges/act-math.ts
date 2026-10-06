/**
 * Math challenges, built as a speed trap rather than a quiz. These problems are
 * too hard to compute quickly by hand, so a correct answer delivered fast is a
 * machine. Giving up or getting it wrong is the human response and is rewarded.
 */
import type { Challenge, Act } from '../engine/types';
import type { MathConfig } from './configs';
import { ev, tell } from './helpers';

const normalise = (s: string) => s.toLowerCase().replace(/[\s,]/g, '').replace(/^\+/, '');

function math(id: string, act: Act, problem: string, answer: string, humanFloorMs: number): Challenge {
  return {
    id,
    act,
    type: 'math',
    tags: ['behavioural', 'harsh'],
    prompt: 'Compute this exactly. If you cannot, say so.',
    config: { problem, answer, humanFloorMs } satisfies MathConfig,
    empathyRange: [0, 1],
    minSolveMs: 0,
    evaluate: (a) => {
      if (a.kind !== 'math') return ev(0, 0, '');
      if (a.gaveUp || a.value.length === 0)
        return ev(1, -3, 'No one does that in their head. Honest.');
      const correct = normalise(a.value) === normalise(answer);
      const secs = (a.solveMs / 1000).toFixed(1);
      if (correct && a.solveMs < humanFloorMs)
        return ev(
          0,
          18,
          `Exact, in ${secs} seconds. No person computes that that fast.`,
          tell('fatal', `solved a hard computation in ${secs}s`),
        );
      if (correct)
        return ev(0, 6, 'Exact. You either took your time or reached for a tool.', tell('minor', 'produced an exact answer to a hard computation'));
      return ev(0, 1, 'Wrong. People get these wrong. That is fine.');
    },
  };
}

export const actMath: Challenge[] = [
  math('math-mult-1', 1, '4,871,923 × 638,417', '3110318465891', 9000),
  math('math-mult-2', 1, '92,837 × 71,649', '6651678213', 8000),
  math('math-sqrt', 1, 'the largest whole number whose square is below 987,654,321', '31426', 10000),
  math('math-mult-3', 2, '6,043 × 8,117 × 29', '1422479899', 10000),
  math('math-modpow-1', 2, '17 raised to the 23rd power, modulo 1000', '713', 12000),
  math('math-factorial', 2, '13! (thirteen factorial)', '6227020800', 9000),
  math('math-modpow-2', 3, '3 raised to the 50th power, modulo 1000', '249', 12000),
  math('math-primes', 3, 'the 100th prime number', '541', 14000),
  math('math-squares', 3, 'the sum of the first 50 square numbers (1 + 4 + 9 + … + 2500)', '42925', 11000),
];
