// Derived BodyParts3D specimen study data: CC BY-SA 2.1 Japan.
// BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan.
import type { SpecimenDefinition } from './independent-specimen';
import { abdominalSourceMatches } from './abdominal-wall-binding';
import { independentStudyRoutes } from './independent-study-links';
import type { SpecimenGuidedDissection } from './specimen-guided-dissection';

// These steps reuse admitted source visibility studies; they do not define planes.
const studyOrder = ['all', 'internal', 'transverse', 'rectus', 'right', 'left'] as const;

export function abdominalGuidedDissection(
  definition: SpecimenDefinition,
): SpecimenGuidedDissection | null {
  if (!abdominalSourceMatches(definition)) return null;
  const route = independentStudyRoutes.find(item => item.key === definition.key);
  if (!route) return null;
  const steps = studyOrder.map(id => {
    const study = definition.studies.find(item => item.id === id);
    return study && {
      id: `abdominal-${id}`,
      title: study.title,
      caption: study.note,
      ids: [...study.ids],
      selectedId: study.selectedId,
      view: study.view,
    };
  });
  if (steps.some(step => !step || !step.ids.length || !step.ids.includes(step.selectedId)
    || new Set(step.ids).size !== step.ids.length
    || step.ids.some(id => !definition.surfaces.some(surface => surface.id === id)))) return null;
  return structuredClone({
    id: 'bp3d3-abdominal-wall-source-guide',
    title: 'Abdominal wall source-guided dissection',
    status: 'draft',
    specimenKey: definition.key,
    sourceFrame: route.frame,
    limitation: `${definition.limitations} These source-visibility steps do not validate sheath, inguinal or neurovascular planes. Source boundaries and interpretation require revision-bound radiologist review.`,
    steps,
  } as SpecimenGuidedDissection);
}
