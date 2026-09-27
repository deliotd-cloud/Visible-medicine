export const thoracicQuizGroups = {
  rightLung: ['FMA7309'], leftLung: ['FMA7310'], trachea: ['FMA7394'],
  rightMainBronchus: ['FMA7395'], leftMainBronchus: ['FMA7396'],
  rightPulmonaryArtery: ['FMA50872'], leftPulmonaryArtery: ['FMA50873'],
} as const;
export type ThoracicQuizGroup = keyof typeof thoracicQuizGroups;
const viscera = 'https://anatomy.ttuhscep.edu/anatomytables/viscera_thorax.html';
const mediastinum = 'https://anatomy.ttuhscep.edu/cardiovascular_system/sup_med_ans.html';
export const thoracicQuizQuestions = {
  rightLung: {
    body: 'Which right lung lobes border the horizontal fissure?',
    choices: ['Superior and middle', 'Middle and inferior', 'Superior and inferior', 'All three equally'],
    correctAnswer: 'Superior and middle',
    explanation: 'The horizontal fissure divides the superior lobe from the middle lobe.', reference: viscera,
  },
  leftLung: {
    body: 'Which left lung lobe includes the lingula?',
    choices: ['Inferior lobe', 'Superior lobe', 'Middle lobe', 'Accessory lobe'],
    correctAnswer: 'Superior lobe',
    explanation: 'The lingula belongs to the superior lobe of the left lung.', reference: viscera,
  },
  trachea: {
    body: 'Which structure lies directly behind the trachea?',
    choices: ['Sternum', 'Thymus', 'Esophagus', 'Pulmonary trunk'],
    correctAnswer: 'Esophagus',
    explanation: 'The esophagus lies posterior to the trachea.', reference: mediastinum,
  },
  rightMainBronchus: {
    body: 'Typically, how does the right main bronchus compare with the left?',
    choices: ['Narrower and longer', 'More horizontal', 'Equal in all dimensions', 'Wider, shorter, more vertical'],
    correctAnswer: 'Wider, shorter, more vertical',
    explanation: 'These typical differences favor entry of inhaled objects into the right main bronchus.', reference: viscera,
  },
  leftMainBronchus: {
    body: 'Which airway gives rise to the left main bronchus?',
    choices: ['Trachea', 'Lobar bronchus', 'Segmental bronchus', 'Terminal bronchiole'],
    correctAnswer: 'Trachea',
    explanation: 'The trachea divides into right and left main bronchi.', reference: viscera,
  },
  rightPulmonaryArtery: {
    body: 'Typically, where is the right pulmonary artery relative to the main bronchus at the hilum?',
    choices: ['Posterior', 'Anterior', 'Superior', 'Inferior'],
    correctAnswer: 'Anterior',
    explanation: 'At the right hilum, the pulmonary artery lies anterior to the main bronchus.', reference: mediastinum,
  },
  leftPulmonaryArtery: {
    body: 'Typically, where is the left pulmonary artery relative to the main bronchus at the hilum?',
    choices: ['Inferior', 'Posterior', 'Superior', 'Anterior'],
    correctAnswer: 'Superior',
    explanation: 'At the left hilum, the pulmonary artery lies superior to the main bronchus.', reference: mediastinum,
  },
} as const;
