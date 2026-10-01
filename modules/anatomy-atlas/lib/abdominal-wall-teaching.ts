import { abdominalLessonBindings, authoredAbdominalLesson } from '../content/abdominal-wall-teaching';
import { abdominalBoneLessonBindings, authoredAbdominalBoneLesson } from '../content/abdominal-bone-teaching';
import { abdominalSurfaceMatches } from './abdominal-wall-binding';
import type { SpecimenDefinition, SpecimenSurface } from './independent-specimen';

export function abdominalTeachingFor(definition: SpecimenDefinition, surface: SpecimenSurface) {
  if (!abdominalSurfaceMatches(definition, surface)) return null;
  if (surface.tissue === 'skeleton') {
    const bone = Object.hasOwn(abdominalBoneLessonBindings, surface.id) ? abdominalBoneLessonBindings[surface.id] : null;
    return bone && surface.laterality === bone.side ? authoredAbdominalBoneLesson(bone) : null;
  }
  if (surface.tissue !== 'muscle') return null;
  const binding = Object.hasOwn(abdominalLessonBindings, surface.id) ? abdominalLessonBindings[surface.id] : null;
  if (!binding || surface.laterality !== binding.side) return null;
  return authoredAbdominalLesson(binding.family, binding.side);
}
