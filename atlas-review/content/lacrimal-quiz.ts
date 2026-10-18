// Original general-anatomy drafts. Source meshes establish identity, not physiology or completeness.
const texas = 'https://anatomy.ttuhscep.edu/nervous_system/eye_tables.html';
const arkansas = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/viscera-tables/visceral-structures-of-the-head-and-neck/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, references: string[]) =>
  ({body, choices, correctAnswer, explanation, references});

export const lacrimalQuizQuestions = {
  gland: question('What does the lacrimal gland produce?',
    ['Tears', 'Aqueous humour', 'Nasal mucus', 'Saliva'],
    'Tears', 'The lacrimal gland is the tear-producing gland of the orbit.', [texas, arkansas]),
  canaliculus: question('What enters a lacrimal canaliculus through a lacrimal punctum?',
    ['Blood from the eyelid', 'Tears from the eyelid margin', 'Air from the nose', 'Fluid from the lacrimal sac'],
    'Tears from the eyelid margin', 'The puncta admit tears into the canaliculi, which lead toward the lacrimal sac.', [texas, arkansas]),
  sac: question('Where do tears pass after the lacrimal sac?',
    ['Conjunctival sac', 'Frontal sinus', 'Nasolacrimal duct', 'Optic canal'],
    'Nasolacrimal duct', 'The sac receives the canaliculi and drains into the nasolacrimal duct.', [texas, arkansas]),
  duct: question('Where does the nasolacrimal duct empty?',
    ['Middle nasal meatus', 'Oral cavity', 'Superior nasal meatus', 'Inferior nasal meatus'],
    'Inferior nasal meatus', 'The duct carries tears from the lacrimal sac into the inferior meatus of the nasal cavity.', [arkansas]),
} as const;
export type LacrimalQuizGroup = keyof typeof lacrimalQuizQuestions;
