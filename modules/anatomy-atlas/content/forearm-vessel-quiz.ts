// Original formative questions. References support facts, not image/prose reuse.
const arteries = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const veins = 'https://anatomy.ttuhscep.edu/anatomytables/veins_upperlimb.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const forearmVesselQuizQuestions = {
  radial: question('Which palmar arterial arch is usually predominantly supplied by the radial artery?',
    ['Deep', 'Superficial', 'Both equally in every person', 'Neither'],
    'Deep', 'Radial supply usually predominates in the deep arch; patterns vary.', arteries),
  ulnar: question('Which palmar arterial arch usually receives its main inflow from the ulnar artery?',
    ['Deep', 'Superficial', 'Neither', 'Both equally in every person'],
    'Superficial', 'The superficial arch is usually ulnar-dominant, not exclusively ulnar in every person.', arteries),
  anteriorInterosseous: question('The anterior interosseous artery normally branches from which artery?',
    ['Radial', 'Deep brachial', 'Common interosseous', 'Axillary'],
    'Common interosseous', 'Distinguish this branch from its shared proximal trunk.', arteries),
  commonInterosseous: question('Which artery normally gives rise to the common interosseous trunk?',
    ['Radial', 'Axillary', 'Deep brachial', 'Ulnar'],
    'Ulnar', 'Its branches include the anterior and posterior interosseous arteries.', arteries),
  recurrentInterosseous: question('Which vessel normally gives origin to the recurrent interosseous artery?',
    ['Posterior interosseous', 'Anterior interosseous', 'Radial', 'Axillary'],
    'Posterior interosseous', 'This recurrent branch contributes to the elbow circulation.', arteries),
  cephalic: question('The cephalic vein normally terminates in which vein?',
    ['Basilic', 'Axillary', 'Internal jugular', 'Femoral'],
    'Axillary', 'It provides a superficial drainage route from the lateral upper limb.', veins),
  basilic: question('Which veins normally join the basilic vein to form the axillary vein?',
    ['Internal jugular veins', 'Radial veins alone', 'Brachial veins', 'Femoral veins'],
    'Brachial veins', 'Superficial basilic drainage joins the deep brachial route; venous patterns vary.', veins),
} as const;
export type ForearmVesselQuizGroup = keyof typeof forearmVesselQuizQuestions;
