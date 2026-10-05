import type { Answer, Evaluation } from '../engine/types';

export const ev = (empathyDelta: number, suspicionDelta: number, note: string): Evaluation => ({
  empathyDelta,
  suspicionDelta,
  note,
});

export function textOf(a: Answer): string {
  return a.kind === 'text' ? a.text.trim() : '';
}

export function hasAny(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

export function isNearRoundSecond(ms: number, toleranceMs = 5): boolean {
  const r = ms % 1000;
  return r <= toleranceMs || 1000 - r <= toleranceMs;
}
