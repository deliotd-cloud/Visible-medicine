import pins from '../content/upper-limb-arterial-pins.json' with { type: 'json' };
import thyroid from '../public/models/bodyparts3d/inferior-thyroid-arteries/catalog.json' with { type: 'json' };
import neckContext from '../content/inferior-thyroid-context-pins.json' with { type: 'json' };
import {
  upperArterialConcepts,
  upperArterialRelations,
  upperArterialReferences,
} from '../content/upper-limb-arterial';
import { createArterialExplorer } from './regional-arterial';

const explorer = createArterialExplorer(
  {
    ...pins,
    entries: [...pins.entries, ...thyroid.structures, ...neckContext.entries],
    bundles: [...pins.bundles, ...thyroid.bundles, ...neckContext.bundles.filter(b => !pins.bundles.some(p => p.id === b.id))],
  },
  upperArterialConcepts,
  upperArterialRelations,
  upperArterialReferences,
  'upper-limb / neck',
);
export const upperLimbArterialNeighbours = explorer.neighbours;
export const upperLimbArterialPlan = explorer.plan;
