export const brainConnectionsQuizGroups = {
  amygdala: ['FMA72832', 'FMA72833'],
  fornix: ['FMA72924', 'FMA72925'],
  anteriorCommissure: ['FMA61961'],
  corpusCallosum: ['FMA86464'],
  choroidPlexus: ['FMA61934'],
  mammillaryBodies: ['FMA74877'],
} as const;
export type BrainConnectionsQuizGroup = keyof typeof brainConnectionsQuizGroups;
const tracts = 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p18_index.html';
export const brainConnectionsQuizQuestions = {
  amygdala: {
    body: 'Where is the amygdala relative to the hippocampus?',
    choices: ['Anterior, in the medial temporal region', 'Within the cerebellar vermis', 'Behind the spinal cord', 'Inside the fourth ventricle'],
    correctAnswer: 'Anterior, in the medial temporal region',
    explanation: 'The amygdala lies anterior to the hippocampus. It is a group of nuclei, not a ventricular cavity.',
    reference: 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p21_index.html',
  },
  fornix: {
    body: 'Which relationship describes the fornix?',
    choices: ['A cerebellar cortical fold', 'A hippocampal pathway arching beneath the corpus callosum', 'A venous sinus above the cerebrum', 'A fluid cavity within the pons'],
    correctAnswer: 'A hippocampal pathway arching beneath the corpus callosum',
    explanation: 'The fornix carries hippocampal connections. Its arch lies below the corpus callosum; a surface model does not trace individual axons.',
    reference: tracts,
  },
  anteriorCommissure: {
    body: 'What does the anterior commissure connect?',
    choices: ['Only structures within one hemisphere', 'The two vertebral arteries', 'Regions across the hemispheres, including temporal cortex', 'The lateral and fourth ventricles'],
    correctAnswer: 'Regions across the hemispheres, including temporal cortex',
    explanation: 'This commissural bundle crosses the midline and includes fibres connecting temporal regions. It is not a vessel or CSF channel.',
    reference: tracts,
  },
  corpusCallosum: {
    body: 'What is the principal connection represented by the corpus callosum?',
    choices: ['Retina to optic disc', 'Cerebellum to spinal roots', 'Third to fourth ventricle', 'The two cerebral hemispheres'],
    correctAnswer: 'The two cerebral hemispheres',
    explanation: 'The corpus callosum is a commissural white-matter connection between cerebral hemispheres, not a ventricular passage.',
    reference: tracts,
  },
  choroidPlexus: {
    body: 'What is a major function of the choroid plexus?',
    choices: ['Cerebrospinal fluid production', 'Conduction of corticospinal signals', 'Venous drainage through the jugular vein', 'Movement of the eye'],
    correctAnswer: 'Cerebrospinal fluid production',
    explanation: 'Choroid plexus tissue produces CSF within the ventricles. The selected surfaces do not represent the entire ventricular system.',
    reference: 'https://www.cancer.gov/publications/dictionaries/cancer-terms/def/csf',
  },
  mammillaryBodies: {
    body: 'Which hippocampal pathway reaches the mammillary bodies?',
    choices: ['Optic radiation', 'Postcommissural fornix', 'Corticospinal tract', 'Medial lemniscus'],
    correctAnswer: 'Postcommissural fornix',
    explanation: 'Postcommissural fornix fibres reach the mammillary bodies in memory-related circuitry. The grouped surface selection is not tractography.',
    reference: 'https://nba.uth.tmc.edu/neuroscience/s4/chapter05.html',
  },
} as const;
