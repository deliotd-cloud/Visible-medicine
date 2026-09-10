import raw from '../public/models/um-knee/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure, Vec3 } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import { initialVentricles, reduceVentricles, type VentricularState, type VentricularAction } from './ventricles';

export const kneeSpecimen = raw;
const id = (slug: string) => `vm:reference:um-5t6tz7-v1-2:knee:${slug}`;
export const kneeTissueColours: Record<string, string> = { skeleton: '#c5aa79', cartilage: '#a2cac6', ligament: '#d4c28f', meniscus: '#729ea8', tendon: '#e0d4ad', muscle: '#b35c50' };
// Renderer adapter only: empty FMA means no mapping; the public source catalogue
// retains null. Never send these entries through BodyParts3D imaging/teaching IDs.
export const kneeStructures: BodyStructure[] = raw.structures.map((s) => ({
  ...s, fmaId: '', region: 'leg', regions: ['leg'], bundle: raw.bundle.id,
  system: s.tissue === 'skeleton' ? 'skeleton' : s.tissue === 'muscle' ? 'muscles' : 'connective',
  category: s.tissue, bounds: s.bounds as BodyStructure['bounds'], center: s.center as Vec3, anchor: s.anchor as Vec3,
  sourceTree: raw.specimenId, coverageNote: 'Independent right-limb source; clinical review pending.',
  provenance: { method: 'licensed-source-mesh', license: raw.source.license, sourceVersion: raw.source.version, recovered: false },
  validation: { status: 'unvalidated', anatomicalReview: false },
}));
export const kneeCatalog: BodyCatalog = {
  version: 1, sourceVersion: raw.specimenId, license: raw.source.license, credit: raw.source.credit,
  // Shared renderer consumes rotation/scale only for orientation. This adapter
  // does not expose measurement tools or assert calibrated source millimetres.
  coordinateSystem: { sourceToSceneColumnMajor: raw.displayTransformColumnMajor, unitsPerMillimetre: 0.01 },
  structures: kneeStructures, bundles: [raw.bundle], regions: [], excluded: [],
  coverage: { nerves: 'Not supplied', organs: 'Not applicable', vessels: 'Not supplied', connective: 'Selected source tissues; incomplete joint coverage' },
};
type KneeStudy = { id: string; title: string; slugs: string[]; selected: string; view: DissectionView; note: string };
const bones = ['femur', 'tibia', 'fibula', 'patella'];
export const kneeSpecimenStudies: KneeStudy[] = [
  { id: 'all', title: 'All source tissues', slugs: raw.structures.map((s) => s.slug), selected: 'patella', view: 'anterior', note: 'One independent right-knee specimen. Long bones remain whole; the initial camera is centred on the joint.' },
  { id: 'cruciates', title: 'Cruciate ligaments', slugs: ['acl', 'pcl', 'tibia', 'fibula', 'meniscus-group'], selected: 'acl', view: 'anterior', note: 'Femur and extensor tissues are hidden to expose the source ACL and PCL. Restore the femur to compare its original position; this is not a surgical approach.' },
  { id: 'collaterals', title: 'Collateral ligaments', slugs: [...bones, 'mcl', 'lcl'], selected: 'mcl', view: 'anterior', note: 'Compare the source MCL and LCL with the bones. Select a ligament and fade the others to see its surface.' },
  { id: 'articular', title: 'Cartilage & menisci', slugs: ['femoral-cartilage', 'tibial-cartilage', 'patellar-cartilage', 'meniscus-group'], selected: 'meniscus-group', view: 'superior', note: 'Bones are hidden. Menisci and tibial cartilage each remain one source group; individual medial/lateral parts are not separately labelled.' },
  { id: 'extensor', title: 'Extensor tissues', slugs: [...bones, 'quadriceps-tendon', 'patellar-ligament', 'patellar-cartilage'], selected: 'quadriceps-tendon', view: 'anterior', note: 'Compare the source quadriceps tendon, patella and patellar ligament. The quadriceps muscle group is not included in this specimen view.' },
  { id: 'posterior', title: 'Posterior tissues', slugs: ['femur', 'tibia', 'fibula', 'pcl', 'lcl', 'popliteus'], selected: 'popliteus', view: 'posterior', note: 'Inspect the supplied posterior surfaces. This is not a complete popliteal-fossa dissection: nerves, vessels and capsule are absent.' },
];
export const kneePresets = Object.fromEntries(kneeSpecimenStudies.map((s) => [s.id, s.slugs.map(id)]));
export const initialKneeStudy = (): VentricularState => ({ ...initialVentricles(kneeStructures), selectedId: id('patella') });
export type KneeAction = VentricularAction | { type: 'group'; tissue: string; visible: boolean };
export function reduceKneeStudy(state: VentricularState, action: KneeAction) {
  if (action.type !== 'group') return reduceVentricles(kneeStructures, state, action, kneePresets);
  const members = raw.structures.filter((s) => s.tissue === action.tissue);
  if (!members.length) return state;
  const memberIds = new Set(members.map((s) => s.id));
  const nextVisible = kneeStructures.filter((s) => memberIds.has(s.id) ? action.visible : !state.hidden.includes(s.id)).map((s) => s.id);
  const nextSelected = state.selectedId && nextVisible.includes(state.selectedId) ? state.selectedId : nextVisible[0];
  return reduceVentricles(kneeStructures, state, { type: 'preset', value: 'group', ...(nextSelected ? { selectedId: nextSelected } : {}) }, { group: nextVisible });
}
export function activeKneeStudy(hidden: string[]) {
  return kneeSpecimenStudies.find((s) => kneeStructures.every((item) => hidden.includes(item.id) === !kneePresets[s.id].includes(item.id)));
}
export function kneeStudyAction(value: string): VentricularAction | null {
  const study = kneeSpecimenStudies.find((s) => s.id === value);
  return study ? { type: 'preset', value, selectedId: id(study.selected) } : null;
}
// Camera-only joint bounds from all supplied non-bone tissues. No clipping or
// new bone segmentation. Disable close-up on separation to keep moved parts in view.
const tissues = kneeStructures.filter((s) => s.system !== 'skeleton');
export const kneeJointBounds = {
  min: [0, 1, 2].map((i) => Math.min(...tissues.map((s) => s.bounds.min[i])) - 0.18) as Vec3,
  max: [0, 1, 2].map((i) => Math.max(...tissues.map((s) => s.bounds.max[i])) + 0.18) as Vec3,
};
export function filterKneeStructures(query: string) {
  const q = query.trim().toLowerCase();
  return raw.structures.filter((s) => `${s.name} ${s.slug} ${s.tissue}`.toLowerCase().includes(q));
}
