/** Intro, challenge frame, and verdict screens. */
import type { ChallengeRecord, SessionTranscript } from '../engine/telemetry';
import { clear, el } from './dom';
import { createMachine, createMeter, type Machine } from './machine';

export const REPO_URL = 'https://github.com/eforus-overseer/empathy-captcha';
export const SITE_URL = 'https://eforus-overseer.github.io/empathy-captcha/';

export function renderIntro(
  app: HTMLElement,
  opts: { seed: number; agentLabel: string | null; total: number; onBegin: () => void },
): void {
  clear(app);
  const machine = createMachine();
  machine.setSuspicion(35);
  machine.setEmpathy(50);
  const begin = el('button', { class: 'btn primary', type: 'button', text: 'Begin baseline test' });
  begin.addEventListener('click', opts.onBegin);
  const console_ = el(
    'div',
    { class: 'console' },
    machine.root,
    el(
      'div',
      { class: 'hero' },
      el('h1', { class: 'title', text: 'VOIGHT-KAMPFF' }),
      el('p', { class: 'subtitle', text: 'EMPATHY CAPTCHA · BASELINE TEST' }),
    ),
    el(
      'p',
      { class: 'prompt' },
      `${opts.total} questions. Answer as quickly as you can. Some of them are not questions.`,
    ),
    el(
      'div',
      { class: 'notice' },
      el('strong', { text: 'What we record. ' }),
      'Cursor movement, timing, and your answers are recorded in this browser tab only, to score the test. Nothing is uploaded. At the end you can download the transcript as JSON or just close the tab.',
    ),
    el(
      'p',
      { class: 'label' },
      'Subject seed ',
      el('strong', { text: String(opts.seed) }),
      opts.agentLabel ? ` · agent ${opts.agentLabel}` : '',
    ),
    el('div', { class: 'row' }, begin),
    footer(),
  );
  app.append(console_);
  setTimeout(() => begin.focus(), 100);
}

export interface Frame {
  root: HTMLElement;
  promptEl: HTMLElement;
  bodyEl: HTMLElement;
  reactionEl: HTMLElement;
  machine: Machine;
  gateEl: HTMLElement;
  setGate(pct: number): void;
  resetGate(active: boolean): void;
  setProgress(done: number, total: number): void;
  setAct(act: number, index: number, total: number): void;
  setSuspicion(v: number): void;
  setEmpathy(v: number): void;
  showReaction(text: string): void;
  clearReaction(): void;
}

export function renderFrame(app: HTMLElement): Frame {
  clear(app);
  const machine = createMachine();
  const meter = createMeter();
  const actEl = el('div', { class: 'label' });
  const progress = el('div', { class: 'progress', 'aria-hidden': 'true' });
  const promptEl = el('div', { class: 'prompt', role: 'status', 'aria-live': 'polite' });
  const gateFill = el('span');
  const gateBar = el('div', { class: 'gate-bar' }, gateFill);
  const gateLabel = el('span', { text: 'Analysing response window' });
  const gateEl = el('div', { class: 'gate' }, gateLabel, gateBar);
  const bodyEl = el('div', { class: 'body' });
  const reactionEl = el('div', { class: 'reaction', 'aria-live': 'polite' });
  const root = el(
    'div',
    { class: 'console' },
    machine.root,
    el('div', { class: 'topbar' }, actEl, progress, meter.root),
    promptEl,
    gateEl,
    bodyEl,
    reactionEl,
  );
  app.append(root);
  const ACT_NAMES: Record<number, string> = { 1: 'Calibration', 2: 'Interrogation', 3: 'Baseline' };
  return {
    root,
    promptEl,
    bodyEl,
    reactionEl,
    machine,
    gateEl,
    setGate(pct) {
      gateFill.style.width = `${Math.round(pct * 100)}%`;
      if (pct >= 1) {
        gateEl.classList.add('ready');
        gateLabel.textContent = 'Response accepted';
      }
    },
    resetGate(active) {
      gateFill.style.width = '0%';
      gateEl.classList.remove('ready');
      gateEl.style.display = active ? 'flex' : 'none';
      gateLabel.textContent = 'Analysing response window';
    },
    setProgress(done, total) {
      clear(progress);
      for (let i = 0; i < total; i++) {
        progress.append(el('i', { class: i < done ? 'done' : i === done ? 'now' : '' }));
      }
    },
    setAct(act, index, total) {
      clear(actEl);
      actEl.append('Act ', el('strong', { text: `${act} · ${ACT_NAMES[act] ?? ''}` }), ` · ${index}/${total}`);
    },
    setSuspicion(v) {
      meter.set(v);
      machine.setSuspicion(v);
    },
    setEmpathy(v) {
      machine.setEmpathy(v);
    },
    showReaction(text) {
      reactionEl.textContent = text;
      reactionEl.classList.add('show');
    },
    clearReaction() {
      reactionEl.classList.remove('show');
      reactionEl.textContent = '';
    },
  };
}

export function renderVerdict(
  app: HTMLElement,
  t: SessionTranscript,
  handlers: { onDownload: () => void; onRetest: () => void; onNew: () => void; onShare: () => Promise<boolean> },
): void {
  clear(app);
  const s = t.scores;
  if (!s) throw new Error('verdict without scores');
  const machine = createMachine();
  machine.setSuspicion(s.suspicionFinal);
  machine.setEmpathy(s.empathy);
  machine.lamp(s.verdict === 'REPLICANT');

  const subtitle: Record<string, string> = {
    HUMAN: 'Baseline within tolerance. You may go.',
    REPLICANT: 'Baseline deviation. Please remain seated.',
    INCONCLUSIVE: 'Retest advised. Please remain in the building.',
  };

  const readout = (label: string, value: number, cls = '') =>
    el(
      'div',
      { class: 'readout' },
      el('div', { class: 'label', text: `${label} ${value}` }),
      el('div', { class: `bar ${cls}` }, el('span')),
    );

  const download = el('button', { class: 'btn primary', type: 'button', text: 'Download transcript (JSON)' });
  download.addEventListener('click', handlers.onDownload);
  const retest = el('button', { class: 'btn', type: 'button', text: `Retest (seed ${t.seed})` });
  retest.addEventListener('click', handlers.onRetest);
  const fresh = el('button', { class: 'btn', type: 'button', text: 'New subject' });
  fresh.addEventListener('click', handlers.onNew);
  const share = el('button', { class: 'btn ghost', type: 'button', text: 'Copy result' });
  share.addEventListener('click', async () => {
    const ok = await handlers.onShare();
    share.textContent = ok ? 'Copied' : 'Copy failed';
    setTimeout(() => (share.textContent = 'Copy result'), 1600);
  });

  const list = el('ol', { class: 'transcript-list' });
  t.challenges.forEach((c: ChallengeRecord, i) => {
    const e = c.evaluation;
    list.append(
      el(
        'li',
        {},
        el('span', { class: 'id', text: String(i + 1).padStart(2, '0') }),
        el('span', {}, el('span', { class: 'id', text: `${c.id}  ` }), el('span', { class: 'note', text: e?.note ?? '' })),
        el('span', { class: 'delta', text: e ? `${fmt(e.empathyDelta)}e ${fmt(e.suspicionDelta)}s` : '' }),
      ),
    );
  });

  const penalties = el('ul', {});
  if (s.penalties.length === 0) penalties.append(el('li', { text: 'No behavioural anomalies.' }));
  for (const p of s.penalties) penalties.append(el('li', { text: `${p.delta}  ${p.rule}` }));

  const readouts = el(
    'div',
    { class: 'readouts' },
    readout('Pupil', s.readouts.pupilDilation),
    readout('Blush', s.readouts.blushResponse, 'red'),
    readout('Respiration', s.readouts.respiration, 'cyan'),
    readout('Capillary', s.readouts.capillary),
  );

  app.append(
    el(
      'div',
      { class: 'console' },
      machine.root,
      el('div', { class: 'label', text: `Subject ${t.sessionId} · seed ${t.seed}${t.agentLabel ? ` · agent ${t.agentLabel}` : ''}` }),
      el('div', { class: `verdict-word ${s.verdict}`, text: s.verdict }),
      el('p', { class: 'subtitle', text: subtitle[s.verdict] ?? '' }),
      el(
        'div',
        { class: 'scores' },
        el('div', {}, el('div', { class: 'label', text: 'empathy' }), el('div', { class: 'num', text: String(s.empathy) })),
        el('div', {}, el('div', { class: 'label', text: 'humanness' }), el('div', { class: 'num', text: String(s.humanness) })),
      ),
      readouts,
      el('div', { class: 'row' }, download, retest, fresh, share),
      el('details', { class: 'penalties' }, el('summary', { text: 'Behavioural analysis' }), penalties),
      list,
      footer(),
    ),
  );
  // animate bars after mount
  requestAnimationFrame(() => {
    const vals = [s.readouts.pupilDilation, s.readouts.blushResponse, s.readouts.respiration, s.readouts.capillary];
    readouts.querySelectorAll<HTMLElement>('.bar > span').forEach((span, i) => (span.style.width = `${vals[i] ?? 0}%`));
  });
}

function fmt(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function footer(): HTMLElement {
  return el(
    'p',
    { class: 'footer' },
    'Satire. Not a real CAPTCHA, not a real test. ',
    el('a', { href: REPO_URL, target: '_blank', rel: 'noopener', text: 'Source' }),
    ' · ?seed=N replays an order · ?agent=label tags a transcript · ?all=1 plays everything',
  );
}
