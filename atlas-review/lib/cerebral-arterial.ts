import pins from '../content/cerebral-arterial-pins.json' with { type: 'json' };
import cranial from '../public/models/bodyparts3d/cranial-arteries/catalog.json' with { type: 'json' };
import {
  cerebralArterialConcepts,
  cerebralArterialRelations,
  cerebralArterialReferences,
} from '../content/cerebral-arterial';
import { createArterialExplorer } from './regional-arterial';

const explorer = createArterialExplorer(
  {
    ...pins,
    entries: [...pins.entries, ...cranial.structures],
    bundles: [...pins.bundles, ...cranial.bundles],
  },
  cerebralArterialConcepts,
  cerebralArterialRelations,
  cerebralArterialReferences,
  'cervical and cerebral',
);
export const cerebralArterialNeighbours = explorer.neighbours;
export const cerebralArterialPlan = explorer.plan;
const ids = new Set(
  [...pins.entries, ...cranial.structures]
    .filter((s) => s.system === 'vessels')
    .map((s) => s.id),
);
// Route known IDs before validation: stale cerebral pins must not fall back to another map.
export const isCerebralArterialId = (id: string) => ids.has(id);
