/** Original questions; references support facts, not reproduction of prose or images. */
export const carpalBoneQuizGroups = {
  scaphoid: ['FMA24436', 'FMA24435'],
  lunate: ['FMA24438', 'FMA24437'],
  triquetral: ['FMA24440', 'FMA24439'],
  pisiform: ['FMA24442', 'FMA24441'],
  trapezium: ['FMA24444', 'FMA24443'],
  trapezoid: ['FMA24445', 'FMA23725'],
  capitate: ['FMA24447', 'FMA24446'],
  hamate: ['FMA24449', 'FMA24448'],
} as const;
export type CarpalBoneQuizGroup = keyof typeof carpalBoneQuizGroups;
export const carpalBoneQuizQuestions = {
  scaphoid: {
    body: 'Can an initially normal wrist X-ray rule out a suspected scaphoid fracture?',
    choices: ['Yes, if the scaphoid outline looks complete', 'No; an early X-ray can miss a scaphoid fracture', 'Yes, if the atlas scaphoid is intact', 'No, but only when the ulna is fractured'],
    correctAnswer: 'No; an early X-ray can miss a scaphoid fracture',
    explanation: 'A scaphoid fracture may be invisible on the first radiograph. Assessment and any further imaging depend on the patient examination; this reference bone cannot clear an injury.',
    reference: 'https://www.orthoinfo.org/diseases--conditions/scaphoid-fracture-of-the-wrist/',
  },
  lunate: {
    body: 'In an anatomical wrist, which sequence runs from forearm toward the central distal carpal row?',
    choices: ['Ulna, lunate, hamate', 'Radius, pisiform, capitate', 'Radius, lunate, capitate', 'Radius, triquetrum, trapezium'],
    correctAnswer: 'Radius, lunate, capitate',
    explanation: 'The lunate meets the distal radius and lies proximal to the capitate. This is a general anatomical relationship, not a registered alignment measurement in a patient.',
    reference: 'https://essr.org/content-essr/uploads/2016/10/wrist.pdf',
  },
  triquetral: {
    body: 'Which pair shares the proximal carpal row with triquetrum and pisiform?',
    choices: ['Trapezium and trapezoid', 'Capitate and hamate', 'Trapezoid and capitate', 'Scaphoid and lunate'],
    correctAnswer: 'Scaphoid and lunate',
    explanation: 'Włodarczyk et al. (2015) place these four bones in the proximal row. This is an assembled anatomical grouping, not a patient comparison.',
    reference: 'https://link.springer.com/article/10.1007/s11548-014-1105-x',
  },
  pisiform: {
    body: 'At the ulnar side of the palmar wrist, which bone marks the proximal carpal tunnel level?',
    choices: ['Pisiform', 'Hamate hook', 'Trapezium', 'Capitate'],
    correctAnswer: 'Pisiform',
    explanation: 'The pisiform is the proximal ulnar bony landmark; the hamate hook marks the distal ulnar level. These are anatomical landmarks, not separately segmented tunnel structures here.',
    reference: 'https://essr.org/content-essr/uploads/2016/10/wrist.pdf',
  },
  trapezium: {
    body: 'Which carpal bone forms the saddle joint at the base of the thumb with the first metacarpal?',
    choices: ['Trapezoid', 'Trapezium', 'Scaphoid', 'Lunate'],
    correctAnswer: 'Trapezium',
    explanation: 'Rusli and Kedgley (2020) describe the trapezium–first metacarpal saddle joint. Its surfaces and supporting ligaments are not separate reviewed selections here.',
    reference: 'https://link.springer.com/article/10.1007/s10237-019-01257-8',
  },
  trapezoid: {
    body: 'Which distal-row carpal lies between trapezium and capitate in the usual anatomical sequence?',
    choices: ['Scaphoid', 'Lunate', 'Trapezoid', 'Pisiform'],
    correctAnswer: 'Trapezoid',
    explanation: 'Włodarczyk et al. (2015) list the distal row in this order. The sequence refers to an anatomical hand, not screen position.',
    reference: 'https://link.springer.com/article/10.1007/s11548-014-1105-x',
  },
  capitate: {
    body: 'Which bone completes this distal-row sequence: trapezium, trapezoid, ___, hamate?',
    choices: ['Lunate', 'Scaphoid', 'Triquetrum', 'Capitate'],
    correctAnswer: 'Capitate',
    explanation: 'Włodarczyk et al. (2015) place capitate in this distal-row sequence. The source does not establish patient alignment or disease.',
    reference: 'https://link.springer.com/article/10.1007/s11548-014-1105-x',
  },
  hamate: {
    body: 'Which structure is the distal ulnar bony landmark of the palmar carpal tunnel?',
    choices: ['Hamate hook', 'Pisiform', 'Scaphoid tubercle', 'Lunate'],
    correctAnswer: 'Hamate hook',
    explanation: 'The hamate hook marks the distal ulnar level, while the pisiform marks the proximal ulnar level. The hook is not an independently segmented selection in this source.',
    reference: 'https://essr.org/content-essr/uploads/2016/10/wrist.pdf',
  },
} as const;
