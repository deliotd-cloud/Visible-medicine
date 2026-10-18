import pins from '../content/thorax-motor-pins.json' with { type: 'json' };
import {
  thoraxMotorBindings,
  thoraxMotorNerves,
  thoraxMotorReferences,
  thoraxMotorRegions,
} from '../content/thorax-motor';
import { createRegionalMotorStudy, type MotorPins } from './regional-motor';

const study = createRegionalMotorStudy({
  pins: pins as unknown as MotorPins,
  regions: thoraxMotorRegions,
  bindings: thoraxMotorBindings,
  nerves: thoraxMotorNerves,
  references: thoraxMotorReferences,
  wholeBodyAlias: { name: 'whole-body', sourceRegion: 'thorax' },
});
export const thoraxMotorGroups = study.groups;
export const thoraxMotorPlan = study.plan;
