// Original formative wording describes usual anatomy, not donor-specific flow.
const reference = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const handArterialQuizQuestions = {
  superficialArch: question('Which artery predominantly forms the superficial palmar arch?',
    ['Ulnar artery', 'Radial artery', 'Brachial artery', 'Axillary artery'], 'Ulnar artery', 'Usually ulnar.'),
  deepArch: question('Which artery predominantly forms the deep palmar arch?',
    ['Ulnar artery', 'Radial artery', 'Brachial artery', 'Axillary artery'], 'Radial artery', 'Usually radial.'),
  metacarpal: question('Palmar metacarpal arteries normally arise from which arch?',
    ['Superficial palmar arch', 'Dorsal carpal arch', 'Deep palmar arch', 'Plantar arch'], 'Deep palmar arch', 'They arise from the deep arch.'),
  princeps: question('Princeps pollicis is associated with which digit?',
    ['Index finger', 'Middle finger', 'Little finger', 'Thumb'], 'Thumb', 'It supplies the thumb.'),
  radialis: question('Radialis indicis normally supplies which side?',
    ['Radial index', 'Ulnar index', 'Radial thumb', 'Ulnar middle'], 'Radial index', 'The radial side of the index finger.'),
  commonDigital: question('Common palmar digital arteries usually give rise to which arteries?',
    ['Palmar metacarpal', 'Proper palmar digital', 'Dorsal metacarpal', 'Interosseous'], 'Proper palmar digital', 'They branch into proper digital arteries.'),
  properDigital: question('Which surface do proper palmar digital arteries chiefly supply?',
    ['Dorsal digits', 'Sole', 'Palmar digits', 'Forearm'], 'Palmar digits', 'They supply palmar digit surfaces.'),
} as const;
export type HandArterialQuizGroup = keyof typeof handArterialQuizQuestions;
