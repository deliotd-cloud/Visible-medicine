import { kneeStudySets } from './knee-studies';
import { elbowStudySets } from '../content/elbow-studies';
import { cubitalStudies } from '../content/cubital-studies';
import { genicularStudy } from '../content/genicular-study';
import { poplitealVesselStudy } from '../content/popliteal-vessel-study';

/** Name the active study, not the containing whole-body route. Camera-only copy. */
export function studyCloseUpLabel(recipeId: string | null): string {
  if (kneeStudySets.some(study => study.id === recipeId) ||
      recipeId === genicularStudy.id || recipeId === poplitealVesselStudy.id)
    return 'Knee';
  if (elbowStudySets.some(study => study.id === recipeId) ||
      cubitalStudies.some(study => study.id === recipeId))
    return 'Elbow';
  return 'Study';
}
