// Specimen teaching adaptation: CC BY-SA 2.1 Japan; BodyParts3D,
// Copyright© The Database Center for Life Science licensed by
// CC Attribution-Share Alike 2.1 Japan.
import type { SpecimenDefinition } from './independent-specimen';
import type { SpecimenGuidedDissection } from './specimen-guided-dissection';
import { backLayersSourceMatches } from './back-layers';
import { independentStudyRoutes } from './independent-study-links';

// Existing studies supply every visible set. These steps only change display
// visibility and selection; they do not delineate tissue or dissection planes.
const steps = [
  {
    id: 'supplied-context', study: 'all',
    title: 'All supplied source context',
    caption: 'Show all 14 muscle surfaces and 34 same-source bones. Select the right latissimus dorsi source surface to orient this separate specimen.',
  },
  {
    id: 'trapezius-aside', study: 'below-trapezius',
    title: 'Set trapezius source parts aside',
    caption: 'Hide all six supplied trapezius parts on both sides. Compare the remaining rhomboid, latissimus and multifidus source surfaces with the same bones; no source position changes.',
  },
  {
    id: 'rhomboid-comparison', study: 'rhomboids',
    title: 'Rhomboid source comparison',
    caption: 'Show the right and left rhomboid major and minor source surfaces with skeletal context. These four source labels do not establish an intervening layer or attachment footprint.',
  },
  {
    id: 'latissimus-comparison', study: 'latissimus',
    title: 'Latissimus pair source comparison',
    caption: 'Show the original right and left latissimus source surfaces with the same bones. Thoracolumbar fascia and complete attachment footprints are not supplied.',
  },
  {
    id: 'multifidus-comparison', study: 'multifidus',
    title: 'Multifidus source-group comparison',
    caption: 'Show the right and left source-labelled multifidus groups with bones. Disconnected source components are fragments, not identified fascicles or segmental slips.',
  },
  {
    id: 'source-context-return', study: 'all',
    title: 'Return to supplied source context',
    caption: 'Restore all supplied surfaces and compare the selected latissimus with the visible back-layer context. Missing intermediate and deep muscle stack, fascia, cord, discs and nerve routes remain absent.',
  },
] as const;

export function backGuidedDissection(
  definition: SpecimenDefinition,
): SpecimenGuidedDissection | null {
  if (!backLayersSourceMatches(definition)) return null;
  const route = independentStudyRoutes.find(item => item.key === definition.key);
  if (!route) return null;
  const admitted = new Set(definition.surfaces.map(surface => surface.id));
  const resolved = steps.map(step => {
    const study = definition.studies.find(item => item.id === step.study);
    if (!study || !study.ids.length || new Set(study.ids).size !== study.ids.length
      || study.ids.some(id => !admitted.has(id)) || !study.ids.includes(study.selectedId)
      || !['anterior', 'posterior', 'right', 'left', 'superior', 'inferior'].includes(study.view))
      return null;
    return {
      id: step.id,
      title: step.title,
      caption: step.caption,
      ids: [...study.ids],
      selectedId: study.selectedId,
      view: study.view,
    };
  });
  if (resolved.some(step => !step) || new Set(resolved.map(step => step?.id)).size !== resolved.length)
    return null;
  return structuredClone({
    id: 'back-layers-source-guide',
    title: 'Back layers source-guided dissection',
    status: 'draft',
    specimenKey: definition.key,
    sourceFrame: route.frame,
    limitation: 'Independent BodyParts3D version-3 source comparison only. Missing intermediate and deep muscle stack, fascia, spinal cord, discs and nerve routes are not reconstructed. Disconnected source components are not identified fascicles. Visibility does not certify a surgical plane, patient registration, attachment footprint or clinical interpretation. Revision-bound radiologist review remains required.',
    steps: resolved,
  } as SpecimenGuidedDissection);
}
