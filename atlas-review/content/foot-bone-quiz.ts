// Original formative wording about usual anatomy, not validation of source meshes.
const lower = 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const openstax = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb';
const terms = 'https://openstax.org/books/anatomy-and-physiology/pages/8-key-terms';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference = lower) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const footBoneQuizQuestions = {
  firstMetatarsal: question('Which tarsal meets the first metatarsal proximally?',
    ['Cuboid', 'Medial cuneiform', 'Talus', 'Calcaneus'], 'Medial cuneiform',
    'The medial cuneiform articulates anteriorly with the first metatarsal.', terms),
  secondMetatarsal: question('Which cuneiform lies directly proximal to the second metatarsal?',
    ['Cuboid', 'Lateral cuneiform', 'Intermediate cuneiform', 'Talus'], 'Intermediate cuneiform',
    'The intermediate cuneiform lies behind the second metatarsal base.', terms),
  thirdMetatarsal: question('Which cuneiform meets the third metatarsal?',
    ['Cuboid', 'Intermediate cuneiform', 'Medial cuneiform', 'Lateral cuneiform'], 'Lateral cuneiform',
    'The lateral cuneiform articulates anteriorly with the third metatarsal.', terms),
  fourthMetatarsal: question('Which tarsal meets the fourth metatarsal proximally?',
    ['Cuboid', 'Talus', 'Navicular', 'Medial cuneiform'], 'Cuboid',
    'The cuboid articulates distally with the fourth metatarsal.'),
  fifthMetatarsal: question('Which part of the fifth metatarsal expands into a palpable lateral prominence?',
    ['Head', 'Base', 'Shaft midpoint', 'Distal articular face'], 'Base',
    'Its expanded proximal base makes a bump along the lateral foot.', openstax),
  proximalHallux: question('Which bone lies immediately proximal to the proximal phalanx of the great toe?',
    ['Distal phalanx', 'Second metatarsal', 'First metatarsal', 'Medial cuneiform'], 'First metatarsal',
    'The first metatarsal head meets the great toe’s proximal phalanx.'),
  proximalLesser: question('Which bone meets the base of a lesser toe’s proximal phalanx?',
    ['Navicular', 'Corresponding distal phalanx', 'Cuboid', 'Corresponding metatarsal'], 'Corresponding metatarsal',
    'A proximal phalanx meets the head of its corresponding metatarsal.'),
  middleLesser: question('Which phalanx lies immediately proximal to a lesser toe’s middle phalanx?',
    ['Proximal phalanx', 'Distal phalanx', 'First metatarsal', 'Talus'], 'Proximal phalanx',
    'The middle phalanx meets the proximal phalanx of the same toe.'),
  distalHallux: question('Which phalanx lies immediately proximal to the great toe’s distal phalanx?',
    ['Middle phalanx', 'Proximal phalanx', 'Second metatarsal', 'Cuboid'], 'Proximal phalanx',
    'The great toe has proximal and distal phalanges, with no middle phalanx.'),
  distalLesser: question('Which phalanx lies immediately proximal to a lesser toe’s distal phalanx?',
    ['Navicular', 'Proximal phalanx', 'Middle phalanx', 'Corresponding metatarsal'], 'Middle phalanx',
    'In a lesser toe, the middle phalanx lies between the proximal and distal phalanges.'),
} as const;
export type FootBoneQuizGroup = keyof typeof footBoneQuizQuestions;
