import type { RegionalTour } from './regional-tours';

const pelvic = (side: string, name: string) => `vm:anatomy:body:pelvis:${side}:organ:${name}`;
const testis = pelvic('right', 'right-testis');
const epididymis = pelvic('right', 'right-epididymis');
const duct = pelvic('right', 'right-deferent-duct');
const vesicle = pelvic('right', 'right-seminal-vesicle');
const prostate = pelvic('unpaired', 'prostate');
const urethra = pelvic('unpaired', 'urethra');
const bladder = pelvic('unpaired', 'urinary-bladder');
const ureter = 'vm:anatomy:body:abdomen:right:organ:right-ureter';
const ductsReference = 'https://training.seer.cancer.gov/anatomy/reproductive/male/duct.html';
const glandsReference = 'https://training.seer.cancer.gov/anatomy/reproductive/male/glands.html';
const step = (id: string, title: string, selectedId: string, view: RegionalTour['steps'][number]['view'], caption: string, frameIds: string[], reference: string): RegionalTour['steps'][number] => ({
  id, title, selectedId, view, caption, frameIds,
  references: [reference], durationMs: 14000, fadeOthers: true,
});

/** Orientation stops retain existing adult-male surfaces in their source coordinates. */
export const maleDuctTour: RegionalTour = {
  id: 'male-pelvic-duct-landmarks', title: 'Male pelvis: duct landmarks', region: 'pelvis',
  revision: 'male-pelvic-duct-landmarks-v1', status: 'draft',
  description: 'Six orientation stops with bladder and right ureter context. The accessory gland stop is not a serial sperm transit stop.',
  limitations: 'Selected adult-male exterior source surfaces in unchanged coordinates; anatomical boundaries and relationships remain unvalidated. Not a continuous sperm-flow simulation or a complete reproductive tract. Efferent ducts, ejaculatory ducts, lumen, patency, cord coverings, fertility, operative guidance and scan registration are absent. The seminal vesicle is an accessory gland, not a serial sperm transit stop. Surface proximity does not establish duct continuity or a verified crossing. Fading is not dissection; context can extend outside a local frame. Draft pending revision-bound radiologist review; no clinical approval.',
  contextIds: [bladder, ureter],
  requiredDisplayBundles: {
    [testis]: 'pelvis-organs-recovery', [epididymis]: 'pelvis-organs-gaps',
    [duct]: 'deferent-ducts', [vesicle]: 'pelvis-organs-recovery',
    [prostate]: 'pelvis-organs-recovery', [urethra]: 'pelvis-organs-gaps',
    [bladder]: 'pelvis-organs', [ureter]: 'abdomen-organs-recovery',
  },
  steps: [
    step('right-testis', 'Right testis', testis, 'right',
      'Begin with the testis and adjacent epididymis. These separate surfaces provide orientation without demonstrating their internal connections.',
      [testis, epididymis], ductsReference),
    step('right-epididymis', 'Right epididymis', epididymis, 'posterior',
      'The epididymis lies along the posterior and superior testis. Sperm mature and are stored here in usual anatomy.',
      [epididymis, testis], ductsReference),
    step('right-deferent-duct', 'Right deferent duct', duct, 'right',
      'The vas continues from the epididymal tail towards the pelvic wall, over the ureter and behind the bladder. This crossing remains unverified here.',
      [duct, bladder], ductsReference),
    step('right-seminal-vesicle', 'Right seminal vesicle', vesicle, 'posterior',
      'Identify this accessory gland behind the bladder. Sperm do not pass through the seminal vesicle as a serial transit stop.',
      [vesicle, bladder, prostate], glandsReference),
    step('prostate', 'Prostate', prostate, 'right',
      'Compare the prostate below the bladder. Its outer surface does not show gland zones or a patent urethral lumen.',
      [prostate, bladder], glandsReference),
    step('urethra', 'Urethra', urethra, 'right',
      'Ejaculatory ducts normally traverse the prostate into the urethra; those ducts are not rendered. Finish by comparing the separate urethral surface.',
      [urethra, prostate], ductsReference),
  ],
};
