export const cranialBoneQuizGroups = {
  frontal: ['FMA52734'],
  parietal: ['FMA52788', 'FMA52789'],
  occipital: ['FMA52735'],
  temporal: ['FMA52738', 'FMA52739'],
  sphenoid: ['FMA52736'],
  ethmoid: ['FMA52740'],
} as const;
export type CranialBoneQuizGroup = keyof typeof cranialBoneQuizGroups;
const uams = 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/bone-tables/bones-and-cartilages-of-the-head-and-neck/';
const ttuhsc = 'https://anatomy.ttuhscep.edu/anatomytables/bones_alpha.html';
export const cranialBoneQuizQuestions = {
  frontal: {
    body: 'Which cranial bone contributes to the roof of the orbit?',
    choices: ['Frontal bone', 'Parietal bone', 'Occipital bone', 'Temporal bone'],
    correctAnswer: 'Frontal bone',
    explanation: 'The frontal bone contributes the superior bony boundary of each orbit.', reference: uams,
  },
  parietal: {
    body: 'Which suture joins the two parietal bones along the skull midline?',
    choices: ['Coronal suture', 'Sagittal suture', 'Lambdoid suture', 'Squamous suture'],
    correctAnswer: 'Sagittal suture',
    explanation: 'The sagittal suture runs between the paired parietal bones.', reference: uams,
  },
  occipital: {
    body: 'The occipital condyles articulate directly with which vertebra?',
    choices: ['C2 (axis)', 'C3', 'C1 (atlas)', 'T1'],
    correctAnswer: 'C1 (atlas)',
    explanation: 'The paired occipital condyles meet the atlas at the atlanto-occipital joints.', reference: uams,
  },
  temporal: {
    body: 'Which part of the temporal bone encloses the bony labyrinth?',
    choices: ['Mastoid process', 'Zygomatic process', 'Squamous part', 'Petrous part'],
    correctAnswer: 'Petrous part',
    explanation: 'The petrous temporal bone surrounds the bony labyrinth of the inner ear.', reference: ttuhsc,
  },
  sphenoid: {
    body: 'Which cranial bone contains the sella turcica and its hypophyseal fossa?',
    choices: ['Sphenoid bone', 'Ethmoid bone', 'Frontal bone', 'Occipital bone'],
    correctAnswer: 'Sphenoid bone',
    explanation: 'The sella is a depression in the sphenoid body; its fossa accommodates the pituitary gland.', reference: ttuhsc,
  },
  ethmoid: {
    body: 'Which plate permits olfactory nerve fibres to pass toward the olfactory bulbs?',
    choices: ['Perpendicular plate', 'Cribriform plate', 'Orbital plate', 'Pterygoid plate'],
    correctAnswer: 'Cribriform plate',
    explanation: 'Small openings in the ethmoid cribriform plate transmit olfactory nerve fibres.', reference: ttuhsc,
  },
} as const;
