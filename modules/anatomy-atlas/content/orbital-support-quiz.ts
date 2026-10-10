// Original brief questions from anatomical facts; no source tables/images copied.
const reference = 'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
export const orbitalSupportQuizQuestions = {
  trochlea: {
    body: 'Which tendon turns through the orbital trochlea?',
    choices: ['Inferior oblique', 'Superior rectus', 'Superior oblique', 'Lateral rectus'],
    correctAnswer: 'Superior oblique',
    explanation: 'The trochlea redirects the superior oblique tendon; it is not the origin shared by the rectus muscles.',
    references: [reference],
  },
  ring: {
    body: 'Which muscle group shares the common tendinous ring as its usual origin?',
    choices: ['The four rectus muscles', 'Both oblique muscles', 'The eyelid-closing muscles', 'The muscles within the iris'],
    correctAnswer: 'The four rectus muscles',
    explanation: 'The recti arise at the orbital apex. The superior oblique tendon instead uses the trochlea as a pulley.',
    references: [reference],
  },
} as const;
export type OrbitalSupportQuizGroup = keyof typeof orbitalSupportQuizQuestions;
