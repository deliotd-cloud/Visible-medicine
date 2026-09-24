import raw from '../public/models/hra-renal/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure, Vec3 } from '../app/body-types';
import type { SpecimenDefinition, SpecimenSurface, SpecimenStudy } from './independent-specimen';

export const hraRenalSource = raw.source;
export const hraRenalSurfaces = raw.structures;
export const hraRenalColors = Object.fromEntries(raw.structures.map(s => [s.id, s.color]));
export const hraRenalCatalog: BodyCatalog = {
  version: 1, sourceVersion: raw.specimenId, credit: raw.source.credit, license: raw.source.license,
  coordinateSystem: { sourceToSceneColumnMajor: raw.displayTransformColumnMajor, unitsPerMillimetre: 0.01 },
  structures: raw.structures.map((s): BodyStructure => ({
    ...s, fmaId: s.fmaId ?? '', system: ['artery', 'vein'].includes(s.tissue) ? 'vessels' : s.tissue === 'capsule' ? 'connective' : 'organs',
    category: s.tissue, sourceTree: raw.specimenId,
    region: 'independent-kidneys', regions: ['independent-kidneys'],
    bounds: s.bounds as BodyStructure['bounds'], center: s.center as Vec3, anchor: s.anchor as Vec3,
    provenance: { method: 'licensed-source-mesh', sourceVersion: raw.source.version, license: raw.source.license, recovered: false },
    validation: { status: 'unvalidated', anatomicalReview: false },
  })),
  bundles: raw.bundles, regions: [], excluded: [],
  coverage: { nerves: 'Not supplied', organs: 'Partial independent renal reference; three source surfaces held' },
};
type Surface = typeof raw.structures[number];
function study(id: string, title: string, predicate: (s: Surface) => boolean, selected: string, note: string): SpecimenStudy {
  const members = raw.structures.filter(predicate), selection = members.find(s => s.sourceName === selected);
  if (!selection || !members.length) throw Error('Invalid renal study: ' + id);
  return { id, title, ids: members.map(s => s.id), selectedId: selection.id, view: 'anterior', note };
}
const internal = ['pyramid', 'papilla', 'minor-calyx', 'major-calyx', 'pelvis'];
export const hraRenalStudies: SpecimenStudy[] = [
  ...(['right', 'left'] as const).flatMap(side => {
    const title = side === 'right' ? 'Right' : 'Left', key = side === 'right' ? 'R' : 'L';
    return [
      study('internal-' + side, title + ' kidney · inside', s => s.laterality === side && internal.includes(s.concept), 'VH_F_renal_pelvis_' + key,
        'Capsule and outer cortical surfaces are hidden to reveal the supplied pyramids, papillae and collecting regions. Letter suffixes do not establish which papilla drains into which calyx.'),
      study('collecting-' + side, title + ' collecting system', s => s.laterality === side && ['minor-calyx', 'major-calyx', 'pelvis'].includes(s.concept), 'VH_F_renal_pelvis_' + key,
        'Minor and major calyx source groups with the renal pelvis. Open ends and separate inner/outer shells are retained; no continuous lumen or urine flow is simulated.'),
      study('layers-' + side, title + ' kidney · supplied layers', s => s.laterality === side && !['artery', 'vein', 'ureter'].includes(s.concept), 'VH_F_kidney_capsule_' + key,
        side === 'right' ? 'Start outside, then remove the capsule and outer cortex. The right renal-column source is held for geometry defects; its absence is not normal anatomy.' : 'Start outside, then remove the capsule. The left outer-cortex source is held for geometry defects; the supplied left columns are not a substitute for a complete cortex.'),
    ];
  }),
  study('hila', 'Hila, pelves & vessels', s => ['hilum', 'pelvis', 'artery', 'vein'].includes(s.concept), 'VH_F_renal_pelvis_R',
    'Two hila and pelves with the supplied renal arteries and right renal vein. The defective left vein is withheld. No complete vessel tree or operative hilar arrangement is established.'),
  study('ureters', 'Pelves & ureters', s => ['pelvis', 'ureter'].includes(s.concept), 'VH_F_renal_pelvis_R',
    'Inspect the supplied long ureter surfaces separately from close-up renal studies. Bladder insertions, wall layers and patency are not validated.'),
  study('all', 'All supplied renal surfaces', () => true, 'VH_F_renal_pelvis_R',
    '82 source selections, not 82 unique anatomical concepts. Partial independent female reference; the left outer cortex, right renal columns and left renal vein remain excluded.'),
];
export const hraRenalDefinition: SpecimenDefinition = {
  key: raw.specimenId, label: 'Kidneys', source: raw.source, surfaces: raw.structures,
  catalog: hraRenalCatalog, studies: hraRenalStudies, initialStudy: 'internal-right', closeUp: null, omittedFaces: 0,
  limitations: 'Partial independent HRA reference. Three defective surfaces are held. No renal fascia/fat, nerves, nephron microanatomy, complete vascular tree, validated drainage connections or CT/MRI registration.',
};
const canonical = (v: unknown): string => Array.isArray(v) ? `[${v.map(canonical).join(',')}]` : v && typeof v === 'object'
  ? `{${Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical((v as Record<string, unknown>)[k])).join(',')}}` : JSON.stringify(v);
const pin = canonical(hraRenalDefinition);
export const hraRenalMatches = (d: SpecimenDefinition) => canonical(d) === pin;
export function hraRenalSurfaceMatches(d: SpecimenDefinition, s: SpecimenSurface) {
  return hraRenalMatches(d) && d.surfaces.some(candidate => canonical(candidate) === canonical(s));
}

const collectingConcepts = [
  { concept: 'papilla', label: 'Papilla', count: { left: 11, right: 10 }, inView: false },
  { concept: 'minor-calyx', label: 'Minor calyx', count: { left: 10, right: 10 }, inView: true },
  { concept: 'major-calyx', label: 'Major calyx', count: { left: 4, right: 3 }, inView: true },
  { concept: 'pelvis', label: 'Renal pelvis', count: { left: 1, right: 1 }, inView: true },
  { concept: 'ureter', label: 'Ureter', count: { left: 1, right: 1 }, inView: false },
] as const;

// Concept order only. Source letters and positions do not define drainage connections.
export function hraRenalCollectingSequence(definition: SpecimenDefinition, studyId: string | null) {
  if (!hraRenalMatches(definition) || (studyId !== 'collecting-left' && studyId !== 'collecting-right')) return null;
  const side = studyId === 'collecting-left' ? 'left' : 'right';
  const study = definition.studies.find(item => item.id === studyId);
  if (!study) return null;
  const stages = collectingConcepts.map(({ concept, label, count, inView }) => {
    const ids = raw.structures.filter(surface => surface.laterality === side && surface.concept === concept).map(surface => surface.id);
    return { concept, label, count: ids.length, ids, inView };
  });
  if (stages.some((stage, index) => stage.count !== collectingConcepts[index].count[side]
    || stage.ids.some(id => study.ids.includes(id) !== stage.inView))) return null;
  return { side, stages };
}
