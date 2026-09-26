import pins from '../content/abdominal-arterial-pins.json' with { type: 'json' };
import {
  abdominalArterialConcepts,
  abdominalArterialRelations,
  abdominalArterialReferences,
} from '../content/abdominal-arterial';
import { createArterialExplorer } from './regional-arterial';
import {applyCeliacDisplayCorrection,celiacDisplayCorrection} from './body-display-catalog';
import {sourceCanonical} from './body-source-additions';
import type {BodyCatalog} from '../app/body-types';
const correction = celiacDisplayCorrection;
if (sourceCanonical(pins.entries.filter(s=>s.id===correction.original.id)) !== sourceCanonical([correction.original]))
  throw new Error('Abdominal arterial source pins changed; review required');
const displayPins = {...pins,
  entries:pins.entries.map(s=>s.id===correction.original.id?correction.replacement:s),
  bundles:[...pins.bundles,correction.bundle],
};
// Names such as left gastric/right colic do not form mirrored branch pairs.
// Explicit concepts enumerate actual source IDs; the normal visible-side filter still applies.
const explorer = createArterialExplorer(
  displayPins,
  abdominalArterialConcepts,
  abdominalArterialRelations,
  abdominalArterialReferences,
  'abdominal',
  'explicit-concept',
);
// The source-bound relationship set is unchanged. Both raw and display callers
// use the audited render adaptation; malformed/foreign bindings still fail closed.
export function abdominalArterialNeighbours(catalog:BodyCatalog,region:string,side:string,id:string,exam=false) {
  try { return explorer.neighbours(applyCeliacDisplayCorrection(catalog),region,side,id,exam); }
  catch { return null; }
}
export function abdominalArterialPlan(catalog:BodyCatalog,region:string,side:string,id:string,exam=false) {
  try { return explorer.plan(applyCeliacDisplayCorrection(catalog),region,side,id,exam); }
  catch { return null; }
}
export const sharedAbdominalAortaId = pins.entries.find(
  (s) => s.fmaId === 'FMA3789',
)!.id;
