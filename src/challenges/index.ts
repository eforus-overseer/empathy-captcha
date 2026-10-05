import type { Challenge } from '../engine/types';
import { act1 } from './act1-calibration';
import { act2 } from './act2-interrogation';
import { act3 } from './act3-baseline';

export const registry: readonly Challenge[] = [...act1, ...act2, ...act3];

export function byId(id: string): Challenge | undefined {
  return registry.find((c) => c.id === id);
}
