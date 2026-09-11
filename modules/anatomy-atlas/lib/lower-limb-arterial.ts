import originalPins from '../content/lower-limb-arterial-pins.json' with { type: 'json' };
import genicular from '../public/models/bodyparts3d/genicular-arteries/catalog.json' with { type: 'json' };
import {
  arterialConcepts,
  arterialRelations,
  arterialReferences,
} from '../content/lower-limb-arterial';
import { createArterialExplorer } from './regional-arterial';
export type { ArterialNeighbour } from './regional-arterial';

const explorer = createArterialExplorer(
  {
    ...originalPins,
    entries: [...originalPins.entries, ...genicular.structures],
    bundles: [...originalPins.bundles, ...genicular.bundles],
  },
  arterialConcepts,
  arterialRelations,
  arterialReferences,
  'lower-limb',
);
export const lowerLimbArterialNeighbours = explorer.neighbours;
export const lowerLimbArterialPlan = explorer.plan;
