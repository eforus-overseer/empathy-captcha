import { rasterize } from '../engine/draw';
import type { DrawStroke } from '../engine/types';
import bundle from './quickdraw.json';

type Bundle = { classes: Record<string, DrawStroke[][]> };

const RASTER_SIZE = 16;
let cache: Record<string, Float64Array[]> | null = null;

/** Rasterised Quick, Draw! templates by class, computed once. */
export function templates(): Record<string, Float64Array[]> {
  if (cache) return cache;
  const b = bundle as unknown as Bundle;
  cache = {};
  for (const [name, drawings] of Object.entries(b.classes)) {
    cache[name] = drawings.map((strokes) => rasterize(strokes, RASTER_SIZE));
  }
  return cache;
}

export const RASTER = RASTER_SIZE;
