// Original formative wording about usual anatomy, not validation of source surfaces.
const tables = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_tables.html';
const answers = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const shoulderArmArteryQuizQuestions = {
  axillary: question('Which muscle separates the axillary artery into three described parts?',
    ['Pectoralis minor', 'Teres major', 'Subscapularis', 'Coracobrachialis'],
    'Pectoralis minor', 'Its position defines the usual three-part description of the axillary artery.', tables),
  brachial: question('Which arteries usually arise as terminal branches of the brachial artery?',
    ['Deep brachial and thoracodorsal', 'Radial and ulnar', 'Axillary and radial', 'Circumflex scapular and ulnar'],
    'Radial and ulnar', 'The brachial artery usually divides near the elbow; high division can occur.', tables),
  deepBrachial: question('Which nerve accompanies deep brachial vessels near the humeral radial groove?',
    ['Axillary nerve', 'Median nerve', 'Radial nerve', 'Ulnar nerve'],
    'Radial nerve', 'Both are described along the posterior humeral shaft.', tables),
  anteriorCircumflexHumeral: question('Which axillary artery part usually gives rise to the anterior circumflex humeral artery?',
    ['First part', 'Second part', 'Brachial continuation', 'Third part'],
    'Third part', 'It usually courses anteriorly around the proximal humerus.', answers),
  posteriorCircumflexHumeral: question('Which nerve accompanies the posterior circumflex humeral artery through the quadrangular space?',
    ['Axillary nerve', 'Radial nerve', 'Median nerve', 'Thoracodorsal nerve'],
    'Axillary nerve', 'The usual pairing passes through the quadrangular space.', answers),
  circumflexScapular: question('Which space transmits the circumflex scapular artery?',
    ['Quadrangular space', 'Triangular space', 'Cubital fossa', 'Intertubercular groove'],
    'Triangular space', 'This branch reaches the posterior scapular region through that space.', answers),
  thoracodorsal: question('Which muscle is a principal territory of the thoracodorsal artery?',
    ['Deltoid', 'Supraspinatus', 'Latissimus dorsi', 'Brachialis'],
    'Latissimus dorsi', 'The thoracodorsal branch is described as its principal arterial supply.', answers),
} as const;
export type ShoulderArmArteryQuizGroup = keyof typeof shoulderArmArteryQuizQuestions;
