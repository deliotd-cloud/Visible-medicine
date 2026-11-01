// Original educational synthesis. References are reading links; no figures or images are imported.
export const facialBoneUltrasoundReferences = {
  facialTrauma: 'https://doi.org/10.1002/ajum.70001',
  orbitalComplex: 'https://pubmed.ncbi.nlm.nih.gov/11010787/',
  zygomaticComplex: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7176768/',
} as const;
export const facialBoneUltrasoundTopics = {
  mandible: {
    body: 'Facial ultrasound studies have examined the mandibular symphysis and parasymphysis as accessible cortical landmarks. These lie in the anterior mandible; a local surface view does not outline the ramus, condyle, teeth or mandibular canal. Use the selected whole mandible to orient the region before comparing an acquired image.',
    bullets: [
      'The cited study involved suspected facial trauma, rather than a normal-anatomy atlas. Its cortical observations do not establish complete visibility or exclude injury elsewhere.',
      'A gap between displayed model surfaces is not an ultrasound finding. This mesh contains no echo data or patient-specific fracture.'
    ],
    references: ['facialTrauma'],
  },
  maxilla: {
    body: 'A clinical study of zygomatico-orbital injury examined the infraorbital margin and lateral wall of the maxillary sinus with ultrasound. These are regional surface landmarks, not an image of the whole maxilla. Confirm the side and exact acquired interface before relating it to the selected bone.',
    bullets: [
      'The regional examination also included neighbouring zygomatic and orbital structures. A labelled maxilla alone does not identify every echo in that examination.',
      'This injury study does not establish visibility of all sinus walls, the full orbital floor or a normality test. No sinus contents, sonographic contour or patient registration are supplied by the mesh.'
    ],
    references: ['orbitalComplex'],
  },
  zygoma: {
    body: 'A zygomatic-complex study compared ultrasound views at the arch, frontozygomatic region, infraorbital region and zygomaticomaxillary buttress with the unaffected side. Use these named regions to orient the selected side, while keeping the adjacent temporal and maxillary bones distinct. An arch view is not a view of the entire zygomatic bone.',
    bullets: [
      'The opposite-side comparison came from an injury cohort; it is not proof that all interfaces are visible in every patient or that the model has normal acquired imaging.',
      'Colour and separation in the Atlas represent selections. They do not represent echoes, fracture displacement or a measured sonographic surface.'
    ],
    references: ['zygomaticComplex'],
  },
} as const;
export const facialBoneUltrasoundNote = 'Educational draft for revision-bound radiologist review. The source bone remains anatomically unvalidated. No acquired ultrasound, diagnostic rule, patient transform or procedural guidance is supplied. Atlas, imaging-case and paid-lecture access remain independent.';
