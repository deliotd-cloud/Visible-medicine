// Original formative wording about usual anatomy, not source-surface validation.
const upper = 'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html';
const lower = 'https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const majorLimbBoneQuizQuestions = {
  hipBone: question('Which hip-bone socket receives the femoral head?',
    ['Obturator foramen', 'Acetabulum', 'Iliac fossa', 'Greater sciatic notch'],
    'Acetabulum', 'The acetabulum forms the socket of the hip joint.', lower),
  femur: question('The head of the femur meets which pelvic socket?',
    ['Glenoid cavity', 'Obturator foramen', 'Acetabulum', 'Iliac fossa'],
    'Acetabulum', 'The proximal femoral head articulates with the acetabulum.', lower),
  fibula: question('Which ankle prominence belongs to the distal fibula?',
    ['Medial malleolus', 'Tibial tuberosity', 'Medial condyle', 'Lateral malleolus'],
    'Lateral malleolus', 'The distal fibula forms the lateral malleolus.', lower),
  patella: question('The patella lies within the tendon of which muscle group?',
    ['Quadriceps femoris', 'Hamstrings', 'Gastrocnemius', 'Adductors'],
    'Quadriceps femoris', 'The kneecap is a sesamoid bone in the quadriceps tendon.', lower),
  tibia: question('Which distal tibial landmark forms the inner ankle prominence?',
    ['Lateral malleolus', 'Fibular head', 'Medial malleolus', 'Tibial tuberosity'],
    'Medial malleolus', 'The medial malleolus projects from the distal tibia.', lower),
  clavicle: question('Which scapular process meets the lateral end of the clavicle?',
    ['Coracoid', 'Acromion', 'Glenoid cavity', 'Spine'],
    'Acromion', 'The acromion forms the acromioclavicular articulation.', upper),
  humerus: question('The humeral capitulum articulates with which forearm structure?',
    ['Olecranon', 'Ulnar head', 'Radial head', 'Radial styloid'],
    'Radial head', 'The capitulum meets the head of the radius at the elbow.', upper),
  radius: question('In anatomical position, which forearm side contains the radius?',
    ['Medial', 'Posterior', 'Anterior only', 'Lateral'],
    'Lateral', 'The radius is on the thumb side in anatomical position.', upper),
  scapula: question('Which scapular surface receives the humeral head?',
    ['Glenoid cavity', 'Infraspinous fossa', 'Acromion', 'Coracoid'],
    'Glenoid cavity', 'This lateral socket articulates with the humerus.', upper),
  ulna: question('Which proximal ulnar projection enters the humeral fossa during elbow extension?',
    ['Coronoid process', 'Radial notch', 'Styloid process', 'Olecranon'],
    'Olecranon', 'The olecranon engages the posterior humeral fossa.', upper),
} as const;
export type MajorLimbBoneQuizGroup = keyof typeof majorLimbBoneQuizQuestions;
