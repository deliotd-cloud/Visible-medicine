// Original formative wording about usual anatomy, not validation of source meshes.
const kidney = 'https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_tables.html';
const back = 'https://anatomy.ttuhscep.edu/schemes/back_tables.html';
const question = (body: string, choices: string[], correctAnswer: string, explanation: string, reference: string) => ({
  body, choices, correctAnswer, explanation, references: [reference],
});

export const spinalMuscleQuizQuestions = {
  rightPsoasMajor: question('Where does psoas major attach proximally?',
    ['Lumbar vertebral bodies and transverse processes', 'Iliac fossa only', 'Sacral spinous processes', 'Lower ribs only'],
    'Lumbar vertebral bodies and transverse processes', 'Its vertebral attachments are in the lumbar region.', kidney),
  leftPsoasMajor: question('Which nerve normally pierces the anterior surface of psoas major?',
    ['Femoral nerve', 'Genitofemoral nerve', 'Obturator nerve', 'Subcostal nerve'],
    'Genitofemoral nerve', 'The genitofemoral nerve emerges through the muscle anteriorly.', kidney),
  rightSerratusPosteriorInferior: question('Which ribs receive serratus posterior inferior?',
    ['Ribs 1–4', 'Ribs 5–8', 'Ribs 9–12', 'No ribs'],
    'Ribs 9–12', 'Its slips reach the four lowest ribs near their angles.', back),
  leftSerratusPosteriorInferior: question('Which spinal nerve levels supply serratus posterior inferior through ventral rami?',
    ['C5–C8', 'T1–T4', 'L1–L4', 'T9–T12'],
    'T9–T12', 'Branches of lower thoracic ventral rami supply this muscle.', back),
  rightSerratusPosteriorSuperior: question('Which midline structures give rise to serratus posterior superior?',
    ['Nuchal ligament and lower cervical/upper thoracic spines', 'Lumbar transverse processes', 'Sacrum and coccyx', 'Iliac crest'],
    'Nuchal ligament and lower cervical/upper thoracic spines', 'Its proximal attachments span the lower neck and upper thoracic midline.', back),
  leftSerratusPosteriorSuperior: question('Serratus posterior superior receives branches from which part of spinal nerves?',
    ['Ventral primary rami', 'Dorsal primary rami', 'Spinal ganglia', 'Anterior roots alone'],
    'Ventral primary rami', 'Its motor supply comes through ventral ramus branches, unlike intrinsic deep back muscles.', back),
} as const;
export type SpinalMuscleQuizGroup = keyof typeof spinalMuscleQuizQuestions;
