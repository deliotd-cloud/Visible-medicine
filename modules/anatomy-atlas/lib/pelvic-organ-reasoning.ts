import type { ReasoningConcept } from './reasoning-questions';

const viscera = { title: 'UAMS: pelvic and perineal viscera', url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/viscera-tables/visceral-structures-of-the-pelvis-and-perineum/' };
const urinary = { title: 'NIDDK: the urinary tract and how it works', url: 'https://www.niddk.nih.gov/health-information/urologic-diseases/urinary-tract-how-it-works' };
const one = (fma: string, file: string) => [{ fma, file, side: 'unpaired' as const }];
const pair = (rightFma: string, rightFile: string, leftFma: string, leftFile: string) => [
  { fma: rightFma, file: rightFile, side: 'right' as const },
  { fma: leftFma, file: leftFile, side: 'left' as const },
];
type Draft = Omit<ReasoningConcept, 'sourceTissue' | 'readiness' | 'revision'>;

// Original prompts for existing male-reference surfaces. No female specimen,
// internal lumen, microscopic detail or patient registration is implied.
export const pelvicOrganReasoningConcepts: readonly ReasoningConcept[] = ([
  {
    key: 'pelvic-bladder', region: 'pelvis', sourceTree: 'partof', bindings: one('FMA15900', 'FJ3149'),
    prompt: 'Which hollow pelvic organ stores urine before it leaves through the urethra?',
    explanation: 'The urinary bladder is the reservoir; the urethra is its exit route. This reference surface does not measure capacity or emptying function.',
    distractors: ['pelvic-prostate', 'pelvic-rectum', 'pelvic-urethra'], references: [urinary],
  },
  {
    key: 'pelvic-prostate', region: 'pelvis', sourceTree: 'partof', bindings: one('FMA9600', 'FJ3139'),
    prompt: 'In male anatomy, which gland sits below the bladder around part of the urethra?',
    explanation: 'The prostate surrounds the prostatic urethra. Its supplied outer surface does not show glandular zones or establish enlargement.',
    distractors: ['pelvic-bladder', 'pelvic-rectum', 'pelvic-urethra'], references: [viscera],
  },
  {
    key: 'pelvic-rectum', region: 'pelvis', bindings: one('FMA14544', 'FJ2571'),
    prompt: 'Which supplied bowel segment continues inferiorly into the anal canal?',
    explanation: 'The rectum leads into the anal canal, not a urinary passage. This reference surface does not demonstrate mucosa or sphincter function.',
    distractors: ['pelvic-bladder', 'pelvic-prostate', 'pelvic-urethra'], references: [viscera],
  },
  {
    key: 'pelvic-urethra', region: 'pelvis', bindings: one('FMA19667', 'FJ3148'),
    prompt: 'Which passage carries urine from the bladder towards the outside of the body?',
    explanation: 'The urethra drains the bladder; ureters deliver urine into the bladder. This is a male reference surface, not a female urethral model or proof of luminal patency.',
    distractors: ['pelvic-bladder', 'pelvic-prostate', 'pelvic-rectum'], references: [urinary],
  },
  {
    key: 'pelvic-testis', region: 'pelvis', bindings: pair('FMA7211', 'FJ3142', 'FMA7212', 'FJ3138'),
    prompt: 'Which male gonad produces sperm, rather than transporting urine or adding seminal fluid?',
    explanation: 'Sperm originate in the testis and subsequently enter the epididymis. The supplied outer mesh does not depict microscopic sperm production.',
    distractors: ['pelvic-epididymis', 'pelvic-seminal-vesicle', 'pelvic-ureter'], references: [viscera],
  },
  {
    key: 'pelvic-epididymis', region: 'pelvis', bindings: pair('FMA18256', 'FJ3141', 'FMA18257', 'FJ3136'),
    prompt: 'Which structure beside the testis continues at its tail into the ductus deferens?',
    explanation: 'The epididymis links testicular drainage to the ductus deferens. The reference mesh does not demonstrate an open, continuous duct lumen.',
    distractors: ['pelvic-testis', 'pelvic-seminal-vesicle', 'pelvic-ureter'], references: [viscera],
  },
  {
    key: 'pelvic-seminal-vesicle', region: 'pelvis', bindings: pair('FMA19387', 'FJ3143', 'FMA19388', 'FJ3137'),
    prompt: 'Which paired structure behind the bladder contributes seminal fluid?',
    explanation: 'The seminal vesicle supplies a secretion to semen; it is not the sperm-producing gonad. This male-reference surface does not demonstrate its duct opening.',
    distractors: ['pelvic-testis', 'pelvic-epididymis', 'pelvic-ureter'], references: [viscera],
  },
  {
    key: 'pelvic-ureter', region: 'abdomen', sourceRegions: ['abdomen', 'pelvis'], sourceTree: 'partof',
    bindings: pair('FMA15571', 'FJ3146', 'FMA15572', 'FJ3144'),
    prompt: 'Which paired tube carries urine from a kidney to the bladder, rather than from the bladder outside?',
    explanation: 'Each ureter carries urine towards the bladder; the urethra is the outgoing passage. The reference surface does not establish drainage or obstruction in a patient.',
    distractors: ['pelvic-testis', 'pelvic-epididymis', 'pelvic-seminal-vesicle'], references: [urinary],
  },
] satisfies Draft[]).map(concept => ({ ...concept, sourceTissue: 'organ', readiness: 'draft', revision: 1 }));
