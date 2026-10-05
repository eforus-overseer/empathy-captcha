/** Inline SVG of the Voight-Kampff unit: bellows, lens with reactive iris, empathy gauge. */
import { el } from './dom';

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

export function createMachine(): Machine {
  const root = svg('svg', { viewBox: '0 0 320 130', class: 'machine', role: 'img', 'aria-label': 'Voight-Kampff unit' });

  // body + bellows
  root.append(svg('rect', { class: 'body', x: '20', y: '40', width: '280', height: '80', rx: '6' }));
  for (let i = 0; i < 6; i++) {
    root.append(svg('path', { class: 'bellows', d: `M${40 + i * 12} 40 l6 -22 l6 22 z` }));
  }
  root.append(svg('rect', { class: 'body', x: '36', y: '12', width: '84', height: '10', rx: '2' }));

  // lens
  root.append(svg('circle', { class: 'lens-ring', cx: '100', cy: '80', r: '34' }));
  root.append(svg('circle', { class: 'lens-glass', cx: '100', cy: '80', r: '30' }));
  const iris = svg('circle', { class: 'iris', cx: '100', cy: '80', r: '20' });
  const pupil = svg('circle', { class: 'pupil', cx: '100', cy: '80', r: '9' });
  root.append(iris, pupil, svg('circle', { class: 'glint', cx: '90', cy: '70', r: '3' }));

  // gauge
  root.append(svg('circle', { class: 'gauge-face', cx: '250', cy: '70', r: '34' }));
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    const x1 = 250 + Math.cos(a) * 30;
    const y1 = 70 + Math.sin(a) * 30;
    const x2 = 250 + Math.cos(a) * (i % 5 === 0 ? 24 : 27);
    const y2 = 70 + Math.sin(a) * (i % 5 === 0 ? 24 : 27);
    root.append(svg('line', { class: 'tick', x1: `${x1}`, y1: `${y1}`, x2: `${x2}`, y2: `${y2}` }));
  }
  const needle = svg('line', { class: 'needle', x1: '250', y1: '70', x2: '222', y2: '70' });
  root.append(needle, svg('circle', { cx: '250', cy: '70', r: '3', fill: '#b3261e' }));
  const lampEl = svg('circle', { class: 'lamp', cx: '175', cy: '60', r: '5' });
  root.append(lampEl);
  const legendA = svg('text', { class: 'legend', x: '100', y: '126', 'text-anchor': 'middle' });
  legendA.textContent = 'IRIS';
  const legendB = svg('text', { class: 'legend', x: '250', y: '116', 'text-anchor': 'middle' });
  legendB.textContent = 'EMPATHY';
  root.append(legendA, legendB);

  return {
    root,
    setSuspicion(s) {
      const r = 26 - (s / 100) * 20; // 26 relaxed → 6 pinhole
      iris.setAttribute('r', `${Math.max(6, r)}`);
      pupil.setAttribute('r', `${Math.max(2, r * 0.42)}`);
      iris.classList.toggle('hot', s > 70);
    },
    setEmpathy(e) {
      // 0..100 maps to 0..180 degrees sweep
      needle.style.transform = `rotate(${(e / 100) * 180}deg)`;
    },
    lamp(on) {
      lampEl.classList.toggle('on', on);
    },
  };
}

/** Horizontal suspicion meter used in the frame topbar. */
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
