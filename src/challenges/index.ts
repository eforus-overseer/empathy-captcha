import type { Challenge } from '../engine/types';
import { act1 } from './act1-calibration';
import { act1Extra } from './act1-extra';
import { act2 } from './act2-interrogation';
import { act2Extra } from './act2-extra';
import { act3 } from './act3-baseline';
import { act3Extra } from './act3-extra';
import { actDraw } from './act-draw';
import { actBiometric } from './act-biometric';
import { actMath } from './act-math';

export const registry: readonly Challenge[] = [
  ...act1,
  ...act1Extra,
  ...act2,
  ...act2Extra,
  ...act3,
  ...act3Extra,
  ...actDraw,
  ...actBiometric,
  ...actMath,
];

export function byId(id: string): Challenge | undefined {
  return registry.find((c) => c.id === id);
}
