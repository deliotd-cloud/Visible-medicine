// Specimen data/study adaptations: CC BY-SA 2.1 Japan; BodyParts3D / DBCLS.
// Kept in the original version-3 frame, never registered into the main body.
import raw from '../public/models/bodyparts3d-v3/back-layers/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure } from '../app/body-types';
import type {
  SpecimenDefinition,
  SpecimenStudy,
  SpecimenSurface,
} from './independent-specimen';

export const backLayersSource = raw.source;
export const backLayersSurfaces = raw.structures as SpecimenSurface[];
export const backLayersColors = Object.fromEntries(
  raw.structures.map((s) => [s.id, s.color]),
);
const surfaces = backLayersSurfaces;
const muscles = surfaces.filter((s) => s.tissue === 'muscle');
const bones = surfaces.filter((s) => s.tissue === 'skeleton');
export const backLayersCatalog: BodyCatalog = {
  version: 1,
  sourceVersion: raw.specimenId,
  credit: raw.source.credit,
  license: raw.source.license,
  coordinateSystem: {
    sourceToSceneColumnMajor: raw.displayTransformColumnMajor,
    unitsPerMillimetre: 0.01,
  },
  structures: surfaces.map(
    (s): BodyStructure => ({
      ...s,
      fmaId: s.fmaId!,
      sourceTree: 'bodyparts3d-v3-atomic',
      system: s.tissue === 'muscle' ? 'muscles' : 'skeleton',
      category: s.tissue === 'muscle' ? 'muscle' : 'bone',
      region: 'independent-back-layers',
      regions: ['independent-back-layers'],
      bounds: s.bounds as BodyStructure['bounds'],
      center: s.center as BodyStructure['center'],
      anchor: s.anchor as BodyStructure['anchor'],
      coverageNote: s.coverageNote ?? null,
      provenance: {
        method: 'licensed-source-mesh',
        sourceVersion: '3.0',
        license: raw.source.license,
        recovered: false,
      },
      validation: { status: 'unvalidated', anatomicalReview: false },
    }),
  ),
  bundles: raw.bundles,
  regions: [],
  excluded: [],
  coverage: { nerves: 'Not supplied', organs: 'Not supplied' },
};
function study(
  id: string,
  title: string,
  members: SpecimenSurface[],
  fma: string,
  note: string,
): SpecimenStudy {
  const selected = members.find((s) => s.fmaId === fma);
  if (
    !selected ||
    new Set(members).size !== members.length ||
    members.some((s) => !surfaces.includes(s))
  )
    throw Error('Invalid back source study');
  return {
    id,
    title,
    ids: members.map((s) => s.id),
    selectedId: selected.id,
    view: 'posterior',
    note,
  };
}
export const backLayersStudies = [
  study(
    'all',
    'All supplied back layers',
    surfaces,
    'FMA13358',
    '14 muscle surfaces with same-source bones. This is an independent version-3 reference, not a complete back or the newer body model.',
  ),
  study(
    'below-trapezius',
    'Set trapezius aside',
    surfaces.filter((s) => !s.sourceName.includes('trapezius')),
    'FMA13381',
    'All six trapezius parts are hidden. Inspect the rhomboids, latissimus and multifidus without moving their source positions.',
  ),
  study(
    'latissimus',
    'Latissimus pair',
    [...bones, ...muscles.filter((s) => s.sourceName.includes('latissimus'))],
    'FMA13358',
    'Compare the two original latissimus surfaces. Humeri and trunk bones are context; thoracolumbar fascia and complete attachment footprints are not segmented.',
  ),
  study(
    'rhomboids',
    'Rhomboids',
    [...bones, ...muscles.filter((s) => s.sourceName.includes('rhomboid'))],
    'FMA13383',
    'Four separately named source surfaces remain. Levator scapulae and the dorsal scapular nerve are not supplied in this view.',
  ),
  study(
    'multifidus',
    'Multifidus pair',
    [...bones, ...muscles.filter((s) => s.sourceName.includes('multifidus'))],
    'FMA22878',
    'Two source-labelled muscle groups, not individual segmental slips. Other deep-back muscles, discs and nerves are absent; this is not a surgical exposure.',
  ),
  study(
    'right',
    'Right back muscles',
    [...bones, ...muscles.filter((s) => s.laterality === 'right')],
    'FMA13358',
    'Seven original right-sided muscle surfaces, with bilateral skeletal context. Right means anatomical side, not a fixed screen position.',
  ),
  study(
    'left',
    'Left back muscles',
    [...bones, ...muscles.filter((s) => s.laterality === 'left')],
    'FMA13359',
    'Seven original left-sided surfaces, not mirrored right meshes. Set a selected surface aside and use Undo to restore it.',
  ),
  study(
    'muscles',
    'Muscles only',
    muscles,
    'FMA22878',
    'All 14 muscle surfaces without bones. Missing layers and disconnected source fragments are not reconstructed.',
  ),
];
export const backLayersDefinition: SpecimenDefinition = {
  key: raw.specimenId,
  label: 'Back layers',
  source: raw.source,
  surfaces,
  catalog: backLayersCatalog,
  studies: backLayersStudies,
  initialStudy: 'all',
  closeUp: null,
  omittedFaces: 0,
  limitations:
    'Independent version-3 source. No complete back-muscle stack, fascia, discs, spinal cord, nerve routes, validated attachment map or patient registration.',
};
const canonical = (value: unknown): string =>
  Array.isArray(value)
    ? `[${value.map(canonical).join(',')}]`
    : value && typeof value === 'object'
      ? `{${Object.keys(value)
          .sort()
          .map(
            (k) =>
              `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
          )
          .join(',')}}`
      : JSON.stringify(value);
const definitionPin = canonical(backLayersDefinition);
const surfacePins = new Set(surfaces.map(canonical));
export const backLayersSourceMatches = (definition: SpecimenDefinition) =>
  canonical(definition) === definitionPin;
export const backLayersSurfaceMatches = (
  definition: SpecimenDefinition,
  surface: SpecimenSurface,
) => backLayersSourceMatches(definition) && surfacePins.has(canonical(surface));
