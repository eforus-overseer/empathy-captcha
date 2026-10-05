import type { WaitConfig } from '../../challenges/configs';
import { el } from '../dom';
import type { Renderer } from './context';

export const renderWait: Renderer<WaitConfig> = (host, cfg) =>
  new Promise((resolve) => {
    const t0 = performance.now();
    const b = el('button', { class: 'btn', type: 'button', text: cfg.label });
    b.addEventListener('click', () => resolve({ kind: 'wait', waitedMs: Math.round(performance.now() - t0) }));
    host.append(el('div', { class: 'wait-wrap' }, b));
  });
