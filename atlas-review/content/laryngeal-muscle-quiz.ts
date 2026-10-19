// Original general-anatomy drafts. Source meshes do not establish muscle action or attachments.
const texas = 'https://anatomy.ttuhscep.edu/schemes/larynx_tables.html';
const arkansas = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-head-and-neck/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, references: string[]) =>
  ({body, choices, correctAnswer, explanation, references});

export const laryngealMuscleQuizQuestions = {
  lateral: question('Which action is associated with the lateral crico-arytenoid?',
    ['Adduction of the vocal folds', 'Abduction of the vocal folds', 'Elevation of the hyoid', 'Depression of the epiglottis'],
    'Adduction of the vocal folds', 'Its pull rotates the arytenoid cartilage and brings the vocal folds toward one another.', [texas]),
  posterior: question('Where does the posterior crico-arytenoid attach on the arytenoid cartilage?',
    ['Vocal process', 'Muscular process', 'Apex', 'Posterior surface near the apex'],
    'Muscular process', 'It runs from the posterior cricoid lamina to the arytenoid muscular process and abducts the vocal fold.', [texas]),
  oblique: question('The oblique arytenoid runs from one arytenoid muscular process toward which site?',
    ['Cricoid arch', 'Thyroid lamina', 'Opposite arytenoid posterior surface near its apex', 'Ipsilateral vocal ligament'],
    'Opposite arytenoid posterior surface near its apex', 'The oblique fibres cross toward the posterior surface of the opposite arytenoid near its apex.', [arkansas]),
  thyroarytenoid: question('What happens to the vocal folds when the thyro-arytenoid draws the arytenoid forward?',
    ['They abduct and lengthen', 'They elevate the hyoid', 'They tense without adducting', 'They relax and adduct'],
    'They relax and adduct', 'Drawing the arytenoid forward relaxes and adducts the vocal folds.', [arkansas]),
  vocalis: question('Which structure receives the insertion of vocalis fibres?',
    ['Vocal ligament', 'Cricoid arch', 'Hyoid body', 'Epiglottic cartilage'],
    'Vocal ligament', 'Vocalis represents medial thyro-arytenoid fibres inserting along the vocal ligament.', [arkansas]),
  transverse: question('Which nerve supplies the transverse arytenoid?',
    ['External branch of superior laryngeal nerve', 'Inferior laryngeal nerve from the recurrent laryngeal nerve', 'Glossopharyngeal nerve', 'Hypoglossal nerve'],
    'Inferior laryngeal nerve from the recurrent laryngeal nerve', 'Like the other listed intrinsic laryngeal muscles, transverse arytenoid receives inferior laryngeal innervation.', [texas]),
} as const;
export type LaryngealMuscleQuizGroup = keyof typeof laryngealMuscleQuizQuestions;
