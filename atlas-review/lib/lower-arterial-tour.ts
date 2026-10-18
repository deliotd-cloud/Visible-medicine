import type { BodyCatalog } from '../app/body-types';
import type { RegionalTour } from './regional-tours';
import { sourceCanonical } from './body-source-additions';
import pins from '../content/lower-arterial-tour-pins.json' with { type: 'json' };

const targets = [
  ['external', 'pelvis', 'right-external-iliac-artery'],
  ['femoral', 'thigh', 'right-femoral-artery'],
  ['deep', 'thigh', 'right-deep-femoral-artery'],
  ['popliteal', 'leg', 'right-popliteal-artery'],
  ['anterior', 'leg', 'right-anterior-tibial-artery'],
  ['posterior', 'leg', 'right-posterior-tibial-artery'],
  ['dorsalis', 'foot', 'right-dorsalis-pedis-artery'],
  ['medial', 'foot', 'right-medial-plantar-artery'],
  ['lateral', 'foot', 'right-lateral-plantar-artery'],
] as const;
type Target = typeof targets[number][0];
const expectedId = (region: string, name: string) =>
  `vm:anatomy:body:${region}:right:vessel:${name}`;
const entries = targets.map(([, region, name]) => {
  const id = expectedId(region, name);
  const matches = pins.entries.filter(entry => entry.id === id);
  if (matches.length !== 1) throw Error('Ambiguous lower arterial tour source pin.');
  return matches[0];
});
if (pins.entries.length !== targets.length) throw Error('Unexpected lower arterial tour source pin.');
const contextNames = [
  ['pelvis', 'right-hip-bone'], ['thigh', 'right-femur'],
  ['leg', 'right-tibia'], ['leg', 'right-fibula'],
  ['foot', 'right-talus'], ['foot', 'navicular-bone-of-right-foot'],
  ['foot', 'right-calcaneus'], ['foot', 'right-first-metatarsal-bone'],
  ['foot', 'right-fifth-metatarsal-bone'],
] as const;
const contextId = (region: string, name: string) =>
  `vm:anatomy:body:${region}:right:bone:${name}`;
const contextEntries = contextNames.map(([region, name], index) => {
  const expected = contextId(region, name);
  const entry = pins.contextEntries[index];
  if (entry?.id !== expected) throw Error('Unexpected lower arterial skeletal source pin.');
  return entry;
});
if (pins.contextEntries.length !== contextNames.length ||
    pins.tourRevision !== 'right-lower-limb-arterial-orientation-v2')
  throw Error('Unexpected lower arterial context revision.');
const admittedEntries = [...entries, ...contextEntries];
const id = (target: Target) => {
  const index = targets.findIndex(([name]) => name === target);
  return entries[index].id;
};
const scopeRegions = [...new Set(admittedEntries.flatMap(entry => entry.regions))];
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_lowerlimb.html';
const thigh = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/thigh_tables.html';
const leg = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/leg_tables.html';
const stop = (
  target: Target, title: string, view: RegionalTour['steps'][number]['view'],
  frame: Target[], caption: string, references = [anatomy], contextFrame: string[] = [],
): RegionalTour['steps'][number] => ({
  id: target, title, selectedId: id(target), view,
  frameIds: [...frame.map(id), ...contextFrame], caption, references,
  durationMs: 14000, fadeOthers: true,
});

/** Source-bound spatial orientation; separate meshes do not establish continuous vessels. */
export const lowerArterialTour: RegionalTour = {
  id: 'right-lower-limb-arterial-orientation',
  title: 'Right lower limb: arterial orientation',
  region: 'whole-body',
  revision: pins.tourRevision,
  status: 'draft',
  description: 'Nine source-bound stops follow selected right-sided arterial surfaces from the pelvis through the thigh and leg to the foot, with faded right-sided skeletal landmarks.',
  limitations: 'Selected right-sided exterior segments only, not a complete arterial tree or verified continuous lumen. The fibular artery, other runoff branches and complete plantar arch are outside this sequence. The medial plantar artery is not presented as a usual arch contributor. Source extents and apparent junctions require anatomical review. No patency, calibre, flow, stenosis, pulses, diagnostic projection, procedural route, acquired imaging or patient registration is established. Fading changes visibility, not anatomy. Right side only; no mirrored counterpart. Draft pending revision-bound radiologist sign-off.',
  contextIds: contextEntries.map(entry => entry.id),
  scopeRegions,
  requiredDisplayBundles: Object.fromEntries(admittedEntries.map(entry => [entry.id, entry.bundle])),
  steps: [
    stop('external', 'External iliac · Pelvic approach', 'anterior', ['external', 'femoral'],
      'Begin above the inguinal ligament. The external iliac artery is named femoral after passing beneath it.', [anatomy, thigh]),
    stop('femoral', 'Femoral · Anterior thigh', 'anterior', ['external', 'femoral', 'deep'],
      'Follow the femoral surface into the thigh. Compare the nearby deep femoral branch before moving towards the knee.', [anatomy, thigh]),
    stop('deep', 'Deep femoral · Thigh branch', 'anterior', ['femoral', 'deep'],
      'The deep femoral artery branches from the femoral artery; it is not the serial continuation towards the popliteal artery.', [anatomy, thigh]),
    stop('popliteal', 'Popliteal · Behind the knee', 'posterior', ['femoral', 'popliteal'],
      'Turn posteriorly. The femoral artery becomes popliteal after passing through the adductor hiatus.', [anatomy, thigh]),
    stop('anterior', 'Anterior tibial · Front of leg', 'anterior', ['popliteal', 'anterior'],
      'Find the anterior tibial surface in the front of the leg; distally it continues as dorsalis pedis.', [anatomy, leg]),
    stop('posterior', 'Posterior tibial · Back of leg', 'posterior', ['popliteal', 'posterior'],
      'Compare the posterior tibial surface. Its distal branches include the medial and lateral plantar arteries.', [anatomy, leg]),
    stop('dorsalis', 'Dorsalis pedis · Dorsal foot', 'superior', ['dorsalis'],
      'On the foot dorsum, locate dorsalis pedis, the distal continuation of the anterior tibial artery beyond the ankle.', [anatomy, leg],
      [contextId('foot', 'right-talus'), contextId('foot', 'navicular-bone-of-right-foot')]),
    stop('medial', 'Medial plantar · Medial sole', 'inferior', ['medial', 'lateral'],
      'Under the foot, locate the medial plantar artery along the medial sole.', [anatomy],
      [contextId('foot', 'right-calcaneus')]),
    stop('lateral', 'Lateral plantar · Lateral sole', 'inferior', ['medial', 'lateral'],
      'Finish laterally. The lateral plantar artery contributes to the plantar arch; this tour does not trace the complete arch.', [anatomy],
      [contextId('foot', 'right-calcaneus')]),
  ],
};

const admittedTourCanonical = sourceCanonical(lowerArterialTour);
const admittedRecords = new Map(admittedEntries.map(entry => [entry.id, sourceCanonical(entry)]));

/** Exact source records, bundles, coordinate frame and immutable sequence. */
export function lowerArterialTourMatches(catalog: BodyCatalog, tour: RegionalTour): boolean {
  if (sourceCanonical(tour) !== admittedTourCanonical ||
      catalog.sourceVersion !== pins.sourceVersion || catalog.license !== pins.license ||
      sourceCanonical(catalog.coordinateSystem) !== sourceCanonical(pins.coordinateSystem)) return false;

  const fmas = new Set(entries.map(entry => entry.fmaId));
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
