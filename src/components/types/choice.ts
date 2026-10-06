import type { ChoiceConfig } from '../../challenges/configs';
import { el } from '../dom';
import { iconEl } from '../icons';
import type { Renderer } from './context';

export const renderChoice: Renderer<ChoiceConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const gated: HTMLElement[] = [];
    ctx.gate.onReady(() => gated.forEach((b) => b.removeAttribute('disabled')));
    if (cfg.icon) host.append(iconEl(cfg.icon, 'visual-icon'));
    else if (cfg.visual) host.append(el('div', { class: 'visual', 'aria-hidden': 'true', text: cfg.visual }));
    if (cfg.tiles) {
      const wrap = el('div', { class: 'choice-tiles' });
      cfg.tiles.forEach((t, i) => {
        const b = el('button', { class: `tile ${t.css ?? ''}`.trim(), type: 'button', 'aria-label': t.label });
        if (t.icon) b.append(iconEl(t.icon, 'tile-icon'));
        else b.append(el('span', { class: 'tile-glyph', text: t.glyph ?? t.label }));
        b.setAttribute('disabled', '');
        gated.push(b);
        b.addEventListener('click', () => resolve({ kind: 'choice', index: i, label: cfg.options[i] ?? t.label }));
        wrap.append(b);
      });
      host.append(wrap);
      return;
    }
    const list = el('div', { class: 'choices', role: 'group' });
    cfg.options.forEach((label, i) => {
      const b = el('button', { class: 'btn', type: 'button', text: label });
      b.setAttribute('disabled', '');
      gated.push(b);
      b.addEventListener('click', () => resolve({ kind: 'choice', index: i, label }));
      list.append(b);
    });
    host.append(list);
  });
