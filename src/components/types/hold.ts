import type { HoldConfig } from '../../challenges/configs';
import { jitter, type Sample } from '../../engine/stats';
import { el, relativeTo } from '../dom';
import type { Renderer } from './context';

function ring(zone: HTMLElement): { set(p: number): void } {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'hold-ring');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('cx', '50');
  c.setAttribute('cy', '50');
  c.setAttribute('r', '46');
  c.setAttribute('vector-effect', 'non-scaling-stroke');
  const len = 2 * Math.PI * 46;
  c.setAttribute('stroke-dasharray', `${len}`);
  c.setAttribute('stroke-dashoffset', `${len}`);
  svg.append(c);
  zone.append(svg);
  return { set: (p) => c.setAttribute('stroke-dashoffset', `${len * (1 - p)}`) };
}

export const renderHold: Renderer<HoldConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const zone = el('div', { class: 'hold-zone' });
    const status = el('div', { class: 'hint', text: '' });
    host.append(zone, status);
    const progress = ring(zone);

    const samples: Sample[] = [];
    let origin: { x: number; y: number } | null = null;
    let t0 = 0;
    let raf = 0;
    let done = false;

    const finish = (completed: boolean, choice?: string) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      follower?.remove();
      resolve({ kind: 'hold', completed, jitterPx: jitter(samples), ...(choice ? { choice } : {}) });
    };

    const track = (e: PointerEvent) => {
      const { x, y } = relativeTo(e, zone);
      if (t0) samples.push([performance.now() - t0, x, y]);
      if (follower) {
        follower.style.left = `${e.clientX}px`;
        follower.style.top = `${e.clientY}px`;
      }
      if (cfg.mode === 'still' && origin && t0) {
        if (Math.hypot(x - origin.x, y - origin.y) > (cfg.stillThresholdPx ?? 14)) finish(false);
      }
      if (cfg.mode === 'inside-target' && t0 && target) {
        const r = target.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d > r.width / 2) finish(false);
      }
    };
    window.addEventListener('pointermove', track, { passive: true });
    const cleanup = () => window.removeEventListener('pointermove', track);
    const startTimer = (e?: PointerEvent) => {
      if (t0) return;
      ctx.recorder.input();
      t0 = performance.now();
      if (e) origin = relativeTo(e, zone);
      const loop = () => {
        if (done) return;
        const p = Math.min(1, (performance.now() - t0) / cfg.durationMs);
        progress.set(p);
        if (target) {
          const size = 180 - p * 130;
          target.style.width = `${size}px`;
          target.style.height = `${size}px`;
        }
        if (p >= 1) {
          cleanup();
          finish(true);
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    let follower: HTMLElement | null = null;
    let target: HTMLElement | null = null;

    if (cfg.mode === 'still') {
      const glyph = el('div', { class: 'hold-glyph', 'aria-hidden': 'true', text: cfg.glyph ?? '' }, el('i', { class: 'tear' }), el('i', { class: 'tear' }));
      zone.append(glyph);
      status.textContent = 'Move your cursor into the frame to begin. Then do not move.';
      zone.addEventListener('pointerenter', (e) => startTimer(e), { once: true });
      // Touch and keyboard fallback
      const begin = el('button', { class: 'btn ghost', type: 'button', text: 'Begin' });
      begin.addEventListener('click', () => {
        begin.remove();
        startTimer();
      });
      host.append(begin);
      zone.addEventListener('pointerenter', () => begin.remove(), { once: true });
    }

    if (cfg.mode === 'inside-target') {
      target = el('div', { class: 'target', role: 'img', 'aria-label': 'iris' });
      zone.append(target);
      status.textContent = 'Move your cursor into the iris and keep it there.';
      target.addEventListener('pointerenter', (e) => {
        target?.classList.add('closing');
        startTimer(e);
      });
      target.addEventListener('pointerdown', (e) => startTimer(e));
    }

    if (cfg.mode === 'follower') {
      follower = el('div', { class: 'follower', 'aria-hidden': 'true', text: cfg.glyph ?? '' });
      document.body.append(follower);
      status.textContent = 'It is on you now.';
      const row = el('div', { class: 'row' });
      for (const label of cfg.buttons ?? ['WAIT']) {
        const b = el('button', { class: `btn ${label === 'WAIT' ? 'primary' : 'danger'}`, type: 'button', text: label });
        b.addEventListener('click', (e) => {
          if (label === 'WAIT') {
            row.querySelectorAll('button').forEach((x) => x !== b && x.setAttribute('disabled', ''));
            b.setAttribute('disabled', '');
            status.textContent = 'Waiting.';
            startTimer(e as PointerEvent);
          } else {
            cleanup();
            finish(false, label);
          }
        });
        row.append(b);
      }
      zone.append(el('div', { class: 'hold-glyph', 'aria-hidden': 'true', text: '🖱️' }));
      host.append(row);
    }

    // Safety: make sure listeners go away if the host is torn down early.
    const observer = new MutationObserver(() => {
      if (!document.body.contains(zone)) {
        cleanup();
        follower?.remove();
        observer.disconnect();
      }
    });
    observer.observe(host.parentElement ?? document.body, { childList: true, subtree: true });
  });
