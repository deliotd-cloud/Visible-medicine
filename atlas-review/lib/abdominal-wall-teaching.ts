import { abdominalLessonBindings, authoredAbdominalLesson } from '../content/abdominal-wall-teaching';
import { abdominalSurfaceMatches } from './abdominal-wall-binding';
import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';

export function abdominalTeachingFor(definition: SpecimenDefinition, surface: SpecimenSurface) {
  if (!abdominalSurfaceMatches(definition, surface) || surface.tissue !== 'muscle') return null;
  const binding = Object.hasOwn(abdominalLessonBindings, surface.id) ? abdominalLessonBindings[surface.id] : null;
  if (!binding || surface.laterality !== binding.side) return null;
  return authoredAbdominalLesson(binding.family, binding.side);
}
