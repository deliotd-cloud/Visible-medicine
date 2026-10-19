// Original surface-orientation teaching from linked reading; no source wording or media imported.
export const footUltrasoundFollowupReferences = {
  hung2020: {url: 'https://www.mdpi.com/2075-4418/10/3/160', licence: 'CC BY 4.0'},
  maeda2022: {url: 'https://www.nature.com/articles/s41598-022-13425-5', licence: 'CC BY 4.0'},
  requist2023: {url: 'https://www.nature.com/articles/s41598-023-32500-z', licence: 'CC BY 4.0'},
  savasan2026: {url: 'https://www.mdpi.com/2075-4418/16/9/1264', licence: 'CC BY'},
} as const;

export type FootUltrasoundFollowupLesson = {
  readonly body: string;
  readonly bullets: readonly string[];
  readonly citations: readonly (keyof typeof footUltrasoundFollowupReferences)[];
};

export const footUltrasoundFollowupReviewNote =
  'Original educational draft; revision-bound radiologist review pending. This whole-bone Atlas surface is not an acoustic frame, patient registration, acquisition simulator or diagnostic test. Ultrasound offers local accessible surface windows, not bone penetration, marrow assessment or complete bone coverage. Interpretation requires adequate acquired and inspected images; this model cannot exclude a Lisfranc injury. Atlas, imaging-case and paid-lecture access remain independent.';

export const halluxUltrasoundReviewNote =
  'Original educational draft; revision-bound radiologist review pending. The hallux has proximal and distal phalanges meeting at one interphalangeal joint, with no middle phalanx. A plantar interphalangeal ossicle is variable, not universal. The whole-bone Atlas surface is not an ultrasound frame, patient registration, acquisition simulator or diagnostic test; a local window does not show the complete bone or marrow. Atlas, imaging-case and paid-lecture access remain independent.';

export const footUltrasoundFollowupTeaching = {
  cuboid: {
    ultrasound: {
      body: 'Use the cuboid as a lateral midfoot landmark with two separate ends. Proximally it meets the calcaneus at the calcaneocuboid joint, part of the Chopart region. Distally it meets the fourth and fifth metatarsal bases at their tarsometatarsal joints. An illustrated ultrasound review relates the proximal joint to the bifurcate-ligament region and follows peroneus longus through its plantar cuboid tunnel. These are local surface relationships; the selected whole cuboid does not specify a probe plane or reveal tendon integrity.',
      bullets: [
        'Keep the proximal calcaneocuboid interval separate from the distal fourth/fifth TMT intervals.',
        'An acoustic cortical line cannot disclose cuboid marrow or its hidden surfaces.',
      ],
      citations: ['hung2020', 'savasan2026'],
    },
  },
  medialCuneiform: {
    ultrasound: {
      body: 'At the first ray, the medial cuneiform meets the first metatarsal at the first tarsometatarsal joint. A research ultrasound study sampled their dorsal contours in a longitudinal view during synchronized gait analysis; its measurements depended on actual image landmarks and motion capture. Separately, the Lisfranc ligament spans from the medial cuneiform toward the second metatarsal base, not from the intermediate cuneiform. Use this source to distinguish those neighbouring relationships, without transferring the experimental movement method or a ligament finding to the static mesh.',
      bullets: [
        'The first TMT interval and C1-to-M2 Lisfranc relationship are distinct.',
        'Only adequate acquired images can support a local ultrasound assessment; injury cannot be excluded here.',
      ],
      citations: ['hung2020', 'maeda2022'],
    },
  },
  intermediateCuneiform: {
    ultrasound: {
      body: 'The intermediate cuneiform is central, behind the second metatarsal base. Keep this C2-to-M2 column distinct from the medial cuneiform and its C1-to-M2 Lisfranc ligament relationship. A CT-derived anatomical account describes the intermediate column together with the lateral cuneiform and the second and third metatarsals; it does not establish an ultrasound window. Use the selection to orient neighbouring dorsal bone surfaces only when an acquired image actually identifies them, rather than projecting internal joint surfaces or a ligament course from this whole-bone model.',
      bullets: [
        'C2 is not C1: a central TMT landmark does not itself depict the Lisfranc ligament.',
        'Micro-CT subchondral surfaces are not cartilage or evidence of an ultrasound window.',
      ],
      citations: ['hung2020', 'savasan2026', 'requist2023'],
    },
  },
  lateralCuneiform: {
    ultrasound: {
      body: 'The lateral cuneiform is C3, next to the intermediate cuneiform and proximal to the third metatarsal base. The cuboid lies farther laterally and meets the fourth and fifth metatarsals; do not exchange those distal columns when orienting a limited dorsal surface window. A CT-derived column map helps name these neighbours, but supplies neither an ultrasound field of view nor a measured joint contour. An actual acoustic view must identify its own bone margins before any local comparison with this selected mesh.',
      bullets: [
        'Keep C3-to-M3 separate from the cuboid-to-M4/M5 region.',
        'A visible cortical segment cannot establish hidden surfaces, marrow state or ligament integrity.',
      ],
      citations: ['savasan2026'],
    },
  },
} as const satisfies Record<
  'cuboid' | 'medialCuneiform' | 'intermediateCuneiform' | 'lateralCuneiform',
  Record<'ultrasound', FootUltrasoundFollowupLesson>
>;
