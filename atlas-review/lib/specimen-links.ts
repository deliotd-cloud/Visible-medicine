import type { SpecimenDefinition } from './independent-specimen';
import type { DissectionView } from '../app/dissection-data';
import type { StudySearchParams } from './study-links';

export const specimenScopes = ['knee', 'hip-thigh', 'calf', 'foot', 'whole'] as const;
export type SpecimenScope = typeof specimenScopes[number];
export const specimenTopics = ['anatomy', 'function', 'clinical', 'pathology', 'ct', 'mri', 'xray', 'ultrasound'] as const;
export type SpecimenTopic = typeof specimenTopics[number];
export const specimenTopicLabels: Record<SpecimenTopic, string> = { anatomy: 'Anatomy', function: 'Function', clinical: 'Clinical', pathology: 'Pathology', ct: 'CT', mri: 'MRI', xray: 'X-ray', ultrasound: 'Ultrasound' };
export type SpecimenLinkRequest = {
  scope: SpecimenScope; structureId: string; sourceHash: string; revision: string;
  studyId: string | null; view: DissectionView; topic: SpecimenTopic | null;
};
export type ParsedSpecimenLink = { status: 'none' } | { status: 'invalid' } | { status: 'requested'; request: SpecimenLinkRequest };
export const noSpecimenLink: ParsedSpecimenLink = { status: 'none' };
export const specimenLinkKeys = ['specimen', 'specimenScope', 'specimenPart', 'specimenSource', 'specimenRevision', 'specimenStudy', 'specimenView', 'specimenTopic'] as const;
const bodyKeys = ['study', 'structure', 'side', 'source', 'focus', 'detail', 'part', 'partSource'];
const hash = /^[a-f0-9]{64}$/;
const views = ['anterior', 'posterior', 'right', 'left', 'superior', 'inferior'];

/** Lightweight route parsing: no meshes, teaching data, credentials or access
 * decisions. Mixed body/specimen links and partial/duplicated fields fail closed. */
export function parseSpecimenLink(params: StudySearchParams): ParsedSpecimenLink {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return { status: 'invalid' };
  const ownKeys = Object.keys(params);
  if (!ownKeys.some(k => k.startsWith('specimen'))) return ownKeys.some(k => bodyKeys.includes(k)) ? { status: 'invalid' } : noSpecimenLink;
  if (ownKeys.some(k => (k.startsWith('specimen') && !specimenLinkKeys.includes(k as typeof specimenLinkKeys[number])) || bodyKeys.includes(k))) return { status: 'invalid' };
  const values = specimenLinkKeys.map(k => Object.hasOwn(params, k) ? params[k] : undefined);
  if (values.some(v => Array.isArray(v))) return { status: 'invalid' };
  const [marker, scope, part, source, revision, study, view, topic] = values;
  if (marker !== 'um-limb-1' || typeof scope !== 'string' || !specimenScopes.includes(scope as SpecimenScope)
    || typeof part !== 'string' || !/^vm:reference:um-5t6tz7-v1-2:(?:knee|lower-limb):[a-z0-9-]{1,100}$/.test(part)
    || typeof source !== 'string' || !hash.test(source) || typeof revision !== 'string' || !hash.test(revision)
    || (study !== undefined && (typeof study !== 'string' || !/^[a-z0-9-]{1,80}$/.test(study)))
    || typeof view !== 'string' || !views.includes(view) || (topic !== undefined && !specimenTopics.includes(topic as SpecimenTopic))) return { status: 'invalid' };
  return { status: 'requested', request: { scope: scope as SpecimenScope, structureId: part, sourceHash: source, revision,
    studyId: study ?? null, view: view as DissectionView, topic: (topic as SpecimenTopic | undefined) ?? null } };
}
export function specimenReturnPath(scope: SpecimenScope): string {
  return `/regions/${scope === 'foot' ? 'foot' : scope === 'hip-thigh' ? 'thigh' : 'leg'}`;
}
export function specimenLinkKey(link: ParsedSpecimenLink) { return JSON.stringify(link); }
export function canonicalSpecimenValue(value: unknown): string {
  return Array.isArray(value) ? `[${value.map(canonicalSpecimenValue).join(',')}]` : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalSpecimenValue((value as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(value);
}
export function specimenNavigationPayload(definition: SpecimenDefinition) {
  return { key: definition.key, source: definition.source, surfaces: definition.surfaces,
    coordinateSystem: definition.catalog.coordinateSystem, bundles: definition.catalog.bundles,
    studies: definition.studies, closeUp: definition.closeUp };
}
