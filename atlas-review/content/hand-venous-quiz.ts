// Original factual questions about usual anatomy, not this source donor's drainage.
const palmarReference = 'https://www.ncbi.nlm.nih.gov/sites/books/NBK545377/?report=classic';
const dorsalReference = 'https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const handVenousQuizQuestions = {
  deepArch: question('The deep palmar venous arch accompanies which arterial arch?',
    ['Superficial palmar', 'Dorsal carpal', 'Deep palmar', 'Plantar'], 'Deep palmar',
    'The corresponding deep palmar arterial arch.', palmarReference),
  superficialArch: question('Which veins empty into the superficial palmar venous arch?',
    ['Common palmar digital', 'Palmar metacarpal', 'Dorsal metacarpal', 'Brachial'], 'Common palmar digital',
    'Common palmar digital veins enter this arch.', palmarReference),
  dorsalNetwork: question('Which vein receives lateral drainage from the dorsal hand venous network?',
    ['Basilic', 'Cephalic', 'Brachial', 'Median cubital'], 'Cephalic',
    'The cephalic receives the lateral side; basilic receives the medial side.', dorsalReference),
  metacarpal: question('Palmar metacarpal veins usually drain into which arch?',
    ['Deep palmar venous', 'Superficial palmar venous', 'Dorsal venous', 'Plantar venous'], 'Deep palmar venous',
    'They drain into the deep palmar venous arch.', palmarReference),
  properDigital: question('In the palmar drainage pathway, which veins receive blood from proper palmar digital veins?',
    ['Dorsal metacarpal', 'Palmar metacarpal', 'Radial', 'Common palmar digital'], 'Common palmar digital',
    'Common palmar digital veins receive them.', palmarReference),
} as const;
export type HandVenousQuizGroup = keyof typeof handVenousQuizQuestions;
