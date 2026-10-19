import pins from '../content/um-limb-navigation.v1.json' with { type: 'json' };
import { limbDefinitions } from './um-limb-studies';
import { initialSpecimen, reduceSpecimen, specimenAction, type SpecimenDefinition } from './independent-specimen';
import { canonicalSpecimenValue, parseSpecimenLink, specimenNavigationPayload, type ParsedSpecimenLink, type SpecimenLinkRequest, type SpecimenScope, type SpecimenTopic } from './specimen-links';
import type { DissectionView } from '../app/dissection-data';
import { availableSpecimenTopics } from './um-limb-teaching';

function requestParams(request: SpecimenLinkRequest) {
  return { specimen: 'um-limb-1', specimenScope: request.scope, specimenPart: request.structureId, specimenSource: request.sourceHash,
    specimenRevision: request.revision, specimenView: request.view, ...(request.studyId ? { specimenStudy: request.studyId } : {}), ...(request.topic ? { specimenTopic: request.topic } : {}) };
}
export function resolveSpecimenLink(link: ParsedSpecimenLink, definitions: Record<SpecimenScope, SpecimenDefinition> = limbDefinitions) {
  if (link.status === 'none') return { status: 'none' as const };
  if (link.status !== 'requested') return { status: 'rejected' as const, reason: 'invalid' as const };
  const parsed = parseSpecimenLink(requestParams(link.request));
  if (parsed.status !== 'requested' || canonicalSpecimenValue(parsed.request) !== canonicalSpecimenValue(link.request)) return { status: 'rejected' as const, reason: 'invalid' as const };
  const r = link.request, definition = definitions[r.scope], pin = pins.scopes.find(p => p.scope === r.scope);
  if (!definition || !pin || pin.revision !== r.revision || canonicalSpecimenValue(specimenNavigationPayload(definition)) !== canonicalSpecimenValue(pin.payload)) return { status: 'rejected' as const, reason: 'revision-changed' as const };
  const selected = definition.surfaces.find(s => s.id === r.structureId), bundle = definition.catalog.bundles.find(b => b.id === selected?.bundle);
  if (!selected || !bundle) return { status: 'rejected' as const, reason: 'out-of-scope' as const };
  if (bundle.sha256 !== r.sourceHash) return { status: 'rejected' as const, reason: 'source-changed' as const };
  const study = definition.studies.find(s => s.id === (r.studyId ?? 'all'));
  if (!study || !study.ids.includes(selected.id)) return { status: 'rejected' as const, reason: 'study-mismatch' as const };
  if (r.topic && !availableSpecimenTopics(definition, selected.id).includes(r.topic)) return { status: 'rejected' as const, reason: 'topic-unavailable' as const };
  const preset = specimenAction(definition, study.id)!;
  const state = reduceSpecimen(definition, reduceSpecimen(definition, initialSpecimen(definition), preset), { type: 'select', id: selected.id });
  return { status: 'ready' as const, scope: r.scope, selectedId: selected.id, view: r.view, topic: r.topic,
    state: { ...state, history: [], future: [] }, structureOnly: r.studyId === null, focusSelection: true };
}
export type ResolvedSpecimenNavigation = Extract<ReturnType<typeof resolveSpecimenLink>, { status: 'ready' }>;

/** Canonical relative URL only; no ambient query, return URL, permission, scan
 * identifier or patient coordinate is included. A link is never an entitlement. */
export function makeSpecimenLink(definition: SpecimenDefinition, options: { selectedId: string; studyId?: string | null; view: DissectionView; topic?: SpecimenTopic | null }): string | null {
  const pin = pins.scopes.find(p => p.payload.key === definition.key);
  const selected = definition.surfaces.find(s => s.id === options.selectedId), bundle = definition.catalog.bundles.find(b => b.id === selected?.bundle);
  if (!pin || !selected || !bundle) return null;
  const request: SpecimenLinkRequest = { scope: pin.scope as SpecimenScope, structureId: selected.id, sourceHash: bundle.sha256,
    revision: pin.revision, studyId: options.studyId ?? null, view: options.view, topic: options.topic ?? null };
  const parsed = parseSpecimenLink(requestParams(request));
  if (resolveSpecimenLink(parsed, { ...limbDefinitions, [request.scope]: definition }).status !== 'ready') return null;
  return '/specimens/lower-limb?' + new URLSearchParams(requestParams(request)).toString();
}
