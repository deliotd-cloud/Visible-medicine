import type { NestedSection } from './nested-teaching';

// Original educational paraphrases only. No sonograms, figures, reference
// tables, protocols, scan packages or diagnostic thresholds are redistributed.
// Scope each new title to its actual citing concepts: a shared URL must not
// silently relabel an unrelated, previously reviewed teaching packet.
export const posteriorFossaUltrasoundReferences = {
  posteriorFossaNeonatalUS2024: {
    scopedToConcept: true,
    title: 'AIUM · Neurosonography in neonates and infants, 2024 revision',
    url: 'https://onlinelibrary.wiley.com/doi/10.1002/jum.16551',
  },
  posteriorFossaBrainstemMorphometry: {
    scopedToConcept: true,
    title: 'Chen et al. · Neonatal brainstem sonography through the foramen magnum (2021)',
    url: 'https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2021.770908/full',
  },
  posteriorFossaUltrasoundMRI: {
    scopedToConcept: true,
    title: 'Steggerda et al. · Posterior-fossa ultrasound compared with MRI in high-risk term infants (2015)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25899415/',
  },
};

const draft = (body: string, ...references: string[]): NestedSection => ({
  body,
  references,
  readiness: 'draft',
});

export const posteriorFossaUltrasoundTeaching = {
  midbrain: draft(
    'For neonatal/infant neurosonography, relate this midbrain selection to the midline brainstem and aqueduct assessed in sagittal views. An anterior-fontanelle examination does not guarantee that each internal midbrain structure is resolved; acoustic access can be limited by a small fontanelle. This adult source compound supplies neither neonatal proportions nor sonographic landmarks. Its colliculi, nuclei and aqueduct are not separately segmented. No adult transcranial protocol, diagnostic conclusion or patient-image alignment is provided.',
    'posteriorFossaNeonatalUS2024',
  ),
  pons: draft(
    'In neonatal research, midline sagittal sonograms through the anterior fontanelle and foramen magnum were used to assess pontine dimensions. The study compared 67 healthy term newborns with 36 preterm infants; it does not establish a universal growth threshold or an individual outcome prediction. Use this grouped adult pons only for anatomical orientation. Its two source halves do not represent a sonographic plane, measured infant dimensions, echogenicity, resolved nuclei or continuity with a patient’s scan.',
    'posteriorFossaBrainstemMorphometry',
  ),
  medulla: draft(
    'A neonatal observational study measured the medulla through the foramen magnum in the midline sagittal plane; that window was used specifically for the medullary measurements. This is a specialist neonatal technique, not evidence that routine adult transcranial ultrasound delineates the medulla. The paired adult source surfaces are a conceptual location aid, not a caliper placement guide, normal growth curve or prognostic test. They contain no ultrasound signal, acquired plane, tract detail or patient-space registration.',
    'posteriorFossaBrainstemMorphometry',
  ),
  cerebellum: draft(
    'In neonatal/infant ultrasound, mastoid-fontanelle views add access to the posterior fossa; compare both sides and the midline with complementary views. In a retrospective cohort of 113 high-risk term neonates, adding these views improved detection, but MRI still found abnormalities missed by ultrasound. Do not interpret a reassuring teaching surface as exclusion of injury. This grouped adult cerebellum does not encode neonatal anatomy, echogenicity, a fontanelle window, vermian boundaries, diagnostic sensitivity or an acquired imaging plane.',
    'posteriorFossaNeonatalUS2024', 'posteriorFossaUltrasoundMRI',
  ),
} satisfies Record<'midbrain' | 'pons' | 'medulla' | 'cerebellum', NestedSection>;
