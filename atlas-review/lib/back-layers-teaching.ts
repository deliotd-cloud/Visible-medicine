import {
  backLayersSourceMatches,
  backLayersSurfaceMatches,
} from './back-layers';
import {
  backLayersLessonIds,
  backLayersLessons,
  backLayersPartNotes,
} from '../content/back-layers-teaching';
import { backLayersClinical } from '../content/back-layers-clinical';
import {
  authoredBackBoneLesson,
  backBoneBindings,
} from '../content/back-bone-teaching';
import {
  identificationFromPool,
  type SpecimenPracticeAdapter,
} from './specimen-identification';
import type {
  SpecimenDefinition,
  SpecimenSurface,
} from './independent-specimen';
import type { SpecimenLesson } from '../content/um-limb-teaching';

export function backLayersTeachingFor(
  definition: SpecimenDefinition,
  surface: SpecimenSurface,
): SpecimenLesson | null {
  if (!backLayersSurfaceMatches(definition, surface)) return null;
  if (surface.tissue === 'skeleton') {
    const bone = surface.fmaId && backBoneBindings[surface.fmaId];
    return bone ? authoredBackBoneLesson(bone) : null;
  }
  if (surface.tissue !== 'muscle') return null;
  const key = surface.fmaId && backLayersLessonIds[surface.fmaId];
  const lesson = key && backLayersLessons[key];
  if (!lesson) return null;
  // Authored records contain JSON data only; detach every nested reference list.
  const result: SpecimenLesson = JSON.parse(
    JSON.stringify({
      ...lesson,
      ...(key && backLayersClinical[key]
        ? { extended: backLayersClinical[key] }
        : {}),
    }),
  );
  const part = surface.fmaId && backLayersPartNotes[surface.fmaId];
  if (part) result.function += ` ${part}`;
  if (key === 'multifidus')
    result.function += ` For the selected ${surface.laterality} group, the typical unilateral rotational contribution is towards the ${surface.laterality === 'right' ? 'left' : 'right'}; individual levels and recruitment are not simulated.`;
  result.anatomy += ` ${key === 'multifidus' ? 'The selected source contains disconnected parts, not independently labelled fascicles or a measured segmental map.' : 'This is a source-defined surface; its precise attachment footprint and muscle/aponeurotic extent remain unvalidated.'}`;
  return result;
}
export function backLayersPracticeIds(
  definition: SpecimenDefinition,
  visibleIds: string[],
) {
  if (
    !backLayersSourceMatches(definition) ||
    new Set(visibleIds).size !== visibleIds.length ||
    visibleIds.some((id) => !definition.surfaces.some((s) => s.id === id))
  )
    return [];
  return definition.surfaces
    .filter(
      (s) =>
        visibleIds.includes(s.id) &&
        s.tissue === 'muscle' &&
        s.fmaId &&
        backLayersLessonIds[s.fmaId],
    )
    .map((s) => s.id);
}
export const backLayersPractice: SpecimenPracticeAdapter = {
  eligibleIds: backLayersPracticeIds,
  createRound(definition, visibleIds, random = Math.random, targets) {
    const ids = backLayersPracticeIds(definition, visibleIds);
    if (
      targets &&
      (new Set(targets).size !== targets.length ||
        targets.some((id) => !ids.includes(id)))
    )
      return null;
    return identificationFromPool(
      definition.surfaces.filter((s) => ids.includes(s.id)),
      random,
      targets,
    );
  },
  feedback: (definition, surface) =>
    backLayersTeachingFor(definition, surface)?.function ?? null,
  scopeNote:
    'Rounds sample up to ten of the visible, source-checked back muscles (14 available overall). Bones are context, not answers. This tests source-surface identification, not clinical competence. Returning preserves your dissection history.',
};
