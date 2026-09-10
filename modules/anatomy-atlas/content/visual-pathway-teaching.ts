import type { NestedConcept, NestedSection } from './nested-teaching';
export const visualPathwayImagingReferences = {
  visualChiasmVariation: {
    title: 'Optic chiasm location and adjacent angles on 3D MRI (2019)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30879711/',
  },
  visualCoronalAnatomy: {
    title:
      'Chen et al. · Coronal sectional anatomy of the optic pathways (2009)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19837645/',
  },
  visualResearchMRI: {
    title: 'Vinogradov et al. · High-resolution optic-pathway MRI at 3T (2005)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16028247/',
  },
};
const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});
const limit =
  'Partial source surfaces, not a complete visual pathway. Individual fibres, optic radiations and functional field maps are absent. The chiasm has two closed source halves. Geniculate proximity does not prove termination; no tractography, scan registration or clinical validation is supplied.';
export const visualPathwayConcepts: NestedConcept[] = [
  {
    id: 'visual-optic-chiasm',
    study: 'visual-pathway',
    imaging: {
      mri: draft(
        'Coronal anatomical sections and MRI place the chiasm in relation to the floor of the third ventricle and pituitary stalk. A separate 3D MRI study documented variation in chiasmal position and adjacent angles. Cross-reference the actual planes rather than assuming one fixed relationship. The atlas supplies a whole-gland landmark, not a separately segmented stalk, a normal clearance measurement or a compressed chiasm.',
        'visualCoronalAnatomy',
        'visualChiasmVariation',
      ),
    },
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
    imaging: {
      mri: draft(
        'Follow each tract behind the chiasm across coronal sections and compare its position with the cerebral peduncle and geniculate region. A pilot 3T study used specialised acquisitions to distinguish anatomical surfaces from diffusion-derived fibre orientation. The atlas contains neither diffusion data nor individual axons; a coloured tract surface is not tractography, proof of geniculate termination or a patient-specific visual-field map.',
        'visualCoronalAnatomy',
        'visualResearchMRI',
      ),
    },
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
