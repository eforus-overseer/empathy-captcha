/**
 * Baseline monitor — a polygraph-style multi-channel readout that replaces the
 * old iris/gauge gadget. Three live traces (empathy, signal, stress) scroll
 * across a scope; their amplitude tracks the session state. Keeps the same
 * interface (setSuspicion / setEmpathy / lamp) so the screens are unchanged.
 */
import { el, prefersReducedMotion } from './dom';

export interface Machine {
  root: SVGSVGElement;
  setSuspicion(s: number): void;
  setEmpathy(e: number): void;
  lamp(on: boolean): void;
}

const NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

const X0 = 14;
const X1 = 244;
const STEP = 3;

export function createMachine(): Machine {
  const root = svg('svg', { viewBox: '0 0 320 130', class: 'monitor', role: 'img', 'aria-label': 'Baseline monitor' });

  // bezel + scope well
  root.append(svg('rect', { class: 'mon-body', x: '6', y: '8', width: '308', height: '114', rx: '6' }));
  root.append(svg('rect', { class: 'mon-scope', x: '10', y: '12', width: '242', height: '106', rx: '3' }));

  // grid
  for (let gy = 24; gy < 118; gy += 20) root.append(svg('line', { class: 'mon-grid', x1: '10', y1: `${gy}`, x2: '252', y2: `${gy}` }));
  for (let gx = 30; gx < 252; gx += 28) root.append(svg('line', { class: 'mon-grid', x1: `${gx}`, y1: '12', x2: `${gx}`, y2: '118' }));

  const channels = [
    { cy: 36, cls: 'ch-empathy', amp: () => 3 + (empathy / 100) * 11, freq: 0.19, speed: 0.05, noise: 0.6 },
    { cy: 65, cls: 'ch-signal', amp: () => 5, freq: 0.5, speed: 0.14, noise: 2.4 },
    { cy: 96, cls: 'ch-stress', amp: () => 2 + (suspicion / 100) * 13, freq: 0.33, speed: 0.09, noise: 1 },
  ];
  const paths = channels.map((c) => {
    const p = svg('path', { class: `mon-trace ${c.cls}`, d: '' });
    root.append(p);
    return p;
  });

  // channel labels
  const labels = ['EMPATHY', 'SIGNAL', 'STRESS'];
  channels.forEach((c, i) => {
    const t = svg('text', { class: 'mon-label', x: '13', y: `${c.cy - 11}` });
    t.textContent = labels[i] as string;
    root.append(t);
  });

  // right readout panel
  root.append(svg('line', { class: 'mon-div', x1: '258', y1: '12', x2: '258', y2: '118' }));
  const mkReadout = (y: number, label: string) => {
    const l = svg('text', { class: 'mon-rlabel', x: '264', y: `${y}` });
    l.textContent = label;
    const v = svg('text', { class: 'mon-rvalue', x: '264', y: `${y + 15}` });
    v.textContent = '00';
    root.append(l, v);
    return v;
  };
  const empVal = mkReadout(26, 'EMP');
  const susVal = mkReadout(62, 'STR');
  const lamp = svg('circle', { class: 'mon-rec', cx: '268', cy: '100', r: '4' });
  const recText = svg('text', { class: 'mon-rlabel', x: '277', y: '103' });
  recText.textContent = 'REC';
  root.append(lamp, recText);

  let suspicion = 35;
  let empathy = 50;
  let phase = 0;

  const render = () => {
    for (let i = 0; i < channels.length; i++) {
      const c = channels[i] as (typeof channels)[number];
      const amp = c.amp();
      let d = '';
      for (let x = X0; x <= X1; x += STEP) {
        const n = c.noise * (Math.sin(x * 1.7 + phase * 2.3) * 0.5 + Math.sin(x * 0.9 - phase * 1.1) * 0.5);
        const y = c.cy - (Math.sin(x * c.freq + phase * (c.speed / 0.05)) * amp + n);
        d += `${x === X0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`;
      }
      (paths[i] as SVGPathElement).setAttribute('d', d);
    }
  };

  let raf = 0;
  const loop = () => {
    if (!root.isConnected) return;
    phase += 0.08;
    render();
    raf = requestAnimationFrame(loop);
  };
  if (prefersReducedMotion()) {
    render();
  } else {
    raf = requestAnimationFrame(loop);
  }
  void raf;

  return {
    root,
    setSuspicion(s) {
      suspicion = Math.max(0, Math.min(100, s));
      susVal.textContent = String(Math.round(suspicion)).padStart(2, '0');
      susVal.classList.toggle('hot', suspicion > 65);
      (paths[2] as SVGPathElement).classList.toggle('hot', suspicion > 65);
      if (prefersReducedMotion()) render();
    },
    setEmpathy(e) {
      empathy = Math.max(0, Math.min(100, e));
      empVal.textContent = String(Math.round(empathy)).padStart(2, '0');
      if (prefersReducedMotion()) render();
    },
    lamp(on) {
      lamp.classList.toggle('on', on);
    },
  };
}

/** Horizontal suspicion meter used in the frame topbar (unchanged interface). */
export function createMeter(): { root: HTMLElement; set(v: number): void } {
  const fill = el('span');
  const bar = el('div', { class: 'bar red', role: 'meter', 'aria-label': 'suspicion' }, fill);
  const root = el('div', { class: 'meter' }, el('span', { text: 'suspicion' }), bar);
  return {
    root,
    set(v) {
      fill.style.width = `${Math.round(v)}%`;
      bar.setAttribute('aria-valuenow', `${Math.round(v)}`);
    },
  };
}
