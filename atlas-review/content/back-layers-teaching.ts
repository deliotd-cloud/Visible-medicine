import type { SpecimenLesson } from './um-limb-teaching';
import { backLayersClinicalReferences } from './back-layers-clinical';
import { backBoneReferences } from './back-bone-teaching';
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
  ...Object.fromEntries(
    Object.values(backBoneReferences).map((r) => [r.url, r.title]),
  ),
  ...Object.fromEntries(
    Object.values(backLayersClinicalReferences).map((r) => [r.url, r.title]),
  ),
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
    attachments: {
      proximal:
        'Sacrum and posterior vertebral elements, with attachments varying along the column.',
      distal:
        'Spinous processes typically two to four levels above each lower attachment; individual fascicles are not labelled here.',
      motor:
        'Segmental posterior rami of spinal nerves; no source-specific motor territory is mapped.',
    },
    references: [back],
  },
  rhomboidMajor: {
    anatomy:
      'Connects the T2–T5 spinous region to the medial scapular border below the scapular spine.',
    function:
      'Retracts the scapula and contributes to its downward rotation. Typical motor supply is the dorsal scapular nerve.',
    attachments: {
      proximal: 'T2–T5 spinous processes and adjacent supraspinous ligament.',
      distal:
        'Medial scapular border below the spine towards the inferior angle.',
      motor:
        'Dorsal scapular nerve, commonly described with a C5 contribution.',
    },
    references: [major],
  },
  rhomboidMinor: {
    anatomy:
      'Connects the lower nuchal ligament and C7–T1 spinous region to the medial scapula near its spine.',
    function:
      'Retracts the scapula and contributes to its downward rotation. Typical motor supply is the dorsal scapular nerve.',
    attachments: {
      proximal: 'Lower nuchal ligament and C7–T1 spinous processes.',
      distal: 'Medial scapular border at the root of the scapular spine.',
      motor:
        'Dorsal scapular nerve, commonly described with a C5 contribution.',
    },
    references: [minor],
  },
  trapezius: {
    anatomy:
      'Spans the occipital/nuchal and cervical–thoracic midline regions to the lateral clavicle, acromion and scapular spine. The source divides each side into three parts.',
    function:
      'Its parts cooperate in scapular elevation, retraction, depression and upward rotation. Motor supply is the spinal accessory nerve; cervical contributions carry proprioceptive information.',
    attachments: {
      proximal:
        'Whole muscle: occipital/nuchal midline and C7–T12 spinous region; not three independent complete origins.',
      distal:
        'Whole muscle: lateral clavicle, acromion and scapular spine. The selected part is qualified below.',
      motor:
        'Spinal accessory nerve (CN XI); C3–C4 contributions are described for proprioception, not a separately segmented motor map.',
    },
    references: [upper],
  },
};
// Exact source-part IDs, not string matching or an inferred motor crosswalk.
const ascending =
  'Selected ascending (lower) part: fibres approach the scapular spine from below; they contribute to depression and coordinated upward rotation of the scapula. This is typical action, not simulated force.';
const transverse =
  'Selected transverse (middle) part: fibres approach the acromial/scapular-spine region and contribute chiefly to scapular retraction. It is not an independently animated muscle.';
const descending =
  'Selected descending (upper) part: fibres approach the lateral clavicular region from above; they contribute to elevation and coordinated upward rotation. Source boundaries are not validated attachment footprints.';
export const backLayersPartNotes: Record<string, string> = {
  FMA33581: ascending,
  FMA33583: ascending,
  FMA33584: transverse,
  FMA33585: transverse,
  FMA33586: descending,
  FMA33587: descending,
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
