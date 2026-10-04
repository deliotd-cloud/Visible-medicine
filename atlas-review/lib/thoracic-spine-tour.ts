import type { BodyCatalog } from '../app/body-types';
import type { RegionalTour } from './regional-tours';
import { sourceCanonical } from './body-source-additions';
import pins from '../content/thoracic-spine-tour-pins.json' with { type: 'json' };

const byFma = (fma: string): string => {
  const matches = pins.entries.filter(entry => entry.fmaId === fma);
  if (matches.length !== 1) throw Error('Ambiguous thoracic spine tour source pin.');
  return matches[0].id;
};

const t1 = byFma('FMA9165');
const t2 = byFma('FMA9187');
const t5 = byFma('FMA9922');
const t6 = byFma('FMA9945');
const t8 = byFma('FMA9991');
const t9 = byFma('FMA10014');
const t11 = byFma('FMA10059');
const t12 = byFma('FMA10081');
const firstDisc = byFma('FMA10458');
const fifthDisc = byFma('FMA13502');
const eighthDisc = byFma('FMA13505');

const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/bones_back.html';
const mri = 'https://www.radiologyinfo.org/en/info/spinemr';
const ct = 'https://www.radiologyinfo.org/en/info/spinect';
const stop = (
  id: string, title: string, selectedId: string,
  view: RegionalTour['steps'][number]['view'], frameIds: string[],
  caption: string, references = [anatomy],
): RegionalTour['steps'][number] => ({
  id, title, selectedId, view, frameIds, caption, references,
  durationMs: 14000, fadeOthers: true,
});

/** Original teaching captions over eleven existing source surfaces. */
export const thoracicSpineTour: RegionalTour = {
  id: 'thoracic-spine-discs-orientation',
  title: 'Thoracic spine: vertebrae and whole discs',
  region: 'spine', revision: 'thoracic-spine-discs-orientation-v1', status: 'draft',
  description: 'Six guided views of selected upper, middle and lower thoracic vertebrae and three source-labelled whole discs in their common source frame.',
  limitations: 'Selected source surfaces do not provide a complete thoracic series. Disc names retain the source vertebral labels; adjacent bones are orientation context, not validated patient-level numbering. The whole discs have no independent annulus, nucleus or endplate segmentation. The canal, cord, nerve roots, ligaments and individual joints are not established here. No measured image correspondence, scan registration, diagnostic finding or surgical plane. T12–L1 disc is unresolved and omitted. Draft pending revision-bound radiologist sign-off.',
  contextIds: [t1, t2, t5, t6, t8, t9, t11, t12],
  requiredDisplayBundles: Object.fromEntries(pins.entries.map(entry => [entry.id, entry.bundle])),
  steps: [
    stop('first-thoracic-anterior', 'First thoracic vertebra · Anterior', t1, 'anterior', [t1, t2, firstDisc],
      'Start at the first thoracic vertebra. Find its broad body, then turn towards the posterior arch. Keep the second vertebra in view to orient the descending series; this is source anatomy, not a patient numbering method.'),
    stop('first-thoracic-disc-left', 'First source-labelled thoracic disc · Left', firstDisc, 'left', [t1, t2, firstDisc],
      'Select the whole disc labelled for the first thoracic vertebra. Compare its surface with the first and second vertebrae from the left; no inner disc layers or endplates can be separately selected.'),
    stop('fifth-thoracic-disc-left', 'Fifth source-labelled thoracic disc · Left', fifthDisc, 'left', [t5, t6, fifthDisc],
      'Move to the disc labelled for the fifth thoracic vertebra. Use the fifth and sixth vertebral bodies as context and compare the whole-disc outline with the upper example. Do not infer a measured disc height.'),
    stop('eighth-thoracic-disc-posterior', 'Eighth source-labelled thoracic disc · Posterior', eighthDisc, 'posterior', [t8, t9, eighthDisc],
      'Turn behind the eighth and ninth vertebrae while keeping the source-labelled eighth disc selected. Compare the posterior arches with the whole-disc outline; the displayed surfaces do not delineate cord, roots or inner disc tissues.'),
    stop('eleventh-thoracic-posterior', 'Eleventh thoracic vertebra · Posterior', t11, 'posterior', [t11, t12],
      'Find the eleventh vertebra from behind and follow its posterior elements towards the twelfth. Compare the two supplied bone surfaces without assigning individual joint spaces or a procedural route.'),
    stop('twelfth-thoracic-left', 'Twelfth thoracic vertebra · Left', t12, 'left', [t11, t12],
      'Finish with the twelfth vertebra beside the eleventh. Compare the body and posterior arch in this left-side view. A future spine MRI or CT may be compared as acquired images after separate validation; no scan is aligned here, and the T12–L1 disc is not supplied.', [anatomy, mri, ct]),
  ],
};

const admittedTourCanonical = sourceCanonical(thoracicSpineTour);
const admittedRecords = new Map(pins.entries.map(entry => [entry.id, sourceCanonical(entry)]));

/** Exact eleven-record, two-bundle, catalogue-frame and immutable-tour gate. */
export function thoracicSpineTourMatches(catalog: BodyCatalog, tour: RegionalTour): boolean {
  if (sourceCanonical(tour) !== admittedTourCanonical ||
      catalog.sourceVersion !== pins.sourceVersion || catalog.license !== pins.license ||
      sourceCanonical(catalog.coordinateSystem) !== sourceCanonical(pins.coordinateSystem)) return false;

  const fmas = new Set(pins.entries.map(entry => entry.fmaId));
  const found = catalog.structures.filter(structure =>
    admittedRecords.has(structure.id) || fmas.has(structure.fmaId));
  if (found.length !== admittedRecords.size ||
      new Set(found.map(structure => structure.id)).size !== admittedRecords.size ||
      !found.every(structure => sourceCanonical(structure) === admittedRecords.get(structure.id))) return false;

  return pins.bundles.every(bundle => {
    const matches = catalog.bundles.filter(actual => actual.id === bundle.id);
    return matches.length === 1 && sourceCanonical(matches[0]) === sourceCanonical(bundle);
  });
}
