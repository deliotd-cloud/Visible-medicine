// This specimen data/study-definition file: CC BY-SA 2.1 Japan.
// BodyParts3D / DBCLS attribution and adaptation scope: docs/ABDOMINAL_WALL_SPECIMEN.md.
import raw from '../public/models/bodyparts3d-v3/abdominal-wall/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type { SpecimenDefinition, SpecimenStudy, SpecimenSurface } from './independent-specimen';

export const abdominalWallSource = raw.source;
export const abdominalWallSurfaces = raw.structures as SpecimenSurface[];
export const abdominalWallColors = Object.fromEntries(raw.structures.map(s => [s.id, s.color]));
const surfaces = abdominalWallSurfaces;
const muscle = surfaces.filter(s => s.tissue === 'muscle'), bones = surfaces.filter(s => s.tissue === 'skeleton');
export const abdominalWallCatalog: BodyCatalog = {
  version: 1, sourceVersion: raw.specimenId, credit: raw.source.credit, license: raw.source.license,
  coordinateSystem: { sourceToSceneColumnMajor: raw.displayTransformColumnMajor, unitsPerMillimetre: .01 },
  structures: surfaces.map((s): BodyStructure => ({ ...s, fmaId: s.fmaId!, sourceTree: 'bodyparts3d-v3-atomic',
    system: s.tissue === 'muscle' ? 'muscles' : 'skeleton', category: s.tissue === 'muscle' ? 'muscle' : 'bone',
    region: 'independent-abdominal-wall', regions: ['independent-abdominal-wall'],
    bounds: s.bounds as BodyStructure['bounds'], center: s.center as BodyStructure['center'], anchor: s.anchor as BodyStructure['anchor'],
    coverageNote: s.coverageNote ?? null,
    provenance: { method: 'licensed-source-mesh', sourceVersion: '3.0', license: raw.source.license, recovered: false },
    validation: { status: 'unvalidated', anatomicalReview: false },
  })),
  bundles: raw.bundles, regions: [], excluded: [], coverage: { nerves: 'Not supplied', organs: 'Not supplied' },
};
function study(id: string, title: string, members: SpecimenSurface[], selectedFma: string, note: string): SpecimenStudy {
  const selected = members.find(s => s.fmaId === selectedFma);
  if (!selected || !members.length || members.some(s => !surfaces.includes(s))) throw Error('Invalid abdominal source study');
  return { id, title, ids: members.map(s => s.id), selectedId: selected.id, view: 'anterior', note };
}
const without = (pattern: RegExp) => surfaces.filter(s => !pattern.test(s.sourceName));
export const abdominalWallStudies = [
  study('all', 'All supplied layers', surfaces, 'FMA13336', 'Eight paired muscle surfaces with partial skeletal context. This is the older version-3 source, not the current body atlas.'),
  study('internal', 'Set external obliques aside', without(/external oblique/), 'FMA13892', 'Both external obliques are hidden. Inspect the internal obliques and rectus surfaces without changing their source positions.'),
  study('transverse', 'Expose transversus', without(/external oblique|internal oblique/), 'FMA22344', 'Both oblique pairs are hidden; transversus and rectus remain. The interface is not a validated neurovascular or surgical plane.'),
  study('rectus', 'Rectus pair', [...bones, ...muscle.filter(s => /rectus abdominis/.test(s.sourceName))], 'FMA13377', 'Compare the separate right and left rectus source surfaces. A complete sheath, linea alba and tendinous intersections are not separately segmented.'),
  study('right', 'Right wall layers', [...bones, ...muscle.filter(s => s.laterality === 'right')], 'FMA13336', 'Only the four right-sided muscles are shown, with bilateral skeletal context. Set each selected surface aside or use separation to compare it.'),
  study('left', 'Left wall layers', [...bones, ...muscle.filter(s => s.laterality === 'left')], 'FMA13337', 'Only the four left-sided muscles are shown, with bilateral skeletal context. These are actual left source files, not mirrored right surfaces.'),
  study('muscles', 'Muscles only', muscle, 'FMA13377', 'All eight muscle surfaces without bony context. No skin, superficial fascia, peritoneum, vessels or nerves have been added.'),
];
export const abdominalWallDefinition: SpecimenDefinition = {
  key: raw.specimenId, label: 'Abdominal wall', source: raw.source, surfaces, catalog: abdominalWallCatalog,
  studies: abdominalWallStudies, initialStudy: 'all', closeUp: null, omittedFaces: 0,
  limitations: 'Unregistered version-3 specimen. Complete sheath, aponeuroses, inguinal canal and neurovascular planes are not supplied or validated.',
};
const descriptions: Record<string, string> = {
  'external oblique': 'The outermost of the three flat lateral wall muscles. Its contribution to trunk rotation and lateral flexion is coordinated with the other abdominal muscles.',
  'internal oblique': 'The intermediate flat lateral wall muscle, deep to external oblique and superficial to transversus. It contributes to rotation, lateral flexion and abdominal compression.',
  'transversus abdominis': 'The deepest of the three flat lateral wall muscles. Its broadly transverse arrangement contributes to abdominal compression and trunk support.',
  'rectus abdominis': 'A paired anterior longitudinal muscle beside the midline. It contributes to trunk flexion; its source surface here is not a complete representation of the surrounding rectus sheath.',
};
export function abdominalWallNote(surface: SpecimenSurface) {
  // Full source identity, not a name/FMA match alone, is required for teaching.
  const exact = surfaces.find(s => s.id === surface.id && s.fmaId === surface.fmaId && s.sourceName === surface.sourceName && s.laterality === surface.laterality && s.bundle === surface.bundle && s.nodeName === surface.nodeName && s.tissue === surface.tissue && s.sources.length === surface.sources.length && s.sources.every((p,i) => p.file === surface.sources[i].file && p.sha256 === surface.sources[i].sha256));
  return exact?.tissue === 'muscle' ? descriptions[exact.sourceName.replace(/^(left|right) /, '')] ?? null : null;
}
export const abdominalWallReading = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax';
