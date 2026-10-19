// Original formative questions about usual anatomy; source surfaces remain unvalidated.
const headNeck = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string) => ({
  body, choices, correctAnswer, explanation, references: [headNeck],
});

export const suprahyoidMuscleQuizQuestions = {
  digastric: question('Which pairing supplies the two digastric bellies?',
    ['Anterior: mylohyoid nerve (V3); posterior: facial nerve (VII)', 'Anterior: facial nerve (VII); posterior: mylohyoid nerve (V3)', 'Both: hypoglossal nerve (XII)', 'Both: facial nerve (VII)'],
    'Anterior: mylohyoid nerve (V3); posterior: facial nerve (VII)', 'The anterior and posterior bellies have distinct nerve supplies.'),
  geniohyoid: question('Which spinal nerve supplies geniohyoid via fibers carried with XII?',
    ['C2', 'C1', 'C3', 'C4'], 'C1', 'C1 fibers travel with the hypoglossal nerve; XII carries them here.'),
  mylohyoid: question('Where does mylohyoid originate on the mandible?',
    ['Mental spine', 'Digastric fossa', 'Mylohyoid line', 'Coronoid process'],
    'Mylohyoid line', 'The mandibular mylohyoid line is its listed origin.'),
  stylohyoid: question('Which feature is the origin of stylohyoid?',
    ['Mastoid notch', 'Mental spine', 'Mylohyoid line', 'Posterior side of the styloid process'],
    'Posterior side of the styloid process', 'Stylohyoid arises from the posterior side of the styloid process.'),
} as const;
export type SuprahyoidMuscleQuizGroup = keyof typeof suprahyoidMuscleQuizQuestions;
