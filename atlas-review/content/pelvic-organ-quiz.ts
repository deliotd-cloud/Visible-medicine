export const pelvicOrganQuizGroups = {
  bladder: ['FMA15900'], prostate: ['FMA9600'],
  ureter: ['FMA15571', 'FMA15572'],
  epididymis: ['FMA18256', 'FMA18257'],
  seminalVesicle: ['FMA19387', 'FMA19388'],
} as const;
export type PelvicOrganQuizGroup = keyof typeof pelvicOrganQuizGroups;
export const pelvicOrganQuizQuestions = {
  bladder: {
    body: 'Which coordination permits bladder emptying?',
    choices: ['Bladder contracts; sphincters relax', 'Bladder relaxes; sphincters contract', 'Both remain contracted', 'Both remain relaxed throughout filling'],
    correctAnswer: 'Bladder contracts; sphincters relax',
    explanation: 'Urination coordinates bladder contraction with sphincter relaxation.',
    reference: 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works',
  },
  prostate: {
    body: 'What can prostate size alone tell us about BPH symptom severity?',
    choices: ['A larger prostate always means worse symptoms', 'Size alone does not reliably indicate severity', 'A small prostate excludes symptoms', 'Size measures bladder capacity'],
    correctAnswer: 'Size alone does not reliably indicate severity',
    explanation: 'With benign prostatic hyperplasia, symptom severity does not reliably follow prostate size.',
    reference: 'https://www.niddk.nih.gov/health-information/urologic-diseases/prostate-problems/enlarged-prostate-benign-prostatic-hyperplasia',
  },
  ureter: {
    body: 'Which route carries urine from a kidney toward its exit?',
    choices: ['Kidney → bladder → ureter → urethra', 'Kidney → urethra → bladder → ureter', 'Kidney → ureter → bladder → urethra', 'Bladder → kidney → urethra → ureter'],
    correctAnswer: 'Kidney → ureter → bladder → urethra',
    explanation: 'Either ureter carries urine from its kidney to the bladder; urine exits through the urethra.',
    reference: 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works',
  },
  epididymis: {
    body: 'Which sperm function belongs to the epididymis?',
    choices: ['Production', 'Urine filtration', 'Fructose secretion', 'Maturation and storage'],
    correctAnswer: 'Maturation and storage',
    explanation: 'Sperm mature and are stored in either epididymis; sperm production occurs in the testes.',
    reference: 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html',
  },
  seminalVesicle: {
    body: 'Which energy substrate occurs in seminal-vesicle secretion?',
    choices: ['Fructose', 'Urea', 'Bile salts', 'Haemoglobin'],
    correctAnswer: 'Fructose',
    explanation: 'Either seminal vesicle supplies fructose in its secretion as an energy substrate for sperm.',
    reference: 'https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html',
  },
} as const;
