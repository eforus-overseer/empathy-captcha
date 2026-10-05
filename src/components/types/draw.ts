import type { DrawConfig } from '../../challenges/configs';
import type { DrawStroke } from '../../engine/types';
import { el } from '../dom';
import type { Renderer } from './context';

/**
 * Draw with a finger (touch), pen, or mouse on a canvas. Captures each stroke
 * as parallel x/y arrays in canvas pixels and reports the pointer type, so the
 * scorer can tell a trackpad scribble from a synthetic one.
 */
export const renderDraw: Renderer<DrawConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const W = 320;
    const H = cfg.mode === 'cursive' ? 150 : 240;
    const canvas = el('canvas', { class: `draw-canvas ${cfg.mode}`, width: String(W), height: String(H), 'aria-label': cfg.mode === 'cursive' ? `Write ${cfg.word ?? ''}` : `Draw ${cfg.target ?? ''}` }) as HTMLCanvasElement;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const g = canvas.getContext('2d');
    if (g) {
      g.scale(dpr, dpr);
      g.lineWidth = cfg.mode === 'cursive' ? 2.5 : 3.5;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = '#f2b134';
    }

    // faint guide
    if (cfg.mode === 'cursive' && cfg.word && g) {
      g.save();
      g.font = 'italic 56px "Brush Script MT", "Segoe Script", cursive';
      g.fillStyle = 'rgba(242,177,52,0.12)';
      g.textBaseline = 'middle';
      g.fillText(cfg.word, 16, H / 2);
      g.restore();
    } else if (cfg.glyph && g) {
      g.save();
      g.font = `${Math.floor(H * 0.6)}px sans-serif`;
      g.globalAlpha = 0.07;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(cfg.glyph, W / 2, H / 2);
      g.restore();
    }

    const strokes: DrawStroke[] = [];
    let cur: DrawStroke | null = null;
    let drawing = false;
    let pointerType = 'mouse';
    const t0 = performance.now();
    let started = false;

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      if (!started) {
        started = true;
        ctx.recorder.input();
      }
      pointerType = e.pointerType || 'mouse';
      drawing = true;
      cur = [[], []];
      strokes.push(cur);
      const { x, y } = pos(e);
      cur[0].push(x);
      cur[1].push(y);
      canvas.setPointerCapture(e.pointerId);
      if (g) {
        g.beginPath();
        g.moveTo(x, y);
      }
    };
    const move = (e: PointerEvent) => {
      if (!drawing || !cur) return;
      const { x, y } = pos(e);
      cur[0].push(x);
      cur[1].push(y);
      if (g) {
        g.lineTo(x, y);
        g.stroke();
      }
    };
    const up = () => {
      drawing = false;
      cur = null;
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', up);

    const clearBtn = el('button', { class: 'btn ghost', type: 'button', text: 'Clear' });
    clearBtn.addEventListener('click', () => {
      strokes.length = 0;
      if (g) {
        g.clearRect(0, 0, W, H);
        if (cfg.mode === 'cursive' && cfg.word) {
          g.save();
          g.font = 'italic 56px "Brush Script MT", "Segoe Script", cursive';
          g.fillStyle = 'rgba(242,177,52,0.12)';
          g.textBaseline = 'middle';
          g.fillText(cfg.word, 16, H / 2);
          g.restore();
        }
      }
    });
    const done = el('button', { class: 'btn primary', type: 'button', text: 'Done' });
    done.addEventListener('click', () =>
      resolve({ kind: 'draw', strokes: strokes.map(([xs, ys]) => [[...xs], [...ys]]), durationMs: Math.round(performance.now() - t0), pointerType }),
    );

    const hint = el('span', { class: 'hint', text: cfg.mode === 'cursive' ? 'Use your finger on the trackpad, or the mouse.' : 'A few lines is plenty.' });
    host.append(el('div', { class: 'draw-wrap' }, canvas, hint, el('div', { class: 'row' }, clearBtn, done)));
  });
