import { abdominalWallNote } from './abdominal-wall';
import { abdominalSourceMatches, abdominalSurfaceMatches } from './abdominal-wall-binding';
import { identificationFromPool, type SpecimenPracticeAdapter } from './specimen-identification';
import type { SpecimenDefinition } from './independent-specimen';

export function abdominalPracticeIds(definition: SpecimenDefinition, visibleIds: string[]) {
  if (!abdominalSourceMatches(definition) || new Set(visibleIds).size !== visibleIds.length
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
  feedback: (definition, surface) => abdominalSurfaceMatches(definition, surface) ? abdominalWallNote(surface) : null,
  scopeNote: 'Rounds use only the visible, source-checked abdominal muscles (up to eight). Bones are context, never answers. Your dissection and history are preserved on return. Progress lasts only for this round.',
};
