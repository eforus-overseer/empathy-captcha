import type { SolveGate } from './types/context';

/** Creates a solve-time gate that opens after `minMs`, with a progress callback. */
export function createGate(minMs: number, onProgress?: (pct: number) => void): SolveGate {
  const start = performance.now();
  let ready = minMs <= 0;
  const waiters: (() => void)[] = [];

  if (!ready) {
    const tick = () => {
      const pct = Math.min(1, (performance.now() - start) / minMs);
      onProgress?.(pct);
      if (pct >= 1) {
        ready = true;
        onProgress?.(1);
        waiters.splice(0).forEach((w) => w());
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  } else {
    onProgress?.(1);
  }

  return {
    ready: () => ready,
    whenReady: () =>
      ready ? Promise.resolve() : new Promise<void>((res) => waiters.push(res)),
    onReady: (cb) => (ready ? cb() : waiters.push(cb)),
  };
}

/** Default minimum solve time by challenge type, in ms. Time-based types gate themselves. */
export function defaultMinSolveMs(type: string): number {
  switch (type) {
    case 'hold':
    case 'wait':
    case 'trace':
    case 'rhythm':
      return 0;
    case 'text':
    case 'draw':
      return 1800;
    case 'choice':
      return 1400;
    default:
      return 1000;
  }
}
