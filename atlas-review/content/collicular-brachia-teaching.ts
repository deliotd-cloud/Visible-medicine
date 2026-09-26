import type { NestedConcept, NestedSection } from './nested-teaching';
const pending: NestedSection = {
  body: 'Structure-specific clinical teaching is pending specialist review. No clinical findings are inferred from this source surface.',
  references: [],
  readiness: 'pending',
};
const draft = (body: string): NestedSection => ({
  body,
  references: ['auditoryBrachium'],
  readiness: 'draft',
});
export const collicularBrachiaReferences = {
  auditoryBrachium: {
    title: 'UTHealth · The auditory system',
    url: 'https://oac22.hsc.uth.tmc.edu/courses/neuroanatomy/L06P12.html',
  },
};
export const collicularBrachiaConcepts: NestedConcept[] = [
  {
    id: 'inferior-collicular-brachia',
    study: 'brainstem',
    fmaIds: ['FMA73463', 'FMA73464'],
    sections: {
      anatomy: draft(
        'The inferior collicular brachium connects the inferior colliculus with the medial geniculate region of the thalamus. Inspect the supplied left and right surfaces beside the midbrain; the target nucleus is not separately included in this study.',
      ),
      function: draft(
        'This connection carries ascending auditory information from the inferior colliculus toward the thalamic auditory relay. The model does not simulate sound, neural activity or individual axons.',
      ),
      clinical: pending,
      pathology: pending,
    },
    modelLimit:
      'Two coarse original source envelopes, not tractography or a complete auditory pathway. Shape and terminal connections remain unvalidated; superior brachia are withheld for contradictory source laterality. No patient imaging or clinical sign-off.',
    quiz: {
      question:
        'Which thalamic relay receives the ascending inferior-collicular projection?',
      answer: 'The medial geniculate body.',
      references: ['auditoryBrachium'],
      basis: 'primary-reference',
    },
  },
];
