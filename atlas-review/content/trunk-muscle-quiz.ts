// Original formative wording; references support usual anatomy, not source-mesh validation.
const pectoral = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/pectoral_tables.html';
const abdominal = 'https://anatomy.ttuhscep.edu/schemes/abdo_wall_ing_tables.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const trunkMuscleQuizQuestions = {
  rightPectoralisMajor: question('Which arm movement does pectoralis major normally assist?',
    ['Scapular elevation', 'Arm adduction', 'Elbow extension', 'Wrist extension'],
    'Arm adduction', 'Pectoralis major helps bring the arm toward the trunk and also rotates it medially.', pectoral),
  leftPectoralisMajor: question('Pectoralis major normally has a distal attachment on which bone?',
    ['Scapula', 'Clavicle', 'Humerus', 'Ulna'],
    'Humerus', 'Its distal attachment is on the humerus; its broad proximal attachments include the clavicle and sternum.', pectoral),
  rightPectoralisMinor: question('Pectoralis minor normally attaches to which part of the scapula?',
    ['Coracoid process', 'Acromion', 'Spine', 'Glenoid rim'],
    'Coracoid process', 'Pectoralis minor passes from upper ribs to the coracoid process, helping move the scapula forward and down.', pectoral),
  leftPectoralisMinor: question('Which nerve normally supplies pectoralis minor?',
    ['Axillary nerve', 'Long thoracic nerve', 'Thoracodorsal nerve', 'Medial pectoral nerve'],
    'Medial pectoral nerve', 'The medial pectoral nerve supplies pectoralis minor; its branches may pass through that muscle.', pectoral),
  rightExternalOblique: question('Which trunk movement does external oblique normally assist?',
    ['Elbow flexion', 'Lateral bending of the trunk', 'Finger abduction', 'Scapular elevation'],
    'Lateral bending of the trunk', 'External oblique helps bend and flex the trunk; other abdominal muscles contribute too.', abdominal),
  leftExternalOblique: question('The inguinal ligament is a thickened part of which structure?',
    ['Rectus sheath posterior layer', 'Transversalis fascia', 'External oblique aponeurosis', 'Internal oblique tendon'],
    'External oblique aponeurosis', 'The inferior border of the external oblique aponeurosis forms the inguinal ligament.', abdominal),
} as const;
export type TrunkMuscleQuizGroup = keyof typeof trunkMuscleQuizQuestions;
