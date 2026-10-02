/** Original formative questions about the existing whole-bone selections. */
export const thoracicBoneQuizGroups = {
  first: ['FMA7857', 'FMA7987'],
  second: ['FMA7882', 'FMA8012'],
  trueRibs3To7: ['FMA7909', 'FMA8039', 'FMA7957', 'FMA8148', 'FMA8066', 'FMA8093', 'FMA8175', 'FMA8202', 'FMA8229', 'FMA8256'],
  falseRibs8To9: ['FMA8283', 'FMA8310', 'FMA8364', 'FMA8391'],
  tenth: ['FMA8445', 'FMA8472'],
  floating11To12: ['FMA8531', 'FMA8532', 'FMA8533', 'FMA8534'],
  manubrium: ['FMA7486'],
  body: ['FMA7487'],
  xiphoid: ['FMA7488'],
} as const;
export type ThoracicBoneQuizGroup = keyof typeof thoracicBoneQuizGroups;

const ribs = 'https://www.ncbi.nlm.nih.gov/sites/books/NBK538328/';
const sternum = 'https://www.ncbi.nlm.nih.gov/sites/books/NBK541141/';
const marginStudy = 'https://pubmed.ncbi.nlm.nih.gov/37982795/';

export const thoracicBoneQuizQuestions = {
  first: {
    body: 'Which distinguishes the first rib?',
    choices: ['Short, broad; head meets T1 alone', 'No vertebral attachment', 'Cartilage joins rib 7', 'Lowest floating rib'],
    correctAnswer: 'Short, broad; head meets T1 alone',
    explanation: 'Its head meets one vertebral body, T1, rather than two adjacent bodies.',
    reference: ribs,
  },
  second: {
    body: 'Where does the second costal cartilage meet the sternum?',
    choices: ['Xiphisternal junction', 'Manubrium–sternal-body junction', 'Jugular notch', 'First costal cartilage'],
    correctAnswer: 'Manubrium–sternal-body junction',
    explanation: 'It meets the sternal angle. This bone selection excludes cartilage.',
    reference: sternum,
  },
  trueRibs3To7: {
    body: 'How do ribs 3–7 usually reach the sternum?',
    choices: ['Direct bone contact', 'Through rib 7 only', 'Each through its own costal cartilage', 'No anterior connection'],
    correctAnswer: 'Each through its own costal cartilage',
    explanation: 'These are true ribs. Their cartilage, not the selected bone itself, contacts the sternum.',
    reference: ribs,
  },
  falseRibs8To9: {
    body: 'Which statement best describes the usual anterior relationship of ribs 8 and 9?',
    choices: ['Both attach as bone directly to the sternum', 'Both always end freely without cartilage connections', 'They articulate only with the xiphoid', 'They join the costal-cartilage margin indirectly, with variation'],
    correctAnswer: 'They join the costal-cartilage margin indirectly, with variation',
    explanation: 'The traditional indirect-cartilage description has exceptions in cadaver studies; the selected bone does not establish this specimen’s cartilage attachment.',
    reference: marginStudy,
  },
  tenth: {
    body: 'Which description of the tenth rib’s anterior connection allows for known variation?',
    choices: ['It may join the costal margin or have an unattached anterior tip', 'It always joins the ninth rib cartilage', 'It always reaches the manubrium directly', 'It lacks a posterior vertebral articulation'],
    correctAnswer: 'It may join the costal margin or have an unattached anterior tip',
    explanation: 'Cadaver studies document tenth-rib variation, including free anterior tips. The bony surface here cannot establish its cartilage connection.',
    reference: marginStudy,
  },
  floating11To12: {
    body: 'What makes ribs 11–12 “floating”?',
    choices: ['No posterior attachment', 'No anterior sternal or upper-cartilage connection', 'No muscle attachments', 'Entirely cartilage'],
    correctAnswer: 'No anterior sternal or upper-cartilage connection',
    explanation: 'Their vertebral connections remain. Floating describes the anterior ends.',
    reference: ribs,
  },
  manubrium: {
    body: 'Which sternal part bears the jugular notch?',
    choices: ['Sternal body', 'Xiphoid process', 'Manubrium', 'Second costal cartilage'],
    correctAnswer: 'Manubrium',
    explanation: 'This notch lies between the manubrial clavicular notches; landmarks are not separate selections.',
    reference: sternum,
  },
  body: {
    body: 'Which part lies between manubrium and xiphoid?',
    choices: ['Manubrium', 'Xiphoid process', 'First rib', 'Sternal body'],
    correctAnswer: 'Sternal body',
    explanation: 'The body occupies the middle; cartilages 3–7 reach its sides in usual anatomy.',
    reference: sternum,
  },
  xiphoid: {
    body: 'Which statement fits the xiphoid process?',
    choices: ['Inferior sternal part with variable shape and ossification', 'Always ossifies at one age', 'Forms the jugular notch', 'A floating rib'],
    correctAnswer: 'Inferior sternal part with variable shape and ossification',
    explanation: 'Variation precludes inferring age or ossification from this atlas surface.',
    reference: sternum,
  },
} as const;
