import pins from '../content/upper-limb-motor-pins.json' with { type: 'json' };
import {
  upperLimbMotorBindings,
  upperLimbMotorNerves,
  upperLimbMotorReferences,
  upperLimbMotorRegions,
} from '../content/upper-limb-motor';
import { createRegionalMotorStudy, type MotorPins } from './regional-motor';
const study = createRegionalMotorStudy({
  pins: pins as unknown as MotorPins,
  regions: upperLimbMotorRegions,
  bindings: upperLimbMotorBindings,
  nerves: upperLimbMotorNerves,
  references: upperLimbMotorReferences,
});
export const upperLimbMotorGroups = study.groups;
export const upperLimbMotorPlan = study.plan;
