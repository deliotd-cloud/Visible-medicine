export const cervicalQuizGroups = {
  atlas: ['FMA12519'], axis: ['FMA12520'], typicalCervical: ['FMA12521'],
  vertebraProminens: ['FMA12525'], firstThoracic: ['FMA9165'],
} as const;
export type CervicalQuizGroup = keyof typeof cervicalQuizGroups;
const bones = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-of-the-back-region/';
const spinalCord = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/spinalcord_tables.html';
export const cervicalQuizQuestions = {
  atlas: {
    body: 'Which feature distinguishes C1 (atlas) from a typical cervical vertebra?',
    choices: ['It lacks a vertebral body', 'It bears the dens', 'It articulates with the first rib', 'It lacks transverse processes'],
    correctAnswer: 'It lacks a vertebral body',
    explanation: 'C1 forms a ring with anterior and posterior arches rather than a vertebral body.', reference: bones,
  },
  axis: {
    body: 'To which vertebra does the dens belong?',
    choices: ['C1 (atlas)', 'C2 (axis)', 'C7', 'T1'],
    correctAnswer: 'C2 (axis)',
    explanation: 'The dens projects upward from C2 and acts as a pivot for rotation of C1 and the head.', reference: bones,
  },
  typicalCervical: {
    body: 'In C3, which opening lies within a transverse process?',
    choices: ['Vertebral foramen', 'Intervertebral foramen', 'Transverse foramen', 'Sacral hiatus'],
    correctAnswer: 'Transverse foramen',
    explanation: 'The transverse foramen is in a transverse process. The vertebral foramen contributes to the vertebral canal containing the spinal cord.', reference: spinalCord,
  },
  vertebraProminens: {
    body: 'Which usual feature gives C7 the name vertebra prominens?',
    choices: ['A dens', 'No vertebral body', 'A first-rib facet', 'A long, prominent spinous process'],
    correctAnswer: 'A long, prominent spinous process',
    explanation: 'C7 usually has a long spinous process. This teaching landmark alone cannot establish vertebral numbering in an individual patient.', reference: bones,
  },
  firstThoracic: {
    body: 'Which feature supports identifying T1 as the first thoracic vertebra?',
    choices: ['Rib-articulating facets', 'A dens', 'Absence of a vertebral body', 'A transverse foramen'],
    correctAnswer: 'Rib-articulating facets',
    explanation: 'Thoracic vertebrae have facets for rib articulation; T1 marks the start of the thoracic series.', reference: bones,
  },
} as const;
