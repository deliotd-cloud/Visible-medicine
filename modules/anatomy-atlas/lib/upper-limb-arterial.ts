import pins from '../content/upper-limb-arterial-pins.json' with { type: 'json' };
import thyroid from '../public/models/bodyparts3d/inferior-thyroid-arteries/catalog.json' with { type: 'json' };
import neckContext from '../content/inferior-thyroid-context-pins.json' with { type: 'json' };
import subscapular from '../public/models/bodyparts3d/subscapular-arteries/catalog.json' with {type:'json'};
import elbow from '../public/models/bodyparts3d/elbow-arteries/catalog.json' with {type:'json'};
import { elbowArterialConcepts, elbowArterialRelations, elbowArterialReference } from '../content/elbow-arterial';
import {
  upperArterialConcepts,
  upperArterialRelations,
  upperArterialReferences,
} from '../content/upper-limb-arterial';
import { createArterialExplorer } from './regional-arterial';

const explorer = createArterialExplorer(
  {
    ...pins,
    entries: [...pins.entries, ...thyroid.structures, ...neckContext.entries, ...subscapular.structures, ...elbow.structures],
    bundles: [...pins.bundles, ...thyroid.bundles, ...neckContext.bundles.filter(b => !pins.bundles.some(p => p.id === b.id)), ...subscapular.bundles, ...elbow.bundles],
  },
  {...upperArterialConcepts, ...elbowArterialConcepts},
  [...upperArterialRelations, ...elbowArterialRelations],
  {...upperArterialReferences, elbow: elbowArterialReference},
  'upper-limb / neck',
);
export const upperLimbArterialNeighbours = explorer.neighbours;
export const upperLimbArterialPlan = explorer.plan;
