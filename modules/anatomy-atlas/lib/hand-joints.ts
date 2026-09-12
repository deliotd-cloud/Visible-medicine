import { createBoneJointExplorer } from './regional-bone-joints';
import pins from '../content/hand-joint-pins.json';
import {
  handBoneFmas,
  handJoints,
  handJointReferences,
  handJointScope,
  handJointNote,
} from '../content/hand-joints';
const tfcc = { text: handJointNote, reference: 'tfcc' };
const explorer = createBoneJointExplorer(
  pins,
  handBoneFmas,
  handJoints,
  handJointReferences,
  handJointScope,
  { ulna: tfcc, lunate: tfcc, triquetrum: tfcc },
);
export const handJointSourceValid = explorer.sourceValid;
export const handJointNeighbours = explorer.neighbours;
export const handJointPlan = explorer.plan;
