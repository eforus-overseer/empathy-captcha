import { prefersReducedMotion } from './dom';

/**
 * Types `text` into `target` character by character. Clicking the target (or
 * pressing a key) finishes immediately. Resolves when the full text is shown.
 */
export function typewrite(target: HTMLElement, text: string, cps = 55): Promise<void> {
  target.textContent = '';
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');
  const live = document.createElement('span');
  target.append(live, caret);

  if (prefersReducedMotion()) {
    live.textContent = text;
    caret.remove();
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let i = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      live.textContent = text;
      caret.remove();
      target.removeEventListener('click', finish);
      resolve();
    };
    target.addEventListener('click', finish);
    const step = () => {
      if (done) return;
      i++;
      live.textContent = text.slice(0, i);
      if (i >= text.length) {
        setTimeout(finish, 180);
        return;
      }
      const ch = text[i - 1] ?? '';
      const pause = /[.,;:?!]/.test(ch) ? 220 : 1000 / cps;
      setTimeout(step, pause);
    };
    step();
  });
}
