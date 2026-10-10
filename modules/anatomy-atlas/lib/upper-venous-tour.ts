import type { BodyCatalog } from '../app/body-types';
import type { RegionalTour } from './regional-tours';
import { sourceCanonical } from './body-source-additions';
import pins from '../content/upper-venous-tour-pins.json' with { type: 'json' };

const fmas = ['FMA62506', 'FMA13325', 'FMA22909', 'FMA22935', 'FMA13330', 'FMA4755'];
const entries = pins.entries;
if (entries.length !== fmas.length || entries.some((entry, i) => entry.fmaId !== fmas[i]) ||
    pins.contextEntries.length !== 4 || pins.tourRevision !== 'right-upper-limb-venous-orientation-v1')
  throw Error('Unexpected upper venous tour source pins.');
const admitted = [...entries, ...pins.contextEntries];
const table = 'https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html';
const axilla = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html';
const stop = (
  index: number, id: string, title: string, view: RegionalTour['steps'][number]['view'],
  context: number[], caption: string, references: string[],
): RegionalTour['steps'][number] => ({
  id, title, selectedId: entries[index].id, view, caption, references,
  frameIds: [entries[index].id, ...context.map(i => pins.contextEntries[i].id)],
  durationMs: 14000, fadeOthers: true,
});

/** Branch comparison, not a serial flow path or a reconstructed venous lumen. */
export const upperVenousTour: RegionalTour = {
  id: 'right-upper-limb-venous-orientation',
  title: 'Right upper limb: superficial and deep veins',
  region: 'whole-body', revision: pins.tourRevision, status: 'draft',
  description: 'Six stops compare the hand network, superficial veins and a deep brachial selection before reaching the axillary and subclavian surfaces. Faded bones provide orientation.',
  limitations: 'A teaching sequence, not the direction of blood flow through six consecutive vessels. Cephalic and basilic veins are alternative superficial routes; the selected medial brachial vein does not represent the complete paired deep system. Median cubital connections, other tributaries, valves and central venous drainage are outside this sequence. Separate surfaces do not prove continuous junctions, a lumen, patency or venous variation. No catheter route, acquired CT/MRI/ultrasound, patient-space registration or diagnostic measurement is established. Original right-sided source frame only; no mirrored anatomy. Draft pending exact-revision radiologist review.',
  contextIds: pins.contextEntries.map(entry => entry.id),
  scopeRegions: [...new Set(admitted.flatMap(entry => entry.regions))],
  requiredDisplayBundles: Object.fromEntries(admitted.map(entry => [entry.id, entry.bundle])),
  steps: [
    stop(0, 'hand', 'Hand · Superficial network', 'posterior', [0],
      'Begin on the hand dorsum. Superficial drainage contributes laterally to the cephalic and medially to the basilic route. This grouped surface is not a map of every tributary.', [table]),
    stop(1, 'cephalic', 'Cephalic · Lateral route', 'anterior', [1],
      'Follow the cephalic surface along the lateral limb. It drains towards the axillary vein, not serially into the basilic vein shown next.', [table, axilla]),
    stop(2, 'basilic', 'Basilic · Medial route', 'anterior', [1],
      'Compare the medial superficial route. The basilic vein joins the brachial veins in forming the axillary vein. Superficial connections vary and are not traced here.', [table, axilla]),
    stop(3, 'brachial', 'Medial brachial · Deep comparison', 'anterior', [1],
      'Now inspect the separately labelled medial brachial vein beside the humerus. Brachial veins accompany the brachial artery; this single selection must not be read as the complete pair.', [axilla]),
    stop(4, 'axillary', 'Axillary · Convergence', 'anterior', [2, 3],
      'Find the axillary surface approaching the first rib. It receives the cephalic vein as well as deep and basilic drainage; the separate meshes do not establish these junctions.', [axilla]),
    stop(5, 'subclavian', 'Subclavian · First-rib landmark', 'anterior', [2, 3],
      'At the lateral border of the first rib, the axillary vein becomes the subclavian vein. Compare the saved surface with the faded rib and clavicle, without inferring a catheter trajectory.', [axilla]),
  ],
};

const tourIdentity = sourceCanonical(upperVenousTour);
const records = new Map(admitted.map(entry => [entry.id, sourceCanonical(entry)]));
const identities = new Set(admitted.map(entry => entry.fmaId));
export function upperVenousTourMatches(catalog: BodyCatalog, tour: RegionalTour): boolean {
  if (sourceCanonical(tour) !== tourIdentity || catalog.sourceVersion !== pins.sourceVersion ||
      catalog.license !== pins.license || sourceCanonical(catalog.coordinateSystem) !== sourceCanonical(pins.coordinateSystem)) return false;
  const found = catalog.structures.filter(s => records.has(s.id) || identities.has(s.fmaId));
  if (found.length !== records.size || new Set(found.map(s => s.id)).size !== records.size ||
      !found.every(s => sourceCanonical(s) === records.get(s.id))) return false;
  return pins.bundles.every(bundle => {
    const found = catalog.bundles.filter(b => b.id === bundle.id);
    return found.length === 1 && sourceCanonical(found[0]) === sourceCanonical(bundle);
  });
}
