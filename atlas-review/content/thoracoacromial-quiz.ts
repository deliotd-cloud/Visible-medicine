// Original formative wording about usual anatomy; source surfaces do not validate a vascular tree.
const table = 'https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const pectoral = 'https://pubmed.ncbi.nlm.nih.gov/1746231/';
const acromial = 'https://www.elsevier.com/resources/anatomy/cardiovascular-system/arteries/acromial-branch-of-thoracoacromial-artery/23364';
const deltoid = 'https://pubmed.ncbi.nlm.nih.gov/9706673/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) =>
  ({body, choices, correctAnswer, explanation, references: [reference]});

export const thoracoacromialQuizQuestions = {
  trunk: question('Which part of the axillary artery usually gives rise to the thoraco-acromial trunk?',
    ['Second part', 'First part', 'Third part', 'Brachial continuation'], 'Second part',
    'The thoraco-acromial trunk usually branches from the second part of the axillary artery.', table),
  pectoral: question('The pectoral branch contributes blood supply to which muscle?',
    ['Serratus anterior', 'Pectoralis major', 'Biceps brachii', 'Supraspinatus'], 'Pectoralis major',
    'The pectoral branch contributes to pectoralis major supply; it is not the muscle’s sole supply.', pectoral),
  acromial: question('Near the coracoid, where does the acromial branch typically course relative to deltoid?',
    ['Superficial to deltoid', 'Behind the scapular spine', 'Deep to deltoid', 'Within the supraspinous fossa'], 'Deep to deltoid',
    'The acromial branch courses near the coracoid deep to deltoid toward the acromial region.', acromial),
  deltoid: question('Which region is a typical territory of the deltoid branch?',
    ['Posterior deltoid', 'Middle deltoid', 'Subscapularis', 'Anterior deltoid'], 'Anterior deltoid',
    'The deltoid branch is described with the anterior deltoid; this does not imply exclusive supply.', deltoid),
} as const;
export type ThoracoacromialQuizGroup = keyof typeof thoracoacromialQuizQuestions;
