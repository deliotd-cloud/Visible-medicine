import type { NestedConcept, NestedSection } from './nested-teaching';
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
  auditoryBrachiumMRI: {
    title: 'Sitek et al. (2022) · Human inferior-colliculus diffusion MRI research',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35392412/',
  },
  auditoryBrachiumClinical: {
    title: 'Fischer et al. (1995) · Auditory responses after a unilateral midbrain/thalamic lesion',
    url: 'https://pubmed.ncbi.nlm.nih.gov/7750451/',
  },
  auditoryBrachiumPathology: {
    title: 'Thomas et al. (2012) · Inferior-collicular signal change in SSPE: case report',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23349608/',
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
      clinical: {
        body: 'A reported unilateral lesion involving the inferior colliculus, its brachium and the medial geniculate body produced abnormal auditory evoked responses and loss of the opposite-ear input during dichotic listening, despite no subjective auditory complaint. This was a combined lesion, not proof of the effect of isolated brachial damage. Correlate structural findings with formal auditory assessment; this reference surface cannot predict hearing ability or the affected ear.',
        references: ['auditoryBrachiumClinical'],
        readiness: 'draft',
      },
      pathology: {
        body: 'A case report of subacute sclerosing panencephalitis described bilateral inferior-collicular brachial T2 hyperintensity alongside other abnormalities. The diagnosis depended on the clinical course, EEG and measles-antibody findings, not this MRI location alone. This uncommon report is not a typical-disease template, diagnostic sign or estimate of frequency. The selected source envelopes contain no inflammation, abnormal signal or patient findings.',
        references: ['auditoryBrachiumPathology'],
        readiness: 'draft',
      },
    },
    imaging: {
      mri: {
        body: 'High-resolution diffusion MRI research estimated connections of the inferior colliculus, including its brachium toward the thalamus. Connectivity-based subdivisions were less distinct in living participants than in the post-mortem data. These research streamlines are not routine structural MRI, individually demonstrated axons or proof of an intact auditory pathway. Use the supplied brachial envelope for orientation only; its surface cannot establish tract endpoints, MR signal, hearing function or patient registration.',
        references: ['auditoryBrachiumMRI'],
        readiness: 'draft',
      },
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
