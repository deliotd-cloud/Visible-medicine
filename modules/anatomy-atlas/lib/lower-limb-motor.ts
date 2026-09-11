import pins from '../content/lower-limb-motor-pins.json' with { type: 'json' };
import {
  lowerLimbMotorBindings,
  lowerLimbMotorNerves,
  lowerLimbMotorReferences,
  lowerLimbMotorRegions,
} from '../content/lower-limb-motor';
import { createRegionalMotorStudy, type MotorPins } from './regional-motor';

const study = createRegionalMotorStudy({
  pins: pins as unknown as MotorPins,
  regions: lowerLimbMotorRegions,
  bindings: lowerLimbMotorBindings,
  nerves: lowerLimbMotorNerves,
  references: lowerLimbMotorReferences,
});
export const lowerLimbMotorGroups = study.groups;
export const lowerLimbMotorPlan = study.plan;
