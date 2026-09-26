import type { StudySearchParams } from './study-links';
import type { DissectionView } from '../app/dissection-data';
import {
  canonicalSpecimenValue,
  specimenNavigationPayload,
} from './specimen-links';
import {
  initialSpecimen,
  reduceSpecimen,
  specimenAction,
  type SpecimenDefinition,
} from './independent-specimen';

// Reference frame names identify these sources, never a patient series or a
// validated registration. Version-3 coordinates remain separate from version 4.
export const independentStudyRoutes = [
  {
    key: 'hra-united-female-v1.10-kidneys',
    frame: 'hra-united-female-v1.10:lps-mm',
    path: '/specimens/kidneys',
  },
  {
    key: 'hra-united-female-v1.10-pelvis',
    frame: 'hra-united-female-v1.10:lps-mm',
    path: '/specimens/female-pelvis',
  },
  {
    key: 'bp3d3-back-layers',
    frame: 'bodyparts3d-v3-20110915:source',
    path: '/specimens/back-layers',
  },
  {
    key: 'bp3d3-abdominal-wall',
    frame: 'bodyparts3d-v3-20110915:source',
    path: '/specimens/abdominal-wall',
  },
] as const;
const keys = [
  'ref',
  'refSpecimen',
  'refFrame',
  'refStructure',
  'refSource',
  'refRevision',
  'refStudy',
  'refView',
] as const;
const views = [
  'anterior',
  'posterior',
  'right',
  'left',
  'superior',
  'inferior',
];
const foreignKeys = [
  'study',
  'structure',
  'side',
  'source',
  'focus',
  'detail',
  'part',
  'partSource',
];
export type IndependentStudyRequest = {
  specimenKey: string;
  frame: string;
  structureId: string;
  source: string;
  revision: string;
  studyId: string | null;
  view: DissectionView;
};
export type IndependentStudyLink =
  | { status: 'none' }
  | { status: 'invalid' }
  | { status: 'requested'; request: IndependentStudyRequest };
export const noIndependentStudyLink: IndependentStudyLink = { status: 'none' };
export function parseIndependentStudyLink(
  params: StudySearchParams,
): IndependentStudyLink {
  if (!params || typeof params !== 'object' || Array.isArray(params))
    return { status: 'invalid' };
  const names = Object.keys(params);
  const foreign = names.some(
    (k) => foreignKeys.includes(k) || k.startsWith('specimen'),
  );
  if (!names.some((k) => k.startsWith('ref')))
    return foreign ? { status: 'invalid' } : noIndependentStudyLink;
  if (
    foreign ||
    names.some(
      (k) => k.startsWith('ref') && !keys.includes(k as (typeof keys)[number]),
    )
  )
    return { status: 'invalid' };
  const values = keys.map((k) =>
    Object.hasOwn(params, k) ? params[k] : undefined,
  );
  if (values.some((v) => Array.isArray(v))) return { status: 'invalid' };
  const [
    marker,
    specimenKey,
    frame,
    structureId,
    source,
    revision,
    studyId,
    view,
  ] = values;
  const route = independentStudyRoutes.find((r) => r.key === specimenKey);
  if (
    marker !== 'independent-1' ||
    !route ||
    frame !== route.frame ||
    typeof structureId !== 'string' ||
    !structureId ||
    structureId.length > 256 ||
    typeof source !== 'string' ||
    !/^[a-f0-9]{64}$/.test(source) ||
    typeof revision !== 'string' ||
    !/^[a-f0-9]{64}$/.test(revision) ||
    (studyId !== undefined &&
      (typeof studyId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(studyId))) ||
    typeof view !== 'string' ||
    !views.includes(view)
  )
    return { status: 'invalid' };
  return {
    status: 'requested',
    request: {
      specimenKey: route.key,
      frame,
      structureId,
      source,
      revision,
      studyId: studyId ?? null,
      view: view as DissectionView,
    },
  };
}
const paramsFor = (r: IndependentStudyRequest) => ({
  ref: 'independent-1',
  refSpecimen: r.specimenKey,
  refFrame: r.frame,
  refStructure: r.structureId,
  refSource: r.source,
  refRevision: r.revision,
  ...(r.studyId ? { refStudy: r.studyId } : {}),
  refView: r.view,
});
export async function independentStudyRevision(d: SpecimenDefinition) {
  const route = independentStudyRoutes.find((r) => r.key === d.key);
  if (!route) return null;
  const value = {
    route,
    definition: specimenNavigationPayload(d),
    initialStudy: d.initialStudy,
    omittedFaces: d.omittedFaces,
    limitations: d.limitations,
  };
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalSpecimenValue(value)),
  );
  return Array.from(new Uint8Array(digest), (x) =>
    x.toString(16).padStart(2, '0'),
  ).join('');
}
export async function resolveIndependentStudyLink(
  link: IndependentStudyLink,
  d: SpecimenDefinition,
) {
  if (link.status === 'none') return { status: 'none' as const };
  const rejected = (reason: string) => ({
    status: 'rejected' as const,
    reason,
  });
  if (link.status !== 'requested')
    return rejected('This link is incomplete or malformed.');
  if (
    !link.request ||
    typeof link.request !== 'object' ||
    Array.isArray(link.request)
  )
    return rejected('This link has invalid fields.');
  const r = link.request,
    reparsed = parseIndependentStudyLink(paramsFor(r));
  if (
    reparsed.status !== 'requested' ||
    canonicalSpecimenValue(reparsed.request) !== canonicalSpecimenValue(r) ||
    r.specimenKey !== d.key
  )
    return rejected(
      'The link belongs to another specimen or has invalid fields.',
    );
  if ((await independentStudyRevision(d)) !== r.revision)
    return rejected('The source or study revision changed.');
  const selected = d.surfaces.find((s) => s.id === r.structureId),
    bundle = d.catalog.bundles.find((b) => b.id === selected?.bundle);
  if (!selected || !bundle || bundle.sha256 !== r.source)
    return rejected('The exact source structure or display model changed.');
  const study = r.studyId === null ? null : d.studies.find((s) => s.id === r.studyId);
  if (r.studyId !== null && (!study || !study.ids.includes(selected.id)))
    return rejected('The requested structure is not in this study.');
  // A structure-only link is not the historical named "all" recipe: a
  // composite specimen may admit context surfaces outside that retained recipe.
  // Use only this definition's exact source-bound surfaces, never another donor.
  const context = study
    ? reduceSpecimen(d, initialSpecimen(d), specimenAction(d, study.id)!)
    : reduceSpecimen(d, initialSpecimen(d), {
        type: 'show-only', ids: d.surfaces.map(s => s.id), selectedId: selected.id,
      });
  const state = reduceSpecimen(
    d,
    context,
    { type: 'select', id: selected.id },
  );
  return {
    status: 'ready' as const,
    selectedId: selected.id,
    view: r.view,
    topic: null,
    state: { ...state, history: [], future: [] },
    structureOnly: r.studyId === null,
    focusSelection: true,
  };
}
export async function makeIndependentStudyLink(
  d: SpecimenDefinition,
  options: {
    selectedId: string;
    studyId?: string | null;
    view: DissectionView;
  },
) {
  const route = independentStudyRoutes.find((r) => r.key === d.key),
    s = d.surfaces.find((s) => s.id === options.selectedId),
    b = d.catalog.bundles.find((b) => b.id === s?.bundle);
  const revision = await independentStudyRevision(d);
  if (!route || !s || !b || !revision) return null;
  const request: IndependentStudyRequest = {
    specimenKey: d.key,
    frame: route.frame,
    structureId: s.id,
    source: b.sha256,
    revision,
    studyId: options.studyId ?? null,
    view: options.view,
  };
  if (
    (await resolveIndependentStudyLink({ status: 'requested', request }, d))
      .status !== 'ready'
  )
    return null;
  return route.path + '?' + new URLSearchParams(paramsFor(request)).toString();
}
