import pins from '../content/um-limb-teaching-bindings.v1.json' with { type: 'json' };
import type { SpecimenLesson } from '../content/um-limb-teaching';
import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';
import { specimenTopics, type SpecimenTopic } from './specimen-links';
const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(value);

/** Exact source binding, not a guessed name/FMA correspondence. Returning a
 * detached lesson prevents a viewer from modifying the shared registry. */
export function specimenTeachingFor(definition: SpecimenDefinition, selected: SpecimenSurface): SpecimenLesson | null {
  const current = definition.surfaces.find(s => s.id === selected.id);
  const pin = pins.bindings.find(p => p.surface.id === selected.id);
  const bundle = definition.catalog.bundles.find(b => b.id === selected.bundle);
  if (!current || !pin || !bundle || bundle.sha256 !== pin.bundleSha256 || canonical(current) !== canonical(pin.surface) || canonical(selected) !== canonical(current)) return null;
  return JSON.parse(JSON.stringify(pin.lesson)) as SpecimenLesson;
}

/** Only exact bound drafts are linkable; absence is not a generic completed lesson. */
export function availableSpecimenTopics(definition: SpecimenDefinition, selectedId: string): SpecimenTopic[] {
  const selected = definition.surfaces.find(s => s.id === selectedId);
  const lesson = selected && specimenTeachingFor(definition, selected);
  if (!lesson) return [];
  return specimenTopics.filter(topic => topic === 'anatomy' || topic === 'function' || lesson.extended?.topics[topic]?.readiness === 'draft');
}

export { reduceIdentification } from './specimen-identification';
export type { IdentificationQuestion, IdentificationResult, IdentificationState } from './specimen-identification';
import { identificationFromPool, type IdentificationState } from './specimen-identification';

/** Only the caller's visible, pinned UM source selections can enter a round. */
export function createIdentification(definition: SpecimenDefinition, visibleIds: string[], random = Math.random, targets?: string[]): IdentificationState | null {
  const visible = new Set(visibleIds), pool = definition.surfaces.filter(s => visible.has(s.id) && specimenTeachingFor(definition, s));
  return identificationFromPool(pool, random, targets);
}
