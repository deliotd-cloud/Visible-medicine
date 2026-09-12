import {
  backLayersSourceMatches,
  backLayersSurfaceMatches,
} from './back-layers';
import {
  backLayersLessonIds,
  backLayersLessons,
} from '../content/back-layers-teaching';
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
  if (
    !backLayersSurfaceMatches(definition, surface) ||
    surface.tissue !== 'muscle'
  )
    return null;
  const key = surface.fmaId && backLayersLessonIds[surface.fmaId];
  const lesson = key && backLayersLessons[key];
  if (!lesson) return null;
  return {
    ...lesson,
    references: [...lesson.references],
    ...(lesson.attachments ? { attachments: { ...lesson.attachments } } : {}),
    anatomy: `${lesson.anatomy} ${surface.sourceName.includes('multifidus') ? 'The selected source contains disconnected parts, not independently labelled fascicles or a measured segmental map.' : 'This is a source-defined surface; its precise attachment footprint and muscle/aponeurotic extent remain unvalidated.'}`,
  };
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
