import type { SpecimenLesson } from './um-limb-teaching';

const kidney = 'https://training.seer.cancer.gov/anatomy/urinary/components/kidney.html';
const ureter = 'https://training.seer.cancer.gov/anatomy/urinary/components/ureters.html';
export const hraRenalReferenceTitles = { [kidney]: 'NCI SEER · Kidneys', [ureter]: 'NCI SEER · Ureters' };
// Original concise summaries; source reviewed 2026-09-12. No images or tables imported.
// Source-part letters do not alter the concept lesson or imply a drainage match.
const lessons: Record<string, readonly [string, string]> = {
  capsule: ['Fibrous covering closely surrounding the kidney.', 'Supports the enclosed renal tissue.'],
  hilum: ['Medial indentation opening towards the renal sinus.', 'Provides a passage for renal vessels and the urinary outflow.'],
  cortex: ['Outer renal parenchyma beneath the capsule.', 'Contributes to the kidney’s urine-forming tissue.'],
  column: ['Cortical tissue extending between adjacent pyramids.', 'Forms part of the renal parenchyma.'],
  pyramid: ['Medullary region with its base towards the cortex and apex towards the sinus.', 'Contains straight tubular structures and vessels.'],
  papilla: ['Apical region of a renal pyramid.', 'Urine from collecting ducts enters the minor calyces here.'],
  'minor-calyx': ['Collecting cup around a papillary region.', 'Receives urine before it passes towards major calyces.'],
  'major-calyx': ['Larger collecting region formed by converging minor calyces.', 'Conveys urine towards the renal pelvis.'],
  pelvis: ['Central collecting cavity within the renal sinus.', 'Channels urine into the ureter.'],
  artery: ['Arterial vessel entering the kidney at the hilum.', 'Carries blood into the kidney.'],
  vein: ['Venous vessel leaving the kidney at the hilum.', 'Carries blood away from the kidney.'],
  ureter: ['Retroperitoneal tube connecting the renal pelvis with the urinary bladder.', 'Smooth-muscle peristalsis propels urine towards the bladder.'],
};
export function authoredHraRenalLesson(concept: string): SpecimenLesson | null {
  const value = lessons[concept];
  return value ? { anatomy: value[0], function: value[1], references: [concept === 'ureter' ? ureter : kidney] } : null;
}
