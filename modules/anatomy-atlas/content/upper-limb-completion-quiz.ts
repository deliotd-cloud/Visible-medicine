// Original, general-anatomy draft questions. Source meshes establish identity, not these relationships.
const forearm = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/forearm_tables.html';
const hand = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html';
const flexorRoof = 'https://www.elsevier.com/resources/anatomy/connective-tissue/fasciae/flexor-retinaculum-of-wrist/16608';
const axilla = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/axilla_ans.html';
const suprascapular = 'https://pubmed.ncbi.nlm.nih.gov/24633009/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, references: string[]) =>
  ({body, choices, correctAnswer, explanation, references});

export const upperLimbCompletionQuizQuestions = {
  interosseous: question('Which two bones are connected by the forearm interosseous membrane?',
    ['Humerus and radius', 'Scapula and clavicle', 'Radius and ulna', 'Ulna and humerus'],
    'Radius and ulna', 'The forearm interosseous membrane connects the interosseous borders of the radius and ulna.', [forearm]),
  retinaculum: question('Which structure forms the roof of the carpal tunnel?',
    ['Flexor retinaculum', 'Extensor retinaculum', 'Palmar aponeurosis', 'Interosseous membrane'],
    'Flexor retinaculum', 'The flexor retinaculum spans the carpal bones to enclose the carpal tunnel.', [hand, flexorRoof]),
  axillary: question('At the lateral border of the first rib, the axillary vein continues as which vein?',
    ['Basilic vein', 'Cephalic vein', 'Brachial vein', 'Subclavian vein'],
    'Subclavian vein', 'The axillary vein becomes the subclavian vein at the lateral border of the first rib.', [axilla]),
  suprascapular: question('How may the suprascapular vein pass relative to the superior transverse scapular ligament?',
    ['Always below it', 'Above or below it', 'Always through bone', 'Always above it'],
    'Above or below it', 'Cadaveric observations show more than one venous course around this ligament; a source surface cannot establish an individual course.', [suprascapular]),
  brachial: question('Which artery is accompanied by the brachial veins in the arm?',
    ['Axillary artery', 'Radial artery', 'Brachial artery', 'Subclavian artery'],
    'Brachial artery', 'Brachial veins are commonly paired and accompany the brachial artery.', [axilla]),
} as const;
export type UpperLimbCompletionQuizGroup = keyof typeof upperLimbCompletionQuizQuestions;
