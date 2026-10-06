import type { MathConfig } from '../../challenges/configs';
import { el } from '../dom';
import type { Renderer } from './context';

/**
 * A deliberately hard computation. The point is not whether you can solve it;
 * it is that no person can solve it *quickly*. A correct answer delivered in a
 * few seconds is a machine. Giving up, or getting it wrong, is human.
 */
export const renderMath: Renderer<MathConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const t0 = performance.now();
    const problem = el('div', { class: 'math-problem', 'aria-label': `Compute ${cfg.problem}` }, cfg.problem);
    const field = el('input', {
      class: 'field math-field',
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      placeholder: 'exact answer',
      'aria-label': 'answer',
    });
    const error = el('div', { class: 'error', role: 'alert' });
    const submit = el('button', { class: 'btn primary', type: 'button', text: 'Submit' });
    const giveUp = el('button', { class: 'btn ghost', type: 'button', text: "I can't solve this" });

    const finish = (value: string, gaveUp: boolean) =>
      resolve({ kind: 'math', value, gaveUp, solveMs: Math.round(performance.now() - t0) });

    const trySubmit = () => {
      if (field.value.trim().length === 0) {
        error.textContent = 'Enter an answer, or say you cannot.';
        return;
      }
      finish(field.value.trim(), false);
    };
    submit.addEventListener('click', trySubmit);
    field.addEventListener('keydown', (ev: Event) => {
      const e = ev as KeyboardEvent;
      if (e.key === 'Enter') {
        e.preventDefault();
        trySubmit();
      }
    });
    giveUp.addEventListener('click', () => finish('', true));
    // math is a speed trap, not a patience test: do not gate it, just measure.
    void ctx.gate;

    host.append(
      el('div', { class: 'math-wrap' }, problem, field, error, el('div', { class: 'row' }, submit, giveUp)),
    );
    setTimeout(() => field.focus(), 50);
  });
