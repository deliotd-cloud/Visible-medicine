// Original formative questions about usual neck anatomy; selected source surfaces remain unvalidated.
const headNeck = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html';
const advanced = 'https://pressbooks.bccampus.ca/advancedanatomy1sted/chapter/muscles/';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const neckMuscleQuizQuestions = {
  scalenusAnterior: question('On which rib does scalenus anterior insert?',
    ['First rib', 'Second rib', 'Third rib', 'Twelfth rib'],
    'First rib', 'Scalenus anterior reaches the scalene tubercle of the first rib.', headNeck),
  scalenusMedius: question('On which rib does scalenus medius insert?',
    ['Second rib', 'First rib', 'Third rib', 'Twelfth rib'],
    'First rib', 'Scalenus medius attaches to the upper surface of the first rib.', headNeck),
  scalenusPosterior: question('On which rib does scalenus posterior insert?',
    ['First rib', 'Third rib', 'Second rib', 'Twelfth rib'],
    'Second rib', 'Scalenus posterior attaches to the second rib.', headNeck),
  sternocleidomastoid: question('Which nerve supplies sternocleidomastoid for movement?',
    ['Facial nerve (VII)', 'Hypoglossal nerve (XII)', 'Ansa cervicalis', 'Spinal accessory nerve (XI)'],
    'Spinal accessory nerve (XI)', 'Sternocleidomastoid receives motor supply from the spinal accessory nerve.', advanced),
  platysma: question('Which nerve branch supplies platysma?',
    ['Cervical branch of facial nerve (VII)', 'Spinal accessory nerve (XI)', 'Ansa cervicalis', 'Hypoglossal nerve (XII)'],
    'Cervical branch of facial nerve (VII)', 'Platysma is supplied by the cervical branch of facial nerve.', advanced),
  omohyoid: question('What connects the two bellies of omohyoid?',
    ['Thyroid cartilage', 'Intermediate tendon', 'Mastoid process', 'First rib'],
    'Intermediate tendon', 'Omohyoid has superior and inferior bellies joined by an intermediate tendon.', advanced),
  sternohyoid: question('Where does sternohyoid insert?',
    ['Thyroid cartilage', 'Mandible', 'Hyoid bone', 'Mastoid process'],
    'Hyoid bone', 'Sternohyoid runs upward to the lower border of the hyoid.', headNeck),
  sternothyroid: question('Where does sternothyroid insert?',
    ['Hyoid bone', 'Mandible', 'First rib', 'Thyroid cartilage'],
    'Thyroid cartilage', 'Sternothyroid reaches the oblique line of thyroid cartilage.', advanced),
  thyrohyoid: question('Where does thyrohyoid insert?',
    ['Hyoid bone', 'Manubrium', 'Scapula', 'Second rib'],
    'Hyoid bone', 'Thyrohyoid links thyroid cartilage to the hyoid bone.', advanced),
} as const;
export type NeckMuscleQuizGroup = keyof typeof neckMuscleQuizQuestions;
