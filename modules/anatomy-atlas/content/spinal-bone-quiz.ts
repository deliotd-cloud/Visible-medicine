// Original formative wording; factual reference only, no copied tables or images.
const reference = 'https://anatomy.ttuhscep.edu/schemes/back_tables.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});
export const spinalBoneQuizQuestions = {
  cervical: question('Which feature is characteristic of a typical mid-cervical vertebra such as this selection?',
    ['Transverse foramina', 'Costal demifacets', 'Fused sacral foramina', 'Dens'],
    'Transverse foramina', 'Cervical transverse processes contain foramina. This regional feature alone cannot establish an individual vertebral level.'),
  upperThoracic: question('In a typical thoracic vertebra, the transverse-process costal facet articulates with which rib part?',
    ['Head', 'Tubercle', 'Shaft midpoint', 'Anterior end'],
    'Tubercle', 'Distinguish the tubercle articulation on the transverse process from head articulations beside vertebral bodies.'),
  middleThoracic: question('Which opening between adjacent vertebrae transmits a spinal nerve?',
    ['Vertebral canal', 'Transverse foramen', 'Intervertebral foramen', 'Sacral hiatus'],
    'Intervertebral foramen', 'Notches on adjacent pedicles contribute to this opening. Do not confuse it with the central vertebral canal.'),
  lowerThoracic: question('Which paired elements form the vertebral arch?',
    ['Bodies and discs', 'Ribs and cartilages', 'Spinous processes and discs', 'Pedicles and laminae'],
    'Pedicles and laminae', 'The arch and vertebral body surround the vertebral foramen. A single exterior model does not show every canal content.'),
} as const;
export type SpinalBoneQuizGroup = keyof typeof spinalBoneQuizQuestions;
