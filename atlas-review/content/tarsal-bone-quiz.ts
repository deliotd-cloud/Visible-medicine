/** Original questions; references support facts, not reproduction of prose or images. */
export const tarsalBoneQuizGroups = {
  talus: ['FMA24482', 'FMA24483'],
  calcaneus: ['FMA24497', 'FMA24498'],
  navicular: ['FMA24500', 'FMA24501'],
  cuboid: ['FMA24528', 'FMA24529'],
  'medial-cuneiform': ['FMA24521', 'FMA24522'],
  'intermediate-cuneiform': ['FMA24523', 'FMA24524'],
  'lateral-cuneiform': ['FMA24525', 'FMA24526'],
} as const;
export type TarsalBoneQuizGroup = keyof typeof tarsalBoneQuizGroups;

export const tarsalBoneQuizQuestions = {
  talus: {
    body: 'Which tarsal receives weight from the tibia at the ankle before load passes toward the heel?',
    choices: ['Cuboid', 'Talus', 'Navicular', 'Medial cuneiform'],
    correctAnswer: 'Talus',
    explanation: 'The talus meets the tibia at the ankle and articulates below with the calcaneus. This source bone does not measure patient loading or joint motion.',
    reference: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb',
  },
  calcaneus: {
    body: 'Which heel bone receives the Achilles tendon at its posterior tuberosity?',
    choices: ['Talus', 'Navicular', 'Calcaneus', 'Cuboid'],
    correctAnswer: 'Calcaneus',
    explanation: 'The calcaneal tuberosity is the Achilles tendon attachment region. The tuberosity and tendon are not separately reviewed selections in this quiz.',
    reference: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html',
  },
  navicular: {
    body: 'Which tarsal connects the talar head to the three cuneiforms?',
    choices: ['Navicular', 'Cuboid', 'Calcaneus', 'Lateral cuneiform'],
    correctAnswer: 'Navicular',
    explanation: 'The navicular lies anterior to the talus and behind the cuneiform trio. This is an assembled-foot relationship, not a patient alignment measurement.',
    reference: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb',
  },
  cuboid: {
    body: 'Which tarsal links the calcaneus to the fourth and fifth metatarsal bases?',
    choices: ['Intermediate cuneiform', 'Navicular', 'Cuboid', 'Talus'],
    correctAnswer: 'Cuboid',
    explanation: 'The cuboid occupies the lateral midfoot between those bones. A selected source bone cannot establish a patient column length or injury.',
    reference: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html',
  },
  'medial-cuneiform': {
    body: 'A Lisfranc ligament can link the second metatarsal base to which tarsal?',
    choices: ['Medial cuneiform', 'Cuboid', 'Talus', 'Calcaneus'],
    correctAnswer: 'Medial cuneiform',
    explanation: 'This ligament spans the medial cuneiform and second metatarsal base. Neither the ligament nor its integrity is represented by the selected bone; a fracture-free image does not rule out ligament injury.',
    reference: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/midfoot/lisfranc-injury/treatment-of-lisfranc-injuries',
    additionalReference: 'https://www.orthoinfo.org/diseases--conditions/lisfranc-midfoot-injury/',
  },
  'intermediate-cuneiform': {
    body: 'The recessed base of the second metatarsal meets which cuneiform directly?',
    choices: ['Lateral cuneiform', 'Intermediate cuneiform', 'Medial cuneiform', 'Cuboid'],
    correctAnswer: 'Intermediate cuneiform',
    explanation: 'The second metatarsal articulates with the intermediate (middle) cuneiform. The model does not validate joint alignment or instability in a patient.',
    reference: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/midfoot/lisfranc-injury/treatment-of-lisfranc-injuries',
  },
  'lateral-cuneiform': {
    body: 'Which cuneiform lies between the intermediate cuneiform and cuboid?',
    choices: ['Medial cuneiform', 'Lateral cuneiform', 'Navicular', 'Talus'],
    correctAnswer: 'Lateral cuneiform',
    explanation: 'The lateral cuneiform occupies this part of the distal tarsal row. The relation describes anatomy, not a registered patient position.',
    reference: 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html',
  },
} as const;
