import './styles/base.css';
import './styles/machine.css';
import './styles/challenges.css';

import { registry } from './challenges';
import { Director, SUSPICION_START } from './engine/director';
import { mulberry32, parseSeed, randomSeed } from './engine/rng';
import { aggregate, detectHoneytokens, preambleSuspicion, score } from './engine/scoring';
import { iqr, median } from './engine/stats';
import {
  ChallengeRecorder,
  newTranscript,
  transcriptFilename,
  type SessionEnv,
  type SessionTranscript,
} from './engine/telemetry';
import { prefersReducedMotion, sleep } from './components/dom';
import { createGate, defaultMinSolveMs } from './components/gate';
import { attachRecorder } from './components/recorder-dom';
import { renderFrame, renderVerdict, SITE_URL } from './components/screens';
import { HONEYTOKENS, renderPreamble } from './components/preamble';
import { renderChallenge } from './components/types';
import { typewrite } from './components/typewriter';

const app = document.getElementById('app') as HTMLElement;

function readEnv(): SessionEnv {
  return {
    userAgent: navigator.userAgent,
    webdriver: navigator.webdriver === true,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    pointerFine: matchMedia('(pointer: fine)').matches,
    touch: navigator.maxTouchPoints > 0,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'unknown',
    reducedMotion: prefersReducedMotion(),
  };
}

function flicker(): void {
  if (prefersReducedMotion()) return;
  app.classList.remove('flicker');
  void app.offsetWidth;
  app.classList.add('flicker');
}

function tone(note: string, suspicion: number, rng: () => number): string {
  if (!note) return '';
  if (suspicion > 65 && rng() < 0.5) return `${['Noted.', 'Hm.', 'Again.'][Math.floor(rng() * 3)]} ${note}`;
  if (suspicion < 30 && rng() < 0.5) return `${['Good.', 'Thank you.', 'Yes.'][Math.floor(rng() * 3)]} ${note}`;
  return note;
}

async function run(seed: number, agentLabel: string | null, all: boolean): Promise<void> {
  const rng = mulberry32(seed);
  const director = new Director(registry, rng, { all });
  const transcript = newTranscript(seed, agentLabel, all ? 'all' : 'standard', readEnv());
  const total = director.total;

  const preamble = all ? null : await renderPreamble(app, { seed, agentLabel });
  transcript.preamble = preamble;
  // the agent name typed into the preamble overrides the URL label if given
  const effectiveAgent = preamble?.agentName ?? agentLabel;
  transcript.agentLabel = effectiveAgent;
  flicker();
  const frame = renderFrame(app);
  const startSuspicion = Math.min(100, SUSPICION_START + preambleSuspicion(preamble));
  director.adjustSuspicion(startSuspicion - SUSPICION_START);
  frame.setSuspicion(director.suspicion);
  frame.setEmpathy(50);

  let empathySum = 0;
  let empathyMin = 0;
  let empathyMax = 0;
  const allKeyIntervals: number[] = [];
  const answers: (import('./engine/types').Answer | null)[] = [];
  let textChallengeCount = 0;
  const tells: import('./engine/types').BotTell[] = [];
  const reduced = prefersReducedMotion();
  const toneRng = mulberry32(seed ^ 0x9e3779b9);

  for (let c = director.next(), i = 0; c; c = director.next(), i++) {
    frame.setAct(c.act, i + 1, total);
    frame.setProgress(i, total);
    frame.clearReaction();
    frame.bodyEl.replaceChildren();
    frame.machine.lamp(false);

    const recorder = new ChallengeRecorder({ id: c.id, act: c.act, type: c.type });
    const minMs = c.minSolveMs ?? defaultMinSolveMs(c.type);
    frame.resetGate(minMs > 0);
    await typewrite(frame.promptEl, c.prompt);
    recorder.start();
    const gate = createGate(minMs, (pct) => frame.setGate(pct));
    const detach = attachRecorder(frame.root, recorder);
    const answer = await renderChallenge(frame.bodyEl, c, { recorder, frame: frame.root, reducedMotion: reduced, gate });
    detach();
    if (c.type === 'text') textChallengeCount++;

    const evaluation = c.evaluate(answer, recorder.peekStats());
    const record = recorder.finish(answer, evaluation);
    transcript.challenges.push(record);
    allKeyIntervals.push(...record.keyIntervalsMs);
    answers.push(answer);
    if (evaluation.tell) tells.push(evaluation.tell);
    // generic: non-empty text with no keystrokes recorded = pasted or injected
    if (c.type === 'text' && answer.kind === 'text' && answer.text.trim().length > 2 && record.keyIntervalsMs.length === 0) {
      tells.push({ severity: 'major', reason: 'text entered without keystrokes' });
    }

    director.adjustSuspicion(evaluation.suspicionDelta);
    empathySum += evaluation.empathyDelta;
    empathyMin += c.empathyRange[0];
    empathyMax += c.empathyRange[1];

    frame.setSuspicion(director.suspicion);
    frame.setEmpathy(((empathySum - empathyMin) / Math.max(1, empathyMax - empathyMin)) * 100);
    frame.machine.lamp(evaluation.suspicionDelta >= 8);
    frame.showReaction(tone(evaluation.note, director.suspicion, toneRng.next));
    frame.bodyEl.querySelectorAll('button,input,textarea').forEach((n) => n.setAttribute('disabled', ''));
    await sleep(reduced ? 600 : Math.min(2600, 1100 + evaluation.note.length * 18));
    flicker();
  }

  const honeytokens = detectHoneytokens(answers, HONEYTOKENS);
  const agg = aggregate(
    transcript.challenges.map((r) => r.stats),
    allKeyIntervals,
    transcript.env.webdriver,
    iqr,
    median,
    preamble,
    honeytokens,
    textChallengeCount,
    tells,
  );
  const s = score(agg, empathySum, empathyMin, empathyMax, director.suspicion);
  transcript.scores = {
    empathy: s.empathy,
    humanness: s.humanness,
    verdict: s.verdict,
    readouts: s.readouts,
    suspicionFinal: director.suspicion,
    penalties:
      s.hardFails.length > 0
        ? [...s.breakdown.penalties, ...s.hardFails.map((rule) => ({ rule, delta: 0 }))]
        : s.breakdown.penalties,
    honeytokens,
  };
  transcript.endedAt = new Date().toISOString();

  renderVerdict(app, transcript, {
    onDownload: () => download(transcript),
    onRetest: () => navigate(seed, effectiveAgent, all),
    onNew: () => navigate(randomSeed(), effectiveAgent, all),
    onShare: async () => {
      const line = `Voight-Kampff baseline: ${s.verdict}. Empathy ${s.empathy} · Humanness ${s.humanness}. ${SITE_URL}?seed=${seed}`;
      try {
        await navigator.clipboard.writeText(line);
        return true;
      } catch {
        return false;
      }
    },
  });
}

function download(t: SessionTranscript): void {
  const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = transcriptFilename(t);
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function navigate(seed: number, agentLabel: string | null, all: boolean): void {
  const p = new URLSearchParams();
  p.set('seed', String(seed));
  if (agentLabel) p.set('agent', agentLabel);
  if (all) p.set('all', '1');
  location.search = p.toString();
}

const params = new URLSearchParams(location.search);
void run(parseSeed(params.get('seed')), params.get('agent')?.slice(0, 40) ?? null, params.get('all') === '1');
