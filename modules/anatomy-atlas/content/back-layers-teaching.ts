import type { SpecimenLesson } from './um-limb-teaching';
const upper =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const back = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html';
const major =
  'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/muscles/rhmj.htm';
const minor =
  'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/muscles/rhmn.htm';
const lat =
  'https://www.meddean.luc.edu/lumen/meded/grossanatomy/dissector/muscles/lat.htm';
export const backLayersReferences = {
  [upper]: 'Texas Tech · shoulder-girdle and arm muscles',
  [back]: 'Texas Tech · back muscles',
  [major]: 'Loyola · rhomboid major',
  [minor]: 'Loyola · rhomboid minor',
  [lat]: 'Loyola · latissimus dorsi',
};
// Original concise synthesis; source tables/illustrations are not redistributed.
export const backLayersLessons: Record<string, SpecimenLesson> = {
  latissimus: {
    anatomy:
      'A broad superficial back muscle converging toward the humerus. Its trunk attachments involve the lower spine, thoracolumbar fascia, iliac crest and lower ribs.',
    function:
      'Extends, adducts and medially rotates the arm. Typical motor supply is the thoracodorsal nerve.',
    attachments: {
      proximal:
        'Lower spinal, iliac and costal regions, including fascial attachments.',
      distal: 'Floor of the humeral intertubercular groove.',
      motor: 'Thoracodorsal nerve.',
    },
    references: [lat],
  },
  multifidus: {
    anatomy:
      'A deep transversospinal muscle group with attachments along the sacrum and vertebral column. Fascicles run toward spinous processes above their lower attachments.',
    function:
      'Contributes to spinal extension, lateral bending and opposite-side rotation. Typical motor supply is through posterior spinal-nerve rami.',
    references: [back],
  },
  rhomboidMajor: {
    anatomy:
      'Connects the T2–T5 spinous region to the medial scapular border below the scapular spine.',
    function:
      'Retracts the scapula and contributes to its downward rotation. Typical motor supply is the dorsal scapular nerve.',
    references: [major],
  },
  rhomboidMinor: {
    anatomy:
      'Connects the lower nuchal ligament and C7–T1 spinous region to the medial scapula near its spine.',
    function:
      'Retracts the scapula and contributes to its downward rotation. Typical motor supply is the dorsal scapular nerve.',
    references: [minor],
  },
  trapezius: {
    anatomy:
      'Spans the occipital/nuchal and cervical–thoracic midline regions to the lateral clavicle, acromion and scapular spine. The source divides each side into three parts.',
    function:
      'Its parts cooperate in scapular elevation, retraction, depression and upward rotation. Motor supply is the spinal accessory nerve; cervical contributions carry proprioceptive information.',
    references: [upper],
  },
};
export const backLayersLessonIds: Record<
  string,
  keyof typeof backLayersLessons
> = {
  FMA13358: 'latissimus',
  FMA13359: 'latissimus',
  FMA22878: 'multifidus',
  FMA22879: 'multifidus',
  FMA13381: 'rhomboidMajor',
  FMA13382: 'rhomboidMajor',
  FMA13383: 'rhomboidMinor',
  FMA13384: 'rhomboidMinor',
  FMA33581: 'trapezius',
  FMA33583: 'trapezius',
  FMA33584: 'trapezius',
  FMA33585: 'trapezius',
  FMA33586: 'trapezius',
  FMA33587: 'trapezius',
};
