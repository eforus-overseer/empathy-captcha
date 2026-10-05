import type { CheckboxConfig } from '../../challenges/configs';
import { el, sleep } from '../dom';
import type { Renderer } from './context';

export const renderCheckbox: Renderer<CheckboxConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const box = el('span', { class: 'box', 'aria-hidden': 'true' });
    const cbx = el(
      'div',
      { class: 'cbx', role: 'checkbox', 'aria-checked': 'false', tabindex: '0' },
      box,
      el('span', { text: cfg.label }),
      el('span', { class: 'brand' }, 'VK', el('br'), 'BASELINE'),
    );
    const wrap = el('div', { class: 'cbx-wrap' }, cbx);
    const skip = el('button', { class: 'btn ghost', type: 'button', text: 'Continue without confirming' });
    skip.style.visibility = 'hidden';
    host.append(wrap, skip);

    let dodgesLeft = ctx.reducedMotion ? 0 : cfg.dodges;
    let settled = false;

    const dodge = (e: PointerEvent) => {
      if (dodgesLeft <= 0 || settled || e.pointerType !== 'mouse') return;
      dodgesLeft--;
      const r = wrap.getBoundingClientRect();
      const bw = cbx.offsetWidth;
      const bh = cbx.offsetHeight;
      const x = Math.random() * (r.width - bw) + bw / 2;
      const y = Math.random() * (r.height - bh) + bh / 2;
      cbx.style.left = `${x}px`;
      cbx.style.top = `${y}px`;
    };
    cbx.addEventListener('pointerenter', dodge);

    const finish = async (checked: boolean) => {
      if (settled) return;
      settled = true;
      skip.remove();
      if (checked) {
        cbx.classList.add('checking');
        cbx.setAttribute('aria-checked', 'mixed');
        await sleep(ctx.reducedMotion ? 50 : 700);
        cbx.classList.remove('checking');
        cbx.classList.add('checked');
        cbx.setAttribute('aria-checked', 'true');
        box.textContent = '✓';
        await sleep(ctx.reducedMotion ? 50 : 500);
      }
      resolve({ kind: 'checkbox', checked });
    };

    cbx.addEventListener('click', () => void finish(true));
    cbx.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        void finish(true);
      }
    });
    skip.addEventListener('click', () => void finish(false));
    setTimeout(() => {
      if (!settled) skip.style.visibility = 'visible';
    }, 8000);
  });
