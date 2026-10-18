import type { ContentLesson } from './content-types';

export type ShoulderSoftTissue = 'deltoid' | 'supraspinatus' | 'infraspinatus' | 'subscapularis' | 'biceps-long-head' | 'teres-minor';
const anatomy = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const limits = 'https://www.radiologyinfo.org/en/info/bonerad';
const cuff = 'https://www.orthoinfo.org/diseases--conditions/rotator-cuff-tears/';
const biceps = 'https://www.orthoinfo.org/diseases--conditions/biceps-tendon-tear-at-the-shoulder/';
const topics: Record<ShoulderSoftTissue, { name: string; landmark: string; distinction: string }> = {
  deltoid: {
    name: 'Deltoid',
    landmark: 'Relate the clavicle, acromion and scapular spine to the deltoid origin; its humeral attachment is farther down the shaft.',
    distinction: 'The dedicated shoulder crop is not evidence of the complete distal attachment. A soft-tissue outline does not resolve the three deltoid portions or establish muscle integrity.',
  },
  supraspinatus: {
    name: 'Supraspinatus',
    landmark: 'Use the supraspinous fossa and superior greater-tubercle attachment to orient this upper cuff component.',
    distinction: 'Bony appearance alone does not establish whether this tendon is intact. A normal radiograph does not exclude a cuff tear.',
  },
  infraspinatus: {
    name: 'Infraspinatus',
    landmark: 'Identify the scapular spine, then relate the muscle below it to the middle facet of the greater tubercle.',
    distinction: 'Do not label the posterior cuff from an overlapping bony projection alone. Radiography cannot directly establish this tendon’s continuity.',
  },
  subscapularis: {
    name: 'Subscapularis',
    landmark: 'Relate the anterior scapular surface to the lesser tubercle, rather than the greater-tubercle attachment of the other cuff muscles.',
    distinction: 'Seeing the lesser tubercle does not prove that its tendon attachment is intact. The isolated coloured surface is not an X-ray silhouette.',
  },
  'biceps-long-head': {
    name: 'Biceps · long head',
    landmark: 'Use the supraglenoid origin as an anatomical landmark; do not confuse it with the short head’s coracoid origin.',
    distinction: 'Plain radiographs cannot directly show a long-head biceps tear. They can help assess alternative bony causes of shoulder pain; tendon assessment requires other evidence.',
  },
  'teres-minor': {
    name: 'Teres minor',
    landmark: 'Relate the lateral scapular border to the inferior facet of the greater tubercle, below the infraspinatus attachment.',
    distinction: 'An overlapping radiographic projection cannot separate this small cuff muscle from infraspinatus or establish muscle quality.',
  },
};

/** Dedicated shoulder authoring only; never inferred onto a different source mesh. */
export function shoulderSoftTissueXrayLesson(key: ShoulderSoftTissue): ContentLesson {
  const topic = topics[key];
  const isCuff = key !== 'deltoid' && key !== 'biceps-long-head';
  return {
    title: `${topic.name} · X-ray landmarks and limits`,
    readiness: 'draft',
    body: topic.landmark,
    bullets: [topic.distinction,
      isCuff
        ? 'MRI or ultrasound can assess cuff soft tissues. Neither a normal X-ray nor an intact atlas surface establishes a normal tendon.'
        : 'Radiographs provide limited soft-tissue detail. Use the MRI and Ultrasound teaching tabs for complementary context, not as proof that a patient study is linked.',
      'Return explode to zero and keep bones visible for orientation. Camera rotation is not a radiographic projection; no detector geometry or measured patient relationship is supplied.',
    ],
    citations: [anatomy, limits, ...(isCuff ? [cuff] : key === 'biceps-long-head' ? [biceps] : [])],
    note: 'Original teaching draft; radiologist sign-off pending. No source image or prose is reproduced. No patient scan, registration or acquisition recommendation is provided. Atlas, imaging-case and lecture access remain independent.',
  };
}
