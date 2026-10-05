/** Wires DOM events on the challenge frame into a ChallengeRecorder. */
import type { ChallengeRecorder } from '../engine/telemetry';
import { relativeTo } from './dom';

export function attachRecorder(frame: HTMLElement, rec: ChallengeRecorder): () => void {
  const onMove = (e: PointerEvent) => {
    const { x, y } = relativeTo(e, frame);
    rec.pointer(x, y);
  };
  const onDown = (e: PointerEvent) => {
    const { x, y } = relativeTo(e, frame);
    rec.click(x, y);
  };
  const onKey = (e: KeyboardEvent) => {
    // Only count keys that produce or remove text; ignore modifiers and navigation.
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ') rec.key();
  };
  const onBlur = () => rec.blur();

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('blur', onBlur);
  };
}
