import { createBoneJointExplorer } from './regional-bone-joints';
import pins from '../content/foot-joint-pins.json';
import {
  footBoneFmas,
  footJoints,
  footJointReferences,
} from '../content/foot-joints';
const explorer = createBoneJointExplorer(
  pins,
  footBoneFmas,
  footJoints,
  footJointReferences,
  {
    title: 'Ankle & foot joint partners',
    label: 'ankle/foot',
    summary:
      'Ankle and foot only: knee and proximal tibiofibular relationships are outside this map. Bone pairs do not count separate facets or joint cavities. Hallux sesamoid partners remain unresolved in the source selection.',
    limits: 'Talocalcaneal facets are not separated.',
  },
);
export const footJointSourceValid = explorer.sourceValid;
export const footJointNeighbours = explorer.neighbours;
export const footJointPlan = explorer.plan;
