import pins from '../content/upper-limb-arterial-pins.json' with { type: 'json' };
import {
  upperArterialConcepts,
  upperArterialRelations,
  upperArterialReferences,
} from '../content/upper-limb-arterial';
import { createArterialExplorer } from './regional-arterial';

const explorer = createArterialExplorer(
  pins,
  upperArterialConcepts,
  upperArterialRelations,
  upperArterialReferences,
  'upper-limb',
);
export const upperLimbArterialNeighbours = explorer.neighbours;
export const upperLimbArterialPlan = explorer.plan;
