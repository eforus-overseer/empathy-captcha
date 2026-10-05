import type { TextConfig } from '../../challenges/configs';
import { el } from '../dom';
import type { Renderer } from './context';

/** A low, lonely moan synthesised with two detuned sines and a slow glide. */
function playWhale(): Promise<void> {
  return new Promise((resolve) => {
    const AC = window.AudioContext;
    if (!AC) return resolve();
    const ctx = new AC();
    const t0 = ctx.currentTime;
    const dur = 3.2;
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
    setTimeout(() => {
      void ctx.close();
      resolve();
    }, dur * 1000 + 100);
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
        await playWhale();
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
