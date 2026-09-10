import type { NestedConcept, NestedSection } from './nested-teaching';
const draft = (body: string, reference: string): NestedSection => ({
  body,
  references: [reference],
  readiness: 'draft',
});
const limit =
  'Partial source surfaces, not a complete visual pathway. Individual fibres, optic radiations and functional field maps are absent. The chiasm has two closed source halves. Geniculate proximity does not prove termination; no tractography, scan registration or clinical validation is supplied.';
export const visualPathwayConcepts: NestedConcept[] = [
  {
    id: 'visual-optic-chiasm',
    study: 'visual-pathway',
    fmaIds: ['FMA62045'],
    sections: {
      anatomy: draft(
        'The optic chiasm lies between the optic nerves and tracts. Nasal retinal fibres cross here, while temporal retinal fibres remain on the same side.',
        'visualCentral',
      ),
      function: draft(
        'Partial crossing brings information about the same visual hemifield from both eyes into the opposite optic tract.',
        'visualCentral',
      ),
      clinical: draft(
        'Visual-field patterns help localise pathway injury. A chiasmal pattern differs from loss confined to one eye; the surface alone cannot assess vision.',
        'visual',
      ),
      pathology: draft(
        'Compression of crossing chiasmal fibres, for example by an adjacent pituitary tumour, can produce bitemporal field loss. No tumour or compression is modelled here.',
        'visual',
      ),
    },
    modelLimit: limit,
    quiz: {
      question: 'Which retinal fibres cross at the chiasm?',
      answer: 'Fibres from the nasal half of each retina.',
      references: ['visualCentral'],
      basis: 'primary-reference',
    },
  },
  {
    id: 'visual-optic-tracts',
    study: 'visual-pathway',
    fmaIds: ['FMA62382', 'FMA67936'],
    sections: {
      anatomy: draft(
        'Each optic tract continues behind the chiasm and contains fibres from both eyes. Many terminate in the lateral geniculate body.',
        'visualCentral',
      ),
      function: draft(
        'Each tract carries information about the opposite visual hemifield, not simply information from the eye on its own side.',
        'visualCentral',
      ),
      clinical: draft(
        'Postchiasmal organisation explains why an injury may affect the corresponding half-field of both eyes. Model side is not the same as visual-field side.',
        'visual',
      ),
      pathology: draft(
        'Postchiasmal damage can cause contralateral homonymous field loss. A field pattern does not identify the cause or demonstrate a lesion in this atlas.',
        'visual',
      ),
    },
    modelLimit: limit,
    quiz: {
      question: 'Does one optic tract carry information from only one eye?',
      answer: 'No. Each tract contains fibres from both eyes.',
      references: ['visualCentral'],
      basis: 'primary-reference',
    },
  },
];
