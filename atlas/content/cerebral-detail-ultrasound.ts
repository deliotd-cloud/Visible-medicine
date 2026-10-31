import type { NestedSection } from './nested-teaching';

// Original orientation drafts; linked references are retained in the existing registry.
const draft = (body: string): NestedSection => ({
  body,
  references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'],
  readiness: 'draft',
});

export const cerebralDetailUltrasound = {
  insula: draft(
    'On neonatal coronal and far-lateral sagittal views, find the insula deep to the lateral sulcus. Access and probe angle affect visibility.',
  ),
  hippocampus: draft(
    'On neonatal coronal views, orient to hippocampal tissue bulging into the temporal horn. Conventional ultrasound does not reliably separate its internal subfields.',
  ),
  superiorTemporalAnterior: draft(
    'On neonatal coronal views, superior temporal cortex lies below the lateral sulcus. The model\'s anterior division is not an ultrasound boundary.',
  ),
  superiorTemporalPosterior: draft(
    'Follow neonatal temporal cortex below the lateral sulcus across adjacent planes. Ultrasound does not establish this posterior model division or its language function.',
  ),
};
