// Original formative wording about usual anatomy, not validation of source meshes.
const bones = 'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html';
const joints = 'https://anatomy.ttuhscep.edu/anatomytables/joints_upperlimb.html';
const openstax = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference = bones) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const handBoneQuizQuestions = {
  firstMetacarpal: question('Which carpal forms the thumb carpometacarpal joint with the first metacarpal?',
    ['Capitate', 'Trapezium', 'Hamate', 'Lunate'], 'Trapezium',
    'The first metacarpal meets the trapezium at the thumb saddle joint.', joints),
  secondMetacarpal: question('How does the second metacarpal usually move during a power grip compared with the fourth and fifth?',
    ['It swings most freely.', 'It moves farther anteriorly.', 'It remains relatively fixed.', 'It crosses the third metacarpal.'], 'It remains relatively fixed.',
    'The second and third metacarpals are firmly anchored; the fourth and fifth have more mobility.', openstax),
  thirdMetacarpal: question('Which distal-row carpal directly receives force passed proximally through the third metacarpal?',
    ['Hamate', 'Trapezium', 'Trapezoid', 'Capitate'], 'Capitate',
    'The third metacarpal passes force to the capitate in the distal carpal row.'),
  fourthMetacarpal: question('During a tight power grip, which metacarpals move anteriorly to improve medial-hand contact?',
    ['Fourth and fifth', 'First and second', 'Second and third', 'First and third'], 'Fourth and fifth',
    'The fourth and especially the fifth metacarpal move anteriorly during gripping.', openstax),
  fifthMetacarpal: question('Among metacarpals two through five, which has the greatest anterior-posterior mobility?',
    ['Second', 'Third', 'Fifth', 'Fourth'], 'Fifth',
    'The fifth metacarpal moves more than the fourth; the second and third are more fixed.', openstax),
  proximalThumb: question('Which bone meets the base of the thumb’s proximal phalanx?',
    ['First metacarpal', 'Trapezium', 'Distal phalanx', 'Second metacarpal'], 'First metacarpal',
    'The first metacarpal head meets the proximal phalanx of the thumb.'),
  proximalFinger: question('Which bone meets the base of a finger’s proximal phalanx?',
    ['Its middle phalanx', 'Its corresponding metacarpal', 'Its distal phalanx', 'A proximal-row carpal'], 'Its corresponding metacarpal',
    'Each proximal finger phalanx meets the head of its corresponding metacarpal.'),
  middleFinger: question('Which phalanx lies immediately proximal to a finger’s middle phalanx?',
    ['Distal phalanx', 'Thumb phalanx', 'Proximal phalanx', 'Metacarpal'], 'Proximal phalanx',
    'In fingers two through five, the middle phalanx follows the proximal phalanx.'),
  distalThumb: question('Which phalanx lies immediately proximal to the thumb’s distal phalanx?',
    ['Middle phalanx', 'Index proximal phalanx', 'First metacarpal', 'Thumb proximal phalanx'], 'Thumb proximal phalanx',
    'The thumb has proximal and distal phalanges without an intervening middle phalanx.', openstax),
  distalFinger: question('Which phalanx lies immediately proximal to a finger’s distal phalanx?',
    ['Middle phalanx', 'Proximal phalanx', 'Thumb distal phalanx', 'Metacarpal'], 'Middle phalanx',
    'In fingers two through five, the middle phalanx lies between proximal and distal phalanges.'),
} as const;
export type HandBoneQuizGroup = keyof typeof handBoneQuizQuestions;
