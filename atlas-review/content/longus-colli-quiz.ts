// Original questions using anatomical facts, not redistributed tables or illustrations.
const reference = 'https://www.stritch.luc.edu/lumen/meded/grossanatomy/homepage/muscletables/head-neckmuscletable.pdf';
type Question = {
  body: string;
  choices: readonly string[];
  correctAnswer: string;
  explanation: string;
  references: readonly string[];
};
export const longusColliQuizQuestions: Record<string, Question> = {
  FMA46284: {
    body: 'Where does the superior oblique part of longus colli normally insert?',
    choices: ['Occipital basilar surface', 'C1 anterior tubercle', 'C2 spinous process', 'C7 transverse process'],
    correctAnswer: 'C1 anterior tubercle',
    explanation: 'It ascends from C3–C5 towards the atlas. The skull-reaching prevertebral muscle is longus capitis.',
    references: [reference],
  },
  FMA46286: {
    body: 'Which upper vertebral bodies receive the vertical part of longus colli?',
    choices: ['T4–T6', 'C5–C7', 'C2–C4', 'T1–T3'],
    correctAnswer: 'C2–C4',
    explanation: 'Its longitudinal fibres link the front of C5–T3 to the upper cervical bodies at C2–C4.',
    references: [reference],
  },
  FMA46288: {
    body: 'Which attachment belongs to the inferior oblique part of longus colli?',
    choices: ['C5–C6 anterior transverse tubercles', 'C1 posterior arch', 'C2–C4 spinous processes', 'Occipital condyle'],
    correctAnswer: 'C5–C6 anterior transverse tubercles',
    explanation: 'This part runs upwards and laterally from the T1–T3 bodies to these lower cervical transverse-process attachments.',
    references: [reference],
  },
};
