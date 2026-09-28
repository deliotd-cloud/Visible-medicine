export const abdominalOrganQuizGroups = {
  pancreas: ['FMA7198'], kidney: ['FMA7204', 'FMA7205'],
  spleen: ['FMA7196'], adrenal: ['FMA15629', 'FMA15630'],
} as const;
export type AbdominalOrganQuizGroup = keyof typeof abdominalOrganQuizGroups;
export const abdominalOrganQuizQuestions = {
  pancreas: {
    body: 'Which pairing describes pancreatic exocrine and endocrine functions?',
    choices: ['Digestive enzymes into ducts; hormones into blood', 'Hormones into ducts; digestive enzymes into blood', 'Urine formation; blood-cell removal', 'Bile storage; lymph filtration'],
    correctAnswer: 'Digestive enzymes into ducts; hormones into blood',
    explanation: 'Exocrine secretion supplies digestive enzymes to the duodenum through ducts. Pancreatic islets provide endocrine hormones, including insulin and glucagon.',
    reference: 'https://training.seer.cancer.gov/anatomy/endocrine/glands/pancreas.html',
  },
  kidney: {
    body: 'Which process explains how a kidney forms urine?',
    choices: ['The ureter filters blood', 'Glomerular filtration followed by tubular processing', 'The bladder secretes pancreatic enzymes', 'Blood becomes urine without reabsorption'],
    correctAnswer: 'Glomerular filtration followed by tubular processing',
    explanation: 'Nephrons filter blood at glomeruli. Tubules return needed water and solutes to blood and remove additional wastes; remaining fluid becomes urine. This principle applies to either kidney.',
    reference: 'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work',
  },
  spleen: {
    body: 'Which fluid does the spleen filter, unlike lymph nodes?',
    choices: ['Urine', 'Bile', 'Blood', 'Lymph'],
    correctAnswer: 'Blood',
    explanation: 'The spleen filters circulating blood and helps remove aged or damaged red blood cells. Lymph nodes filter lymph.',
    reference: 'https://training.seer.cancer.gov/anatomy/lymphatic/components/spleen.html',
  },
  adrenal: {
    body: 'Which pairing correctly distinguishes adrenal cortex and medulla?',
    choices: ['Cortex: digestive enzymes; medulla: insulin', 'Cortex: urine formation; medulla: bile storage', 'Cortex: epinephrine; medulla: aldosterone', 'Cortex: steroid hormones; medulla: epinephrine and norepinephrine'],
    correctAnswer: 'Cortex: steroid hormones; medulla: epinephrine and norepinephrine',
    explanation: 'The cortex produces steroid hormones, including cortisol and aldosterone. The medulla produces epinephrine and norepinephrine. The same distinction applies on both sides.',
    reference: 'https://training.seer.cancer.gov/anatomy/endocrine/glands/adrenal.html',
  },
} as const;
