// Original formative questions about usual orbital anatomy; source surfaces remain unvalidated.
const eyeTable = 'https://anatomy.ttuhscep.edu/schemes/eye_tables.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string) => ({
  body, choices, correctAnswer, explanation, references: [eyeTable],
});

export const orbitalMuscleQuizQuestions = {
  inferiorOblique: question('Which orbital muscle begins on the floor near the lacrimal groove?',
    ['Inferior oblique', 'Superior oblique', 'Inferior rectus', 'Lateral rectus'],
    'Inferior oblique', 'Inferior oblique has an anterior orbital-floor origin.'),
  inferiorRectus: question('Which movement is a principal action of inferior rectus?',
    ['Elevation', 'Depression', 'Abduction', 'Upper-eyelid elevation'],
    'Depression', 'Inferior rectus depresses the eyeball and also adducts it.'),
  lateralRectus: question('Which nerve supplies lateral rectus?',
    ['Oculomotor nerve (III)', 'Trochlear nerve (IV)', 'Abducens nerve (VI)', 'Facial nerve (VII)'],
    'Abducens nerve (VI)', 'Lateral rectus receives abducens nerve supply.'),
  levatorPalpebraeSuperioris: question('What does levator palpebrae superioris chiefly raise?',
    ['The eyeball', 'The lower eyelid', 'The eyebrow', 'The upper eyelid'],
    'The upper eyelid', 'This muscle elevates the upper eyelid.'),
  medialRectus: question('Which movement is the main action of medial rectus?',
    ['Adduction', 'Abduction', 'Depression', 'Upper-eyelid elevation'],
    'Adduction', 'Medial rectus turns the eyeball toward the nose.'),
  superiorOblique: question('Which nerve supplies superior oblique?',
    ['Abducens nerve (VI)', 'Trochlear nerve (IV)', 'Oculomotor nerve (III)', 'Facial nerve (VII)'],
    'Trochlear nerve (IV)', 'Superior oblique receives trochlear nerve supply.'),
  superiorRectus: question('Which movement is a principal action of superior rectus?',
    ['Depression', 'Abduction', 'Elevation', 'Upper-eyelid elevation'],
    'Elevation', 'Superior rectus elevates the eyeball and also adducts it.'),
} as const;
export type OrbitalMuscleQuizGroup = keyof typeof orbitalMuscleQuizQuestions;
