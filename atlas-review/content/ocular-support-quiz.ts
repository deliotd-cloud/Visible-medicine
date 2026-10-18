// Original, brief teaching drafts; source figures and wording are not reproduced.
const reference = 'https://anatomy.ttuhscep.edu/schemes/eye_ans.html';

export const ocularSupportQuizQuestions = {
  check: {
    body: 'What do orbital check ligaments connect?',
    choices: [
      'Muscle sheaths to the sides of the orbit',
      'Tarsal plates to the eyelid skin',
      'The optic nerve to the cornea',
      'The lens to the orbital rim',
    ],
    correctAnswer: 'Muscle sheaths to the sides of the orbit',
    explanation: 'These connections help anchor bulbar fascia at the orbital margins.',
    references: [reference],
  },
  tarsal: {
    body: 'What is a key role of the tarsal plates?',
    choices: [
      'Supporting and shaping the eyelids',
      'Redirecting the superior oblique tendon',
      'Producing tears for the eye surface',
      'Carrying the optic nerve into the orbit',
    ],
    correctAnswer: 'Supporting and shaping the eyelids',
    explanation: 'Their dense fibrous tissue gives the eyelids support and form.',
    references: [reference],
  },
} as const;

export type OcularSupportQuizGroup = keyof typeof ocularSupportQuizQuestions;
