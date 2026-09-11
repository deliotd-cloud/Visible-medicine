import { abdominalWallDefinition, abdominalWallNote } from './abdominal-wall';
import { identificationFromPool, type SpecimenPracticeAdapter } from './specimen-identification';
import type { SpecimenDefinition } from './independent-specimen';

const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}` : JSON.stringify(value);
// Snapshot before any caller can mutate a definition; includes the catalogue,
// bundle bytes/hash, source version/licence, transform, every surface and recipe.
const pin = canonical(abdominalWallDefinition);
export function abdominalPracticeIds(definition: SpecimenDefinition, visibleIds: string[]) {
  if (canonical(definition) !== pin || new Set(visibleIds).size !== visibleIds.length
    || visibleIds.some(id => !definition.surfaces.some(s => s.id === id))) return [];
  return definition.surfaces.filter(s => visibleIds.includes(s.id) && s.tissue === 'muscle' && abdominalWallNote(s)).map(s => s.id);
}
export const abdominalWallPractice: SpecimenPracticeAdapter = {
  eligibleIds: abdominalPracticeIds,
  createRound(definition, visibleIds, random = Math.random, targets) {
    const ids = abdominalPracticeIds(definition, visibleIds);
    // A stale/foreign retry request must not quietly fall back to a new round.
    if (targets && (new Set(targets).size !== targets.length || targets.some(id => !ids.includes(id)))) return null;
    return identificationFromPool(definition.surfaces.filter(s => ids.includes(s.id)), random, targets);
  },
  feedback: (definition, surface) => canonical(definition) === pin && definition.surfaces.some(s => canonical(s) === canonical(surface)) ? abdominalWallNote(surface) : null,
  scopeNote: 'Rounds use only the visible, source-checked abdominal muscles (up to eight). Bones are context, never answers. Your dissection and history are preserved on return. Progress lasts only for this round.',
};
