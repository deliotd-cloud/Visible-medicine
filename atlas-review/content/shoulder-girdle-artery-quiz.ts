// Original formative wording about usual anatomy; source meshes do not validate a vascular tree.
const upperLimb = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const costocervical = 'https://www.ncbi.nlm.nih.gov/books/NBK556020/';
const dorsalScapular = 'https://pubmed.ncbi.nlm.nih.gov/26920558/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) =>
  ({body, choices, correctAnswer, explanation, references: [reference]});

export const shoulderGirdleArteryQuizQuestions = {
  thyrocervical: question('The thyrocervical trunk usually arises from which part of the subclavian artery?',
    ['First part', 'Second part', 'Third part', 'Axillary continuation'], 'First part',
    'The thyrocervical trunk is usually a branch of the first part of the subclavian artery.', upperLimb),
  costocervical: question('Which pair names the usual terminal branches of the costocervical trunk?',
    ['Inferior thyroid and suprascapular', 'Deep cervical and superior intercostal', 'Vertebral and internal thoracic', 'Dorsal scapular and transverse cervical'],
    'Deep cervical and superior intercostal',
    'The costocervical trunk usually divides into deep cervical and superior intercostal arteries; variants occur.', costocervical),
  dorsalScapular: question('Which origin pattern is documented for the dorsal scapular artery?',
    ['Radial or ulnar artery', 'Renal or mesenteric artery', 'Subclavian or transverse cervical artery', 'Femoral or popliteal artery'],
    'Subclavian or transverse cervical artery',
    'The dorsal scapular artery has documented variation in its origin, so the mesh must not be read as a universal branching pattern.', dorsalScapular),
  suprascapular: question('The suprascapular artery contributes supply to which pair of rotator-cuff muscles?',
    ['Subscapularis and teres minor', 'Teres major and deltoid', 'Pectoralis major and minor', 'Supraspinatus and infraspinatus'],
    'Supraspinatus and infraspinatus',
    'The suprascapular artery contributes to supraspinatus and infraspinatus supply; this does not imply exclusive supply.', upperLimb),
} as const;
export type ShoulderGirdleArteryQuizGroup = keyof typeof shoulderGirdleArteryQuizQuestions;
