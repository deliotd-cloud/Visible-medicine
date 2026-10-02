// Original orientation drafts. References are reading links, not source media.
export const cubitalVenousUltrasoundReferences = {
  anatomy: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/vein-tables/selected-veins-of-the-upper-limb/',
  venousUltrasound: 'https://www.radiologyinfo.org/en/info/venousus',
  cubitalUltrasound: 'https://pubmed.ncbi.nlm.nih.gov/29140886/',
} as const;

export const cubitalVenousUltrasoundTopics = {
  cubital: {
    fmaIds: ['FMA22964', 'FMA22965'],
    body: 'Ultrasound can locate the median cubital vein in an individual elbow and assess its relationship to nearby structures. The usual superficial route between cephalic and basilic veins varies; this reference surface cannot establish the course in a patient.',
    bullets: [
      'Compare the named cubital vein with the cephalic and basilic routes at zero separation. Their source surfaces do not prove a continuous junction.',
      'An ultrasound study of volunteers assessed superficial cubital veins alongside nearby nerve and artery positions. Those acquired relationships cannot be read from this model.',
    ],
    references: ['anatomy', 'venousUltrasound', 'cubitalUltrasound'],
  },
  antebrachial: {
    fmaIds: ['FMA22968', 'FMA22969'],
    body: 'Ultrasound can map an individual superficial forearm vein. The median antebrachial vein receives return from the palm and anterior forearm, but its size and termination vary; it may reach the basilic or median cubital route.',
    bullets: [
      'Follow the supplied forearm surface towards the elbow at zero separation. The two possible terminations are alternatives, not both verified connections in this source.',
      'A local ultrasound view must establish the actual vein and neighbouring structures; this model does not supply that examination.',
    ],
    references: ['anatomy', 'venousUltrasound'],
  },
} as const;
