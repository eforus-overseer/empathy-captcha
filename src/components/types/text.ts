import type { TextConfig } from '../../challenges/configs';
import { el } from '../dom';
import type { Renderer } from './context';

type SoundKind = 'whale' | 'heartbeat' | 'rain';

/** Synthesise one of a few evocative sounds with the Web Audio API. */
function playSound(kind: SoundKind): Promise<void> {
  return new Promise((resolve) => {
    const AC = window.AudioContext;
    if (!AC) return resolve();
    const ctx = new AC();
    const t0 = ctx.currentTime;
    let dur = 3.2;

    if (kind === 'whale') {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      gain.connect(ctx.destination);
      for (const [f0, f1, detune] of [[82, 146, 0], [82, 146, 7]] as const) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.detune.value = detune;
        o.frequency.setValueAtTime(f0, t0);
        o.frequency.exponentialRampToValueAtTime(f1, t0 + dur * 0.55);
        o.frequency.exponentialRampToValueAtTime(f0 * 1.1, t0 + dur);
        o.connect(gain);
        o.start(t0);
        o.stop(t0 + dur);
      }
    } else if (kind === 'heartbeat') {
      dur = 5.6;
      const beats = 7;
      const interval = 0.72;
      for (let i = 0; i < beats; i++) {
        for (const [at, f] of [[i * interval, 60], [i * interval + 0.18, 48]] as const) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t0 + at);
          g.gain.exponentialRampToValueAtTime(0.5, t0 + at + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.22);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(t0 + at);
          o.stop(t0 + at + 0.3);
        }
      }
    } else {
      // rain: filtered white noise
      dur = 3.6;
      const frames = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.6;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.5, t0 + 0.4);
      gain.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t0);
      src.stop(t0 + dur);
    }

    setTimeout(() => {
      void ctx.close();
      resolve();
    }, dur * 1000 + 120);
  });
}

export const renderText: Renderer<TextConfig> = (host, cfg, ctx) =>
  new Promise((resolve) => {
    if (cfg.distortedWord) {
      const word = el('div', { class: 'distorted', 'aria-hidden': 'true' });
      for (const ch of cfg.distortedWord) word.append(el('span', { text: ch }));
      host.append(word, el('span', { class: 'sr-only', text: `The distorted word reads ${cfg.distortedWord}` }));
    }
    if (cfg.audio) {
      const wave = el('span', { class: 'audio-wave', 'aria-hidden': 'true' }, el('i'), el('i'), el('i'), el('i'));
      const play = el('button', { class: 'btn audio-btn', type: 'button' }, '▶ Play', wave);
      play.addEventListener('click', async () => {
        ctx.recorder.input();
        play.classList.add('playing');
        play.setAttribute('disabled', '');
        await playSound(cfg.audio as SoundKind);
        play.classList.remove('playing');
        play.removeAttribute('disabled');
      });
      host.append(play);
    }

    const field = cfg.multiline
      ? el('textarea', { class: 'field', placeholder: cfg.placeholder, 'aria-label': 'answer' })
      : el('input', { class: 'field', type: 'text', placeholder: cfg.placeholder, autocomplete: 'off', 'aria-label': 'answer' });
    if (cfg.maxLength) field.setAttribute('maxlength', String(cfg.maxLength));
    const error = el('div', { class: 'error', role: 'alert' });
    const submit = el('button', { class: 'btn primary', type: 'button', text: 'Submit' });

    const trySubmit = () => {
      const text = field.value;
      const err = cfg.validate ? cfg.validate(text) : null;
      if (err) {
        error.textContent = err;
        return;
      }
      resolve({ kind: 'text', text });
    };
    submit.addEventListener('click', trySubmit);
    field.addEventListener('keydown', (ev: Event) => {
      const e = ev as KeyboardEvent;
      if (e.key === 'Enter' && (!cfg.multiline || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        trySubmit();
      }
    });
    host.append(field, error, submit);
    if (cfg.multiline) host.append(el('span', { class: 'hint', text: 'Ctrl/Cmd + Enter to submit' }));
    setTimeout(() => field.focus(), 50);
  });
