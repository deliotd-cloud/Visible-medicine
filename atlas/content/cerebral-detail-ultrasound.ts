import type { NestedSection } from './nested-teaching';

// Original orientation drafts; linked references are retained in the existing registry.
const draft = (body: string): NestedSection => ({
  body,
  references: ['cerebralNeonatalUS', 'cerebralNeonatalUSWindow'],
  readiness: 'draft',
});

export const cerebralDetailUltrasound = {
  insula: draft(
    'Through the open anterior fontanelle, follow the lateral sulcus on coronal views; the insula is deep to it. A far-lateral sagittal view can help orientation. Window and angle limit visibility. This source surface is diagrammatic, not a validated neonatal boundary or registered scan.',
  ),
  hippocampus: draft(
    'Hippocampal tissue bulges toward the temporal horn on neonatal coronal ultrasound. Use the horn as an orientation landmark, then compare nearby planes. Internal subfields and fibre structures are not readily distinguished; acoustic access varies. This coarse source surface is not a validated neonatal boundary or registered scan.',
  ),
  superiorTemporalAnterior: draft(
    'Below the lateral sulcus, orient to superior temporal cortex on neonatal coronal ultrasound. This anterior source part is a diagrammatic subdivision; its edge is not a visible or validated neonatal boundary, nor an auditory function map. Anterior-fontanelle access and plane limit assessment.',
  ),
  superiorTemporalPosterior: draft(
    'Follow the lateral sulcus and temporal tissue beneath it across neonatal coronal planes. The posterior source part is diagrammatic: ultrasound does not establish its exact edge, language territory or individual function. Visibility varies with fontanelle access and probe angle; no scan is registered here.',
  ),
};
