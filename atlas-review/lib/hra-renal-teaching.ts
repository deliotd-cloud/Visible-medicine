import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';
import { hraRenalMatches, hraRenalSurfaceMatches, hraRenalSurfaces } from './hra-renal';
import { authoredHraRenalLesson } from '../content/hra-renal-teaching';
import { identificationFromPool, type SpecimenPracticeAdapter } from './specimen-identification';

export function hraRenalTeaching(d: SpecimenDefinition, s: SpecimenSurface) {
  if (!hraRenalSurfaceMatches(d, s)) return null;
  const source = hraRenalSurfaces.find(row => row.id === s.id);
  return source ? authoredHraRenalLesson(source.concept) : null;
}
function eligibleIds(d: SpecimenDefinition, ids: string[]) {
  if (!hraRenalMatches(d) || new Set(ids).size !== ids.length || ids.some(id => !d.surfaces.some(s => s.id === id))) return [];
  // Exclude arbitrary lettered parts from BOTH targets and distractors.
  return hraRenalSurfaces.filter(s => ids.includes(s.id) && !s.sourcePart && hraRenalTeaching(d, s)).map(s => s.id);
}
export const hraRenalPractice: SpecimenPracticeAdapter = {
  eligibleIds,
  createRound(d, ids, random = Math.random, targets) {
    const eligible = eligibleIds(d, ids);
    if (targets && (new Set(targets).size !== targets.length || targets.some(id => !eligible.includes(id)))) return null;
    return identificationFromPool(d.surfaces.filter(s => eligible.includes(s.id)), random, targets);
  },
  feedback: (d, s) => hraRenalTeaching(d, s)?.function ?? null,
  scopeNote: 'Source-identification practice, not a validated exam. Lettered papillae, pyramids and calyx parts are excluded from questions and choices. Use a hilar, ureter or all-surfaces study for at least two eligible selections. Your dissection is preserved on return.',
};
