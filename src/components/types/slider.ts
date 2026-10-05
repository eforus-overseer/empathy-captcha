import type { SliderConfig } from '../../challenges/configs';
import { el } from '../dom';
import type { Renderer } from './context';

export const renderSlider: Renderer<SliderConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const slot = el('div', { class: 'slot', text: '♥' });
    const puzzle = el('div', { class: 'puzzle', 'aria-hidden': 'true' }, slot);
    const fill = el('div', { class: 'fill' });
    const knob = el('div', { class: 'knob', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0', tabindex: '0', text: '♥' });
    const track = el('div', { class: 'track' }, fill, el('div', { class: 'track-label', text: cfg.label }), knob);
    host.append(el('div', { class: 'slider-wrap' }, puzzle, track));

    let dragging = false;
    let startT = 0;
    let value = 0;
    const KNOB = 40;
    const setValue = (v: number) => {
      value = Math.min(1, Math.max(0, v));
      const max = track.clientWidth - KNOB - 6;
      knob.style.left = `${3 + value * max}px`;
      fill.style.width = `${3 + value * max + KNOB / 2}px`;
      knob.setAttribute('aria-valuenow', String(Math.round(value * 100)));
      slot.classList.toggle('filled', value >= 0.95);
    };
    const posToValue = (clientX: number) => {
      const r = track.getBoundingClientRect();
      return (clientX - r.left - KNOB / 2) / (r.width - KNOB - 6);
    };
    knob.addEventListener('pointerdown', (e) => {
      dragging = true;
      startT = performance.now();
      ctx.recorder.input();
      knob.setPointerCapture(e.pointerId);
    });
    knob.addEventListener('pointermove', (e) => {
      if (dragging) setValue(posToValue(e.clientX));
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      const durationMs = Math.round(performance.now() - startT);
      if (value >= 0.95) setValue(1);
      resolve({ kind: 'slider', value, durationMs });
    };
    knob.addEventListener('pointerup', release);
    knob.addEventListener('pointercancel', release);
    knob.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!startT) {
          startT = performance.now();
          ctx.recorder.input();
        }
        setValue(value + (e.key === 'ArrowRight' ? 0.1 : -0.1));
        if (value >= 0.95) resolve({ kind: 'slider', value: 1, durationMs: Math.round(performance.now() - startT) });
      }
    });
  });
