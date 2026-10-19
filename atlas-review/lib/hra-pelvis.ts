import raw from '../public/models/hra-pelvis/catalog.json' with { type: 'json' };
import type { BodyCatalog, BodyStructure, Vec3 } from '../app/body-types';
import type { DissectionView } from '../app/dissection-data';
import renalRaw from '../public/models/hra-renal/catalog.json' with { type: 'json' };
import { hraRenalCatalog, hraRenalSurfaces } from './hra-renal';
import type {
  SpecimenDefinition,
  SpecimenSurface,
  SpecimenStudy,
} from './independent-specimen';

export const hraPelvisSource = raw.source;
// Reuse only the two already-admitted ureters, in the exact shared source frame.
// No new model, donor alignment, source-local ID or orifice admission is created.
const ureters = hraRenalSurfaces.filter(s => ['VH_F_right_ureter', 'VH_F_left_ureter'].includes(s.sourceName));
if (ureters.length !== 2 || raw.source.sha256 !== renalRaw.source.sha256
  || raw.source.version !== renalRaw.source.version
  || raw.sourceFrame !== renalRaw.sourceFrame
  || JSON.stringify(raw.displayTransformColumnMajor) !== JSON.stringify(renalRaw.displayTransformColumnMajor))
  throw Error('Pelvic urinary context requires the same verified HRA source/frame');
export const hraPelvisSurfaces = [...raw.structures, ...ureters] as SpecimenSurface[];
export const hraPelvisColors = Object.fromEntries(
  [...raw.structures, ...ureters].map((s) => [s.id, s.color]),
);
export const hraPelvisCatalog: BodyCatalog = {
  version: 1,
  sourceVersion: raw.specimenId,
  credit: raw.source.credit,
  license: raw.source.license,
  coordinateSystem: {
    sourceToSceneColumnMajor: raw.displayTransformColumnMajor,
    unitsPerMillimetre: 0.01,
  },
  structures: [...raw.structures.map(
    (s): BodyStructure => ({
      ...s,
      fmaId: s.fmaId ?? '',
      system:
        s.tissue === 'skeleton'
          ? 'skeleton'
          : s.tissue === 'ligament'
            ? 'connective'
            : ['artery', 'vein'].includes(s.tissue)
              ? 'vessels'
              : 'organs',
      category: s.tissue,
      sourceTree: raw.specimenId,
      region: 'independent-female-pelvis',
      regions: ['independent-female-pelvis'],
      bounds: s.bounds as BodyStructure['bounds'],
      center: s.center as Vec3,
      anchor: s.anchor as Vec3,
      provenance: {
        method: 'licensed-source-mesh',
        sourceVersion: raw.source.version,
        license: raw.source.license,
        recovered: false,
      },
      validation: { status: 'unvalidated', anatomicalReview: false },
    }),
  ), ...hraRenalCatalog.structures.filter(s => ureters.some(u => u.id === s.id))],
  bundles: [...raw.bundles, ...renalRaw.bundles],
  regions: [],
  excluded: [],
  coverage: {
    nerves: 'Not supplied',
    organs: 'Selected female pelvic source surfaces only',
  },
};
const surfaces = hraPelvisSurfaces;
const uterus = [
  'body-of-uterus',
  'fundus-of-uterus',
  'lower-uterine-segment',
  'cervix',
  'internal-cervical-os',
  'external-cervical-os',
];
const tubes = [
  'ampulla-of-uterine-tube-r',
  'isthmus-of-fallopian-tube-r',
  'fibria-of-uterine-tube-r',
  'uterine-tube-infundibulum-r',
  'uterine-tube-infundibulum-l',
  'fibria-of-uterine-tube-l',
  'isthmus-of-fallopian-tube-l',
  'ampulla-of-uterine-tube-l',
];
const ovaries = ['left-ovary', 'right-ovary'];
const urinary = [
  'fundus-of-urinary-bladder-dome',
  'urinary-bladder-neck-smooth-muscle',
  'fundus-of-urinary-bladder-base',
];
const vessels = [
  'left-uterine-artery',
  'right-uterine-artery',
  'left-uterine-vein',
  'right-uterine-vein',
];
function study(
  id: string,
  title: string,
  slugs: string[],
  selected: string,
  view: DissectionView,
  note: string,
): SpecimenStudy {
  const members = slugs.map((slug) => {
    const s = surfaces.find((s) => s.slug === slug);
    if (!s) throw Error('Unknown HRA pelvic source: ' + slug);
    return s.id;
  });
  const selectedId = surfaces.find((s) => s.slug === selected)?.id;
  if (
    !selectedId ||
    !members.includes(selectedId) ||
    new Set(members).size !== members.length
  )
    throw Error('Invalid HRA pelvic study');
  return { id, title, ids: members, selectedId, view, note };
}
export const hraPelvisStudies: SpecimenStudy[] = [
  study(
    'overview',
    'Uterus, tubes & ovaries',
    [...uterus, ...tubes, ...ovaries, 'vagina', 'cervicovaginal-junction'],
    'body-of-uterus',
    'anterior',
    'Compare the supplied reproductive surfaces. Their open source boundaries are retained; the omitted uterine-end and wall alternatives are not invented or filled.',
  ),
  study(
    'all',
    'All supplied pelvic surfaces',
    raw.structures.map((s) => s.slug),
    'body-of-uterus',
    'anterior',
    '41 selected source surfaces, including optional pelvic context. This is not a complete female body or a single-patient scan.',
  ),
  study(
    'uterus',
    'Uterus & cervix',
    uterus,
    'cervix',
    'right',
    'Regional uterine and cervical source surfaces. Remove a selection or set it aside; these are not validated histological wall layers or a continuous uterine lumen.',
  ),
  ...(['left', 'right'] as const).map((side) =>
    study(
      'adnexa-' + side,
      (side === 'left' ? 'Left' : 'Right') + ' adnexa',
      raw.structures
        .filter(
          (s) =>
            (s.laterality === side && s.tissue !== 'skeleton') ||
            uterus.includes(s.slug),
        )
        .map((s) => s.slug),
      side + '-ovary',
      'anterior',
      'Same-side ovary, tubal regions, supplied support and vessels with uterine context. The disputed round-ligament sources are absent. No connected lumen or full neurovascular pedicle is claimed.',
    ),
  ),
  study(
    'supports',
    'Pelvic supporting surfaces',
    [
      ...uterus,
      ...ovaries,
      ...surfaces.filter((s) => s.tissue === 'ligament').map((s) => s.slug),
    ],
    'broad-ligament',
    'posterior',
    'Set the broad source surface aside to inspect available ligament and mesentery regions. Surface groups do not establish separate peritoneal layers or surgical planes.',
  ),
  study(
    'vessels',
    'Uterine vessel context',
    [...uterus, ...vessels],
    'left-uterine-artery',
    'anterior',
    'Four partial uterine vessel surfaces with uterine context. Ureters and a complete circulation are not included; no procedural crossing or flow is demonstrated.',
  ),
  study(
    'neighbours',
    'Bladder, uterus & rectum',
    [...uterus, ...urinary, 'vagina', 'rectum', 'sacrum'],
    'body-of-uterus',
    'right',
    'Compare native source positions. Bladder dome/base have separate source-local keys despite sharing one ontology term. Source geometry is not registered to the male body or patient imaging.',
  ),
  study(
    'urinary', 'Ureters & pelvic organs',
    [...urinary, 'left-ureter', 'right-ureter', 'cervix', ...vessels],
    'left-ureter', 'anterior',
    'Existing ureters with bladder, cervix and uterine vessels in their shared HRA source frame. Ureteric-orifice candidates are excluded; no continuous lumen, validated insertion or surgical crossing is claimed.',
  ),
  ...(['left', 'right'] as const).map(side => study(
    'urinary-' + side, (side === 'left' ? 'Left' : 'Right') + ' ureter & pelvic context',
    [...urinary, side + '-ureter', 'cervix', side + '-uterine-artery', side + '-uterine-vein'],
    side + '-ureter', 'posterior',
    'Same-source ureter with ipsilateral uterine vessels and bladder/cervix context. These partial surfaces do not establish operative tissue planes, patency or a registered scan.',
  )),
];
// Frame the native pelvic region, not the complete length of the reused ureters.
// Bounds are original display coordinates; this never clips or transforms meshes.
const pelvicExtent = {
  min: [0, 1, 2].map(axis => Math.min(...raw.structures.map(s => s.bounds.min[axis]))) as Vec3,
  max: [0, 1, 2].map(axis => Math.max(...raw.structures.map(s => s.bounds.max[axis]))) as Vec3,
};
const pelvicMargin = pelvicExtent.min.map((v, axis) => (pelvicExtent.max[axis] - v) * 0.05);
export const hraPelvisCloseUp = {
  min: pelvicExtent.min.map((v, axis) => v - pelvicMargin[axis]) as Vec3,
  max: pelvicExtent.max.map((v, axis) => v + pelvicMargin[axis]) as Vec3,
};
export const hraPelvisDefinition: SpecimenDefinition = {
  key: raw.specimenId,
  label: 'Female pelvis',
  source: raw.source,
  surfaces,
  catalog: hraPelvisCatalog,
  studies: hraPelvisStudies,
  initialStudy: 'overview',
  closeUp: hraPelvisCloseUp,
  omittedFaces: 0,
  limitations:
    'Partial separate HRA reference. Six disputed/overlapping sources are withheld; no complete female skeleton, pelvic floor, nerves, pregnancy model or scan registration.',
};
const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(',')}]`
    : v && typeof v === 'object'
      ? `{${Object.keys(v)
          .sort()
          .map(
            (k) =>
              JSON.stringify(k) +
              ':' +
              canonical((v as Record<string, unknown>)[k]),
          )
          .join(',')}}`
      : JSON.stringify(v);
const pin = canonical(hraPelvisDefinition);
export const hraPelvisMatches = (definition: SpecimenDefinition) =>
  canonical(definition) === pin;
export function hraPelvicSurfaceMatches(
  definition: SpecimenDefinition,
  surface: SpecimenSurface,
) {
  return (
    hraPelvisMatches(definition) &&
    definition.surfaces.some((s) => canonical(s) === canonical(surface))
  );
}
