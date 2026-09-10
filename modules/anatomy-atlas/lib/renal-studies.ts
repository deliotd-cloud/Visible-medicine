import type { AxialStudy } from './axial-anatomy';

// Reuse licensed, identified source surfaces. These are relationship studies,
// not a synthetic renal cutaway or a reconstruction of an internal lumen.
export const renalStudyReferences = [
  'https://training.seer.cancer.gov/anatomy/urinary/components/kidney.html',
  'https://anatomy.ttuhscep.edu/anatomytables/arteries_abdomen.html',
];
const kidneys = ['FMA7204', 'FMA7205'];
const arteries = ['FMA14752', 'FMA14753'];
const ureters = ['FMA15571', 'FMA15572'];
const greatVessels = ['FMA3789', 'FMA10951'];
const inspect =
  'Rotate the assembled view first; select, isolate or set aside a surface, then Undo to restore it. Explode separates objects for inspection and does not preserve anatomical distances. Kidney cortex, medulla, calyces, renal pelvis and renal veins are not separately represented. These draft surfaces do not establish lumen continuity, vessel attachment or a surgical plane.';

export const renalStudySets: AxialStudy[] = [
  {
    id: 'renal-right-relationships',
    title: 'Right kidney relationships',
    regions: ['abdomen', 'whole-body'],
    targetFmaIds: ['FMA7204'],
    context: [
      { fmaIds: ['FMA14752', 'FMA15571', 'FMA15629', ...greatVessels] },
    ],
    view: 'anterior',
    description:
      'Study the right kidney with its renal artery, ureter and adrenal gland, using the aorta and inferior vena cava as reference surfaces. The normal right renal artery passes behind the inferior vena cava; inspect the source relationship without assuming a validated vessel junction.',
    inspect,
    landmarks: ['right kidney', 'right renal artery', 'right ureter'],
  },
  {
    id: 'renal-left-relationships',
    title: 'Left kidney relationships',
    regions: ['abdomen', 'whole-body'],
    targetFmaIds: ['FMA7205'],
    context: [
      { fmaIds: ['FMA14753', 'FMA15572', 'FMA15630', ...greatVessels] },
    ],
    view: 'anterior',
    description:
      'Study the left kidney with its renal artery, ureter and adrenal gland. Rotate toward the medial kidney margin to compare the supplied surfaces. No renal vein or internal collecting-system mesh is supplied in this study.',
    inspect,
    landmarks: ['left kidney', 'left renal artery', 'left ureter'],
  },
  {
    id: 'renal-arterial-relationships',
    title: 'Renal arteries & great vessels',
    regions: ['abdomen', 'whole-body'],
    targetFmaIds: arteries,
    context: [{ fmaIds: [...kidneys, ...greatVessels] }],
    view: 'anterior',
    description:
      'Compare the renal arteries alongside the kidneys, abdominal aorta and inferior vena cava. Renal arteries normally arise from the abdominal aorta. Displayed surfaces are not a complete arterial branching tree or a simulation of blood flow.',
    inspect,
    landmarks: ['renal artery', 'abdominal aorta', 'inferior vena cava'],
  },
  {
    id: 'renal-ureter-relationships',
    title: 'Kidneys & proximal ureter relationships',
    regions: ['abdomen', 'whole-body'],
    targetFmaIds: ureters,
    context: [{ fmaIds: kidneys }],
    view: 'posterior',
    description:
      'Compare the kidney surfaces and the supplied ureters from behind. Ureters normally carry urine from the renal pelvis toward the bladder. This view omits the bladder and does not reconstruct the pelvis, calyces or a continuous urinary lumen.',
    inspect,
    landmarks: ['kidney', 'ureter'],
  },
];
