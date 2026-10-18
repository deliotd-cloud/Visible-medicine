// Original formative wording about established relationships, not source-mesh pathways.
const basal = 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p05_index.html';
const pallidal = 'https://nba.uth.tmc.edu/neuroscience/m/s3/chapter04.html';
const geniculate = 'https://nba.uth.tmc.edu/neuroanatomy/L5/Lab05p10_index.html';
const thalamic = 'https://nba.uth.tmc.edu/neuroanatomy/L10/Lab10p25_index.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const deepBrainQuizQuestions = {
  caudate: question('Which structure joins the caudate nucleus in the neostriatum?',
    ['Putamen', 'Globus pallidus', 'Thalamus', 'Subthalamic nucleus'],
    'Putamen', 'Caudate and putamen are the two named parts of the neostriatum in this introductory scheme.', basal),
  putamen: question('Which structure joins the putamen in the lentiform nucleus?',
    ['Caudate nucleus', 'Globus pallidus', 'Thalamus', 'Substantia nigra'],
    'Globus pallidus', 'Putamen and globus pallidus together make up the lentiform nucleus.', basal),
  globusPallidus: question('Which structure receives a major motor-circuit output from the internal segment of the globus pallidus?',
    ['Hippocampus', 'Amygdala', 'Thalamus', 'Cerebellar cortex'],
    'Thalamus', 'The internal pallidal segment projects to thalamic nuclei; this surface does not separate pallidal segments or fibres.', pallidal),
  thalamus: question('The thalamus forms part of the lateral wall of which ventricle?',
    ['Lateral ventricle', 'Fourth ventricle', 'Cerebral aqueduct', 'Third ventricle'],
    'Third ventricle', 'The paired thalami border the third ventricle; this asks for a gross landmark, not a nuclear boundary.', thalamic),
  lateralGeniculate: question('Which sensory system is associated with the lateral geniculate body?',
    ['Visual', 'Auditory', 'Vestibular', 'Olfactory'],
    'Visual', 'The lateral geniculate body belongs to the visual relay system.', geniculate),
  medialGeniculate: question('Which sensory system is associated with the medial geniculate body?',
    ['Visual', 'Auditory', 'Vestibular', 'Olfactory'],
    'Auditory', 'The medial geniculate body belongs to the auditory relay system.', geniculate),
} as const;
export type DeepBrainQuizGroup = keyof typeof deepBrainQuizQuestions;
