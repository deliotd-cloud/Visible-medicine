// Original formative questions; source wording and figures are not reproduced.
const touro = 'https://gross.tun.touro.edu/2012%20Dissectors%20in%20MS%20Word/Dissectors%20PDF/2012Dissection14NasalCavityPterygopalatineFossaNasopharynx.pdf';
const washingtonState = 'https://learning.medicine.wsu.edu/wp-content/uploads/sites/4/2023/04/PDF-Lab-20.pdf';

export const nasalCartilageQuizQuestions = {
  septal: {
    body: 'Which part of the nasal septum is formed by the septal cartilage?',
    choices: [
      'The anterior cartilaginous part',
      'The posterior bony part formed by the vomer',
      'The paired lateral walls of the nasal cavities',
      'The nasal bones above the external nose',
    ],
    correctAnswer: 'The anterior cartilaginous part',
    explanation: 'The septal cartilage contributes to the anterior septum; the vomer and perpendicular plate of the ethmoid contribute to its bony part.',
    references: [touro, washingtonState],
  },
  alar: {
    body: 'How do the paired major alar cartilages relate to the nostril region?',
    choices: [
      'Each forms the posterior bony nasal septum',
      'They meet at the dorsum as the nasal bones',
      'Each curves around a nostril, with medial and lateral crura',
      'They form the superior and middle nasal conchae',
    ],
    correctAnswer: 'Each curves around a nostril, with medial and lateral crura',
    explanation: 'The major alar cartilages are paired, U-shaped parts of the flexible framework around the nares; their medial crura lie beside each other at the columella.',
    references: [washingtonState, touro],
  },
  lateral: {
    body: 'Where are the lateral nasal cartilages in relation to the septal and major alar cartilages?',
    choices: [
      'They form the posterior bony septum below the vomer',
      'They meet the septal cartilage at the dorsum and lie above the major alar cartilages',
      'They lie inside the nasal cavities as the inferior conchae',
      'They replace the paired major alar cartilages around the nares',
    ],
    correctAnswer: 'They meet the septal cartilage at the dorsum and lie above the major alar cartilages',
    explanation: 'The lateral nasal and septal cartilages are continuous at the nasal dorsum; the major alar cartilages sit inferior to the lateral nasal cartilages.',
    references: [touro],
  },
} as const;

export type NasalCartilageQuizGroup = keyof typeof nasalCartilageQuizQuestions;
