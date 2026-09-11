import pins from '../content/lower-limb-arterial-pins.json' with { type: 'json' };
import {
  arterialConcepts,
  arterialRelations,
  arterialReferences,
} from '../content/lower-limb-arterial';
import { createArterialExplorer } from './regional-arterial';
export type { ArterialNeighbour } from './regional-arterial';

const explorer = createArterialExplorer(
  pins,
  arterialConcepts,
  arterialRelations,
  arterialReferences,
  'lower-limb',
);
export const lowerLimbArterialNeighbours = explorer.neighbours;
export const lowerLimbArterialPlan = explorer.plan;
