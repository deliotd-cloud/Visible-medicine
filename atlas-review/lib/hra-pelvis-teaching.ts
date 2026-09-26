import type {
  SpecimenDefinition,
  SpecimenSurface,
} from './independent-specimen';
import type { SpecimenLesson } from '../content/um-limb-teaching';
import { hraPelvicSurfaceMatches, hraPelvisMatches } from './hra-pelvis';
import { hraRenalDefinition } from './hra-renal';
import { hraRenalTeaching } from './hra-renal-teaching';
import { hraRenalReferenceTitles } from '../content/hra-renal-teaching';
import {
  identificationFromPool,
  type SpecimenPracticeAdapter,
} from './specimen-identification';
import {
  authoredHraPelvicLesson,
  hraPelvicLessonBindings,
  hraPelvicReferenceTitles,
} from '../content/hra-pelvic-teaching';

export const hraPelvicContextReferenceTitles = { ...hraPelvicReferenceTitles, ...hraRenalReferenceTitles };

export function hraPelvicTeaching(
  definition: SpecimenDefinition,
  surface: SpecimenSurface,
): SpecimenLesson | null {
  if (!hraPelvicSurfaceMatches(definition, surface)) return null;
  const concept = hraPelvicLessonBindings[surface.id];
  if (!concept && ['VH_F_right_ureter', 'VH_F_left_ureter'].includes(surface.sourceName))
    return hraRenalTeaching(hraRenalDefinition, surface);
  return concept ? authoredHraPelvicLesson(concept) : null;
}
function eligibleIds(d: SpecimenDefinition, ids: string[]) {
  if (
    !hraPelvisMatches(d) ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !d.surfaces.some((s) => s.id === id))
  )
    return [];
  return d.surfaces
    .filter((s) => ids.includes(s.id) && hraPelvicTeaching(d, s))
    .map((s) => s.id);
}
export const hraPelvicPractice: SpecimenPracticeAdapter = {
  eligibleIds,
  createRound(d, ids, random = Math.random, targets) {
    const eligible = eligibleIds(d, ids);
    if (
      targets &&
      (new Set(targets).size !== targets.length ||
        targets.some((id) => !eligible.includes(id)))
    )
      return null;
    return identificationFromPool(
      d.surfaces.filter((s) => eligible.includes(s.id)),
      random,
      targets,
    );
  },
  feedback: (d, s) => hraPelvicTeaching(d, s)?.function ?? null,
  scopeNote:
    'Source-identification practice only, using up to ten visible source-checked pelvic selections with draft teaching. Not a validated anatomy examination. Your dissection is preserved on return.',
};
