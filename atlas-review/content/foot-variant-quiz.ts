// Original formative question; reference wording, figures and scans are not imported.
export const footVariantQuizQuestions = {
  opponens: {
    body: 'Which description best explains the foot structure labelled opponens digiti minimi in this atlas?',
    choices: [
      'A universally separate muscle that gives the fifth toe thumb-like opposition',
      'Some descriptions distinguish deep fifth-toe flexor fibres that attach to the fifth metatarsal',
      'The name identifies the same surface as opponens digiti minimi in the hand',
      'A tendon of the great toe that inserts into its distal phalanx',
    ],
    correctAnswer: 'Some descriptions distinguish deep fifth-toe flexor fibres that attach to the fifth metatarsal',
    explanation: 'The cited anatomical account describes a deep component of flexor digiti minimi brevis reaching the fifth metatarsal, sometimes named opponens digiti quinti. Terminology and separation vary: a labelled atlas surface does not establish a distinct muscle in every person, its motion, or a separately visible patient imaging boundary.',
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC10508328/'],
  },
} as const;
