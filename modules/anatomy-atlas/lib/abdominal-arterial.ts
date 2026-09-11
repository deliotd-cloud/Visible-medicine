import pins from '../content/abdominal-arterial-pins.json' with { type: 'json' };
import {
  abdominalArterialConcepts,
  abdominalArterialRelations,
  abdominalArterialReferences,
} from '../content/abdominal-arterial';
import { createArterialExplorer } from './regional-arterial';
// Names such as left gastric/right colic do not form mirrored branch pairs.
// Explicit concepts enumerate actual source IDs; the normal visible-side filter still applies.
const explorer = createArterialExplorer(
  pins,
  abdominalArterialConcepts,
  abdominalArterialRelations,
  abdominalArterialReferences,
  'abdominal',
  'explicit-concept',
);
export const abdominalArterialNeighbours = explorer.neighbours;
export const abdominalArterialPlan = explorer.plan;
export const sharedAbdominalAortaId = pins.entries.find(
  (s) => s.fmaId === 'FMA3789',
)!.id;
