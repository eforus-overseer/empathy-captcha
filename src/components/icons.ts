/**
 * Etched line-icon system. Most glyphs come from Lucide (ISC licensed, 24x24,
 * 2px stroke) rendered to inline SVG; a handful Lucide lacks are hand-authored
 * in the same style. Icons inherit colour via `currentColor` and are sized by
 * CSS. This replaces every emoji in the interface.
 */
import { NODES } from './icon-data';
import type { IconNode } from 'lucide';

/** Hand-drawn icons for shapes Lucide does not ship. Inner SVG markup, 24x24. */
const CUSTOM: Record<string, string> = {
  'traffic-light':
    '<rect x="8" y="2" width="8" height="20" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/><path d="M12 22v0"/>',
  bridge:
    '<path d="M2 8c3 0 4 3 4 6v6"/><path d="M22 8c-3 0-4 3-4 6v6"/><path d="M2 8c5 2 15 2 20 0"/><path d="M12 9v11"/><path d="M3 20h18"/>',
  mirror:
    '<rect x="6" y="2" width="12" height="18" rx="6"/><path d="M9 6c-.8 1-1.2 2.4-1.2 4"/><path d="M10 22h4"/>',
  bee:
    '<ellipse cx="12" cy="14" rx="4" ry="5"/><path d="M8 12h8M8 15h8"/><circle cx="12" cy="7" r="2"/><path d="M10 6 7 4M14 6l3-2"/><path d="M8 11C5 9 4 11 5 13s3 1 3 1M16 11c3-2 4 0 3 2s-3 1-3 1"/>',
  butterfly:
    '<path d="M12 5v14"/><path d="M12 7C9 2 3 3 3 8c0 4 5 5 9 3"/><path d="M12 7c3-5 9-4 9 1 0 4-5 5-9 3"/><path d="M12 12c-3 5-9 4-9-1"/><path d="M12 12c3 5 9 4 9-1"/><path d="M12 5l-1.5-1.5M12 5l1.5-1.5"/>',
  window:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>',
  mushroom:
    '<path d="M4 11a8 8 0 0 1 16 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M10 12v6a2 2 0 0 0 4 0v-6"/>',
  ladder:
    '<path d="M7 2v20M17 2v20"/><path d="M7 6h10M7 10h10M7 14h10M7 18h10"/>',
  tooth:
    '<path d="M12 5c-2-2-5-2-6.5-.5C4 6 4 9 5 13c.6 2.4.8 6 2 6s1.4-3 2-5c.3-1 1-1.6 1-1.6s.7.6 1 1.6c.6 2 .8 5 2 5s1.4-3.6 2-6c1-4 1-7-.5-8.5C17 3 14 3 12 5Z"/>',
  zebra:
    '<path d="M4 14c0-4 3-7 8-7s8 3 8 6c0 2-1 3-1 4v2M7 20v-3"/><path d="M8 9v6M11 8v8M14 8v8M17 10v5"/>',
  teddy:
    '<circle cx="12" cy="9" r="4"/><circle cx="8" cy="5" r="1.6"/><circle cx="16" cy="5" r="1.6"/><path d="M8 13c-1 1-2 3-2 5a6 6 0 0 0 12 0c0-2-1-4-2-5"/><path d="M11 9h2"/>',
  sheep:
    '<path d="M7 11a3 3 0 0 1-1-5 3 3 0 0 1 4-2 3 3 0 0 1 4 0 3 3 0 0 1 4 2 3 3 0 0 1-1 5c1 1 1 4-2 4H9c-3 0-3-3-2-4Z"/><path d="M9 15v3M15 15v3"/>',
  octopus:
    '<path d="M8 9a4 4 0 0 1 8 0v3H8Z"/><circle cx="10" cy="8" r=".6"/><circle cx="14" cy="8" r=".6"/><path d="M8 12c-1 3-3 3-4 5M11 12c0 3-1 4-1 6M13 12c0 3 1 4 1 6M16 12c1 3 3 3 4 5"/>',
  santa:
    '<path d="M6 13a6 6 0 0 1 12 0Z"/><circle cx="12" cy="14" r="1"/><path d="M6 13c-1-5 3-9 6-9s7 4 6 9"/><circle cx="12" cy="3" r="1.2"/><path d="M8 17c1 1.5 2.5 2 4 2s3-.5 4-2"/>',
  scarf:
    '<path d="M9 3h6v8a3 3 0 0 1-6 0Z"/><path d="M12 14v5M12 19l-2 2M12 19l2 2"/>',
  tape:
    '<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>',
  elephant:
    '<path d="M4 12a7 7 0 0 1 14 0v5h-3v-3M8 17v-3"/><path d="M18 10c2 0 3 2 2 4s-3 2-3 4"/><circle cx="9" cy="9" r=".6"/>',
};

const cache = new Map<string, string>();

function nodeToSvg(children: IconNode): string {
  const inner = children
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
  return wrap(inner);
}

function wrap(inner: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

/** Lucide PascalCase name for a semantic icon key. */
export const ICON: Record<string, string> = {
  'traffic-light': 'traffic-light',
  car: 'CarFront',
  bus: 'Bus',
  truck: 'Truck',
  ambulance: 'Truck',
  'fire-engine': 'Truck',
  ship: 'Ship',
  boat: 'Sailboat',
  canoe: 'Sailboat',
  'life-ring': 'LifeBuoy',
  surfer: 'Waves',
  bike: 'Bike',
  wheelchair: 'Accessibility',
  house: 'House',
  office: 'Building',
  store: 'Store',
  bank: 'Landmark',
  hospital: 'Hospital',
  factory: 'Factory',
  circus: 'Tent',
  door: 'DoorOpen',
  ladder: 'ladder',
  extinguisher: 'FireExtinguisher',
  bricks: 'BrickWall',
  window: 'window',
  tortoise: 'Turtle',
  cat: 'Cat',
  dog: 'Dog',
  fish: 'Fish',
  bird: 'Bird',
  duck: 'Bird',
  penguin: 'Bird',
  snail: 'Snail',
  elephant: 'elephant',
  octopus: 'octopus',
  caterpillar: 'Worm',
  bee: 'bee',
  butterfly: 'butterfly',
  bigcat: 'PawPrint',
  zebra: 'zebra',
  oyster: 'Shell',
  lobster: 'Shell',
  egg: 'Egg',
  tooth: 'tooth',
  person: 'User',
  baby: 'Baby',
  hand: 'Hand',
  handshake: 'Handshake',
  brain: 'Brain',
  lungs: 'Wind',
  phone: 'Smartphone',
  laptop: 'Laptop',
  computer: 'Monitor',
  camera: 'Camera',
  painting: 'Image',
  documents: 'ScrollText',
  tape: 'tape',
  disk: 'HardDrive',
  wallet: 'Wallet',
  gift: 'Gift',
  ring: 'Gem',
  letter: 'Mail',
  mirror: 'mirror',
  chair: 'Armchair',
  bed: 'Bed',
  cart: 'ShoppingCart',
  teddy: 'teddy',
  robot: 'Bot',
  gear: 'Cog',
  bucket: 'PaintBucket',
  paper: 'Scroll',
  abacus: 'Calculator',
  scarf: 'scarf',
  knot: 'Spline',
  logs: 'Cuboid',
  teapot: 'Coffee',
  coffee: 'Coffee',
  plant: 'Flower2',
  seedling: 'Sprout',
  mushroom: 'mushroom',
  cookie: 'Cookie',
  tree: 'TreeDeciduous',
  pine: 'TreePine',
  fire: 'Flame',
  smoke: 'Wind',
  drop: 'Droplet',
  tap: 'Droplet',
  wave: 'Waves',
  snow: 'Snowflake',
  sun: 'Sun',
  sunset: 'Sunset',
  moon: 'Moon',
  bridge: 'bridge',
  'bridge-fog': 'bridge',
  fountain: 'Droplets',
  rock: 'Mountain',
  sheep: 'sheep',
  guitar: 'Guitar',
  violin: 'Music',
  piano: 'Piano',
  'sheet-music': 'Music2',
  flag: 'Flag',
  'bar-chart': 'BarChart3',
  card: 'Spade',
  santa: 'santa',
  lion: 'PawPrint',
  tiger: 'PawPrint',
  bear: 'PawPrint',
  spider: 'Bug',
  train: 'TrainFront',
  elevator: 'DoorClosed',
  dove: 'Bird',
  candle: 'Flame',
  eye: 'Eye',
  plug: 'Plug',
  paw: 'PawPrint',
  wasp: 'bee',
};

/** Resolve an icon key to an SVG string. Falls back to a neutral dot. */
export function iconSvg(key: string): string {
  if (cache.has(key)) return cache.get(key) as string;
  let svg: string;
  const mapped = ICON[key] ?? key;
  if (CUSTOM[mapped]) {
    svg = wrap(CUSTOM[mapped] as string);
  } else if (NODES[mapped]) {
    svg = nodeToSvg(NODES[mapped] as IconNode);
  } else if (CUSTOM[key]) {
    svg = wrap(CUSTOM[key] as string);
  } else {
    svg = wrap('<circle cx="12" cy="12" r="3"/>');
  }
  cache.set(key, svg);
  return svg;
}

/** An inline-SVG span element for an icon key. */
export function iconEl(key: string, className = 'icon'): HTMLElement {
  const span = document.createElement('span');
  span.className = className;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = iconSvg(key);
  return span;
}
