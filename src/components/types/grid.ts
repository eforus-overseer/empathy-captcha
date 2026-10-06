import type { GridConfig } from '../../challenges/configs';
import { el } from '../dom';
import { iconEl } from '../icons';
import type { Renderer } from './context';

export const renderGrid: Renderer<GridConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const selected = new Set<number>();
    const grid = el('div', { class: 'grid', role: 'group' });
    const tiles = cfg.tiles.map((t, i) => {
      const tile = el('button', {
        class: `tile ${t.css ?? ''}`.trim(),
        type: 'button',
        'aria-pressed': 'false',
        'aria-label': t.label,
      });
      if (t.icon) tile.append(iconEl(t.icon, 'tile-icon'));
      else if (t.glyph) tile.append(el('span', { class: 'tile-glyph', text: t.glyph }));
      tile.addEventListener('click', () => {
        if (cfg.mode === 'single') {
          selected.clear();
          tiles.forEach((x) => {
            x.classList.remove('selected');
            x.setAttribute('aria-pressed', 'false');
          });
        }
        if (selected.has(i)) selected.delete(i);
        else selected.add(i);
        const on = selected.has(i);
        tile.classList.toggle('selected', on);
        tile.setAttribute('aria-pressed', String(on));
      });
      return tile;
    });
    grid.append(...tiles);
    const verify = el('button', { class: 'btn primary', type: 'button', text: cfg.submitLabel ?? 'Verify' });
    verify.setAttribute('disabled', '');
    ctx.gate.onReady(() => verify.removeAttribute('disabled'));
    verify.addEventListener('click', () => resolve({ kind: 'grid', selected: [...selected].sort((a, b) => a - b) }));
    host.append(grid, verify);
  });
