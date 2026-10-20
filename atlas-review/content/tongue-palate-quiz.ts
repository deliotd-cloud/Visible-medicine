// Original questions, not copied assessments or licensed table/figure assets.
export const tonguePalateQuizGroups = {
  genioglossus: ['FMA46702', 'FMA46698'],
  hyoglossus: ['FMA46704', 'FMA46703'],
  levator: ['FMA46729', 'FMA46728'],
  tensor: ['FMA46732', 'FMA46731'],
} as const;
export type TonguePalateQuizGroup = keyof typeof tonguePalateQuizGroups;
const reference = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html';
export const tonguePalateQuizQuestions = {
  genioglossus: {
    body: 'Which movement does bilateral genioglossus contraction support?',
    choices: ['Tongue protrusion', 'Jaw closure', 'Soft-palate elevation', 'Vocal-fold adduction'],
    correctAnswer: 'Tongue protrusion',
    explanation: 'Genioglossus helps advance the tongue.',
    reference,
  },
  hyoglossus: {
    body: 'Which nerve supplies hyoglossus?',
    choices: ['Facial (VII)', 'Hypoglossal (XII)', 'Vagus (X)', 'Accessory (XI)'],
    correctAnswer: 'Hypoglossal (XII)',
    explanation: 'Hyoglossus receives motor supply from XII.',
    reference,
  },
  levator: {
    body: 'What does levator veli palatini elevate?',
    choices: ['Tongue', 'Mandible', 'Soft palate', 'Vocal folds'],
    correctAnswer: 'Soft palate',
    explanation: 'Levator veli palatini raises the soft palate.',
    reference,
  },
  tensor: {
    body: 'Which motor supply reaches tensor veli palatini?',
    choices: ['Maxillary (V2)', 'Ophthalmic (V1)', 'Vagus (X)', 'Mandibular (V3)'],
    correctAnswer: 'Mandibular (V3)',
    explanation: 'Tensor veli palatini receives motor supply through V3.',
    reference,
  },
} as const;
