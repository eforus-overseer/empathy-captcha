import type { RhythmConfig } from '../../challenges/configs';
import { iqr } from '../../engine/stats';
import { el } from '../dom';
import type { Renderer } from './context';

/**
 * Tap in time with a pulse. Records the signed offset from each beat. Humans
 * drift with a characteristic ~40-120ms spread; automation taps either with
 * machine precision (near-zero spread) or with no relation to the beat.
 */
export const renderRhythm: Renderer<RhythmConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    const pulse = el('div', { class: 'rhythm-pulse' });
    const tapBtn = el('button', { class: 'btn primary rhythm-tap', type: 'button', text: 'Tap' });
    const counter = el('div', { class: 'hint', text: `0 / ${cfg.beats}` });
    host.append(el('div', { class: 'rhythm-wrap' }, pulse, el('div', { class: 'row' }, tapBtn), counter));

    const beatTimes: number[] = [];
    const taps: number[] = [];
    let started = false;
    let beat = 0;
    let timer = 0;
    let done = false;

    const beatPulse = () => {
      pulse.classList.remove('on');
      void pulse.offsetWidth;
      pulse.classList.add('on');
      beatTimes.push(performance.now());
      beat++;
      if (beat >= cfg.beats + 1) {
        window.clearInterval(timer);
        setTimeout(() => finish(), cfg.intervalMs);
        return;
      }
    };

    const start = () => {
      if (started) return;
      started = true;
      ctx.recorder.input();
      beatPulse();
      timer = window.setInterval(beatPulse, cfg.intervalMs);
    };

    const tap = () => {
      if (!started) {
        start();
        return;
      }
      if (done || beatTimes.length === 0) return;
      taps.push(performance.now());
    };
    tapBtn.addEventListener('click', tap);
    const key = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', key);

    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', key);
      window.clearInterval(timer);
      // match each tap to the nearest beat, record signed offset
      const offsets: number[] = [];
      for (const t of taps) {
        let best = Infinity;
        for (const b of beatTimes) {
          const d = t - b;
          if (Math.abs(d) < Math.abs(best)) best = d;
        }
        if (Number.isFinite(best)) offsets.push(Math.round(best));
      }
      const absMean = offsets.length ? offsets.reduce((a, b) => a + Math.abs(b), 0) / offsets.length : 999;
      resolve({
        kind: 'rhythm',
        taps: taps.length,
        expected: cfg.beats,
        offsetsMs: offsets,
        offsetIqrMs: iqr(offsets),
        meanAbsOffsetMs: Math.round(absMean),
      });
    };

    counter.textContent = `Tap to begin · 0 / ${cfg.beats}`;
    const updateCount = () => (counter.textContent = `${taps.length} / ${cfg.beats}`);
    tapBtn.addEventListener('click', updateCount);
    window.addEventListener('keydown', (e) => e.key === ' ' && updateCount());
  });
