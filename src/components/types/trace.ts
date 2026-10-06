import type { TraceConfig } from '../../challenges/configs';
import { el } from '../dom';
import type { Renderer } from './context';

/**
 * Follow a moving target with the cursor. Records tracking error over time.
 * Hard for automation: a teleporting pointer scores terrible coverage, and a
 * perfectly-centred follow is itself suspicious (near-zero error).
 */
export const renderTrace: Renderer<TraceConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const W = 320;
    const H = 240;
    const zone = el('div', { class: 'trace-zone' });
    zone.style.width = `${W}px`;
    zone.style.height = `${H}px`;
    const dot = el('div', { class: 'trace-dot' });
    const ring = el('div', { class: 'trace-ring' });
    ring.style.width = ring.style.height = `${cfg.tolerancePx * 2}px`;
    zone.append(ring, dot);
    const status = el('div', { class: 'hint', text: 'Move onto the marker, then follow it.' });
    host.append(el('div', { class: 'trace-wrap' }, zone, status));

    const cx = W / 2;
    const cy = H / 2;
    const target = (t: number): [number, number] => {
      const p = t / cfg.durationMs;
      const a = p * Math.PI * 2;
      if (cfg.path === 'orbit') return [cx + Math.cos(a) * 90, cy + Math.sin(a) * 70];
      if (cfg.path === 'figure8') return [cx + Math.sin(a * 2) * 100, cy + Math.sin(a) * 70];
      return [cx + Math.sin(a * 1.3) * 90, cy + Math.cos(a * 0.7) * 70];
    };

    let started = false;
    let t0 = 0;
    let raf = 0;
    let cursorX = cx;
    let cursorY = cy;
    let onTarget = 0;
    let total = 0;
    let errSum = 0;
    let samples = 0;
    let done = false;

    const move = (e: PointerEvent) => {
      const r = zone.getBoundingClientRect();
      cursorX = e.clientX - r.left;
      cursorY = e.clientY - r.top;
      if (!started) {
        const [tx, ty] = target(0);
        if (Math.hypot(cursorX - tx, cursorY - ty) < cfg.tolerancePx * 1.5) start();
      }
    };
    zone.addEventListener('pointermove', move, { passive: true });
    zone.addEventListener('pointerdown', move, { passive: true });

    const place = (t: number) => {
      const [tx, ty] = target(t);
      dot.style.left = ring.style.left = `${tx}px`;
      dot.style.top = ring.style.top = `${ty}px`;
      return [tx, ty] as [number, number];
    };
    place(0);

    function start() {
      if (started) return;
      started = true;
      ctx.recorder.input();
      t0 = performance.now();
      status.textContent = 'Follow it.';
      const loop = () => {
        if (done) return;
        const t = performance.now() - t0;
        const [tx, ty] = place(Math.min(t, cfg.durationMs));
        const d = Math.hypot(cursorX - tx, cursorY - ty);
        total++;
        errSum += d;
        samples++;
        if (d <= cfg.tolerancePx) onTarget++;
        if (t >= cfg.durationMs) return finish(true);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    const finish = (completed: boolean) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      zone.removeEventListener('pointermove', move);
      const coverage = total > 0 ? onTarget / total : 0;
      resolve({
        kind: 'trace',
        completed,
        meanErrorPx: samples > 0 ? errSum / samples : 999,
        coverage,
        sampleCount: samples,
      });
    };

    // give up after 1.5x duration if never started
    setTimeout(() => {
      if (!started) finish(false);
    }, cfg.durationMs * 2 + 4000);
  });
