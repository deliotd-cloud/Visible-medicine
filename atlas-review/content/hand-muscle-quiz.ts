// Original formative wording about usual actions, not observed movement of source surfaces.
const reference = 'https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const handMuscleQuizQuestions = {
  abductorDigitiMinimi: question(
    'What does hand abductor digiti minimi do?',
    ['Flex the thumb', 'Abduct digit five', 'Adduct digit five', 'Extend the wrist'],
    'Abduct digit five', 'It abducts the fifth digit.'),
  flexorDigitiMinimiBrevis: question(
    'Which joint does this intrinsic flexor bend?',
    ['Thumb IP', 'Wrist', 'Fifth-digit MCP', 'Second-digit DIP'],
    'Fifth-digit MCP', 'It flexes the fifth MCP joint.'),
  opponensDigitiMinimi: question(
    'Which action does opponens digiti minimi assist?',
    ['Thumb abduction', 'Wrist extension', 'Finger adduction', 'Little-finger opposition'],
    'Little-finger opposition', 'It rotates the fifth metacarpal.'),
  abductorPollicisBrevis: question(
    'What action belongs to abductor pollicis brevis?',
    ['Thumb abduction', 'Thumb adduction', 'Little-finger flexion', 'Wrist extension'],
    'Thumb abduction', 'It abducts the thumb.'),
  opponensPollicis: question(
    'Which action does opponens pollicis assist?',
    ['Extension', 'Opposition', 'Adduction', 'IP flexion'],
    'Opposition', 'It rotates the first metacarpal.'),
  adductorPollicis: question(
    'What shared action has either adductor head?',
    ['Thumb abduction', 'Thumb opposition', 'Thumb extension', 'Thumb adduction'],
    'Thumb adduction', 'Both heads adduct the thumb.'),
  lumbricalGroup: question(
    'What coordinated action characterises hand lumbricals?',
    ['Extend MCP, flex IP', 'Flex MCP, extend IP', 'Abduct digits', 'Flex wrist'],
    'Flex MCP, extend IP', 'For digits two to five, they flex MCP and extend IP joints.'),
  palmarInterosseousGroup: question(
    'Palmar interossei move fingers towards which axis?',
    ['Thumb', 'Index finger', 'Third digit', 'Little finger'],
    'Third digit', 'They adduct towards digit three.'),
  dorsalInterosseousGroup: question(
    'Dorsal interossei move fingers in which direction?',
    ['Towards the thumb', 'Towards digit three', 'Towards the wrist', 'Away from digit three'],
    'Away from digit three', 'They abduct away from digit three.'),
} as const;
export type HandMuscleQuizGroup = keyof typeof handMuscleQuizQuestions;
