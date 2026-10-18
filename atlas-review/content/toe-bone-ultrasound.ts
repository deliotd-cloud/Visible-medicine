// Original surface-orientation teaching; linked reading only, no imported media.
export const toeBoneUltrasoundReferences = {
  hung2020: {url: 'https://www.mdpi.com/2075-4418/10/3/160', licence: 'CC BY 4.0'},
  pistoia2025: {url: 'https://link.springer.com/article/10.1007/s00256-025-04901-w', licence: 'CC BY 4.0'},
  moroni2022: {url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8938480/', licence: 'CC BY 4.0'},
} as const;

export type ToeBoneUltrasoundLesson = {
  readonly body: string;
  readonly bullets: readonly string[];
  readonly citations: readonly (keyof typeof toeBoneUltrasoundReferences)[];
};

export const toeBoneUltrasoundReviewNote =
  'Original educational draft; revision-bound radiologist review pending. The selected three-phalangeal lesser-toe pattern is not universal: biphalangeal variants occur, particularly in the fifth toe. The whole-bone mesh is not an ultrasound frame, patient registration, acquisition simulator or diagnostic test. A local acoustic window does not show the entire bone or its marrow. Atlas, imaging-case and paid-lecture access remain independent.';

export const toeBoneUltrasoundTeaching = {
  halluxProximal: {
    ultrasound: {
      body: 'The hallux proximal phalanx lies between the first metatarsophalangeal and interphalangeal joints. High-resolution toe ultrasound can use long- and short-axis views to relate a local plantar soft-tissue window to the selected bone and joint level. At the interphalangeal level, distinguish this proximal phalanx from the distal phalanx across the joint. The hallux has no middle phalanx; a local contour does not show the whole bone.',
      bullets: [
        'Keep the first metatarsophalangeal and hallux interphalangeal levels separate; do not transfer lesser-toe PIP or DIP labels.',
        'A plantar interphalangeal ossicle is variable, not a required feature of this source or any individual view; adjacent soft tissue needs acquired images.',
      ],
      citations: ['pistoia2025', 'moroni2022'],
    },
  },
  lesserProximal: {
    ultrasound: {
      body: 'A proximal phalanx of a lesser toe runs from its metatarsophalangeal joint to its proximal interphalangeal joint. High-resolution toe ultrasound has described plantar soft-tissue landmarks at the metatarsophalangeal level and along the proximal phalanx in long- and short-axis views. Use the selected toe and joint level to orient any local cortical interval, while keeping the adjacent metatarsal and middle phalanx separate. This whole-bone mesh cannot predict the actual window.',
      bullets: [
        'Name the toe and distinguish the metatarsophalangeal end from the proximal interphalangeal end before comparing views.',
        'Plantar tendon and pulley-region landmarks require acquired images and can be harder to resolve in the fifth toe; they are not mesh parts.',
      ],
      citations: ['pistoia2025'],
    },
  },
  middle: {
    ultrasound: {
      body: 'The middle phalanx in each selected lesser toe lies between proximal and distal interphalangeal joints. High-resolution plantar ultrasound describes different soft-tissue landmarks at those two levels, so a local contour needs its toe and joint identified before comparison with this bone. The proximal base and distal head are separate ends even when one window cannot show both. This source pattern does not establish every individual patient’s toe anatomy.',
      bullets: [
        'Keep the PIP and DIP levels distinct; a neighbouring proximal or distal phalanx is a separate selection.',
        'Landmark visibility, particularly in the fifth toe, depends on the acquired view; tendon continuity and marrow are absent from the mesh.',
      ],
      citations: ['pistoia2025'],
    },
  },
  halluxDistal: {
    ultrasound: {
      body: 'The hallux distal phalanx begins at the hallux interphalangeal joint and extends toward the terminal tuft. Sagittal and axial ultrasound accounts of that joint distinguish proximal and distal phalanges with nearby plantar soft tissues. Use those as local orientation relationships, keeping the distal phalanx base separate from its terminal end. An interphalangeal ossicle may occur at the plantar joint but is not a universal or independently selected structure here.',
      bullets: [
        'Use the hallux IP label, not a lesser-toe DIP label; there is no intervening middle hallux phalanx.',
        'The source cannot establish an ossicle, plantar-plate or tendon finding, nail-region condition or internal marrow state.',
      ],
      citations: ['moroni2022'],
    },
  },
  lesserDistal: {
    ultrasound: {
      body: 'A lesser-toe distal phalanx extends from its distal interphalangeal joint toward the terminal tuft. High-resolution toe ultrasound describes a plantar soft-tissue landmark at the distal interphalangeal level, but a local view must still be assigned to the correct toe and bone end. Keep the neighbouring middle phalanx separate from the distal joint-side base. The static source surface cannot tell whether a particular window reaches the terminal region.',
      bullets: [
        'Do not mistake the distal interphalangeal level for the proximal interphalangeal joint farther up the toe.',
        'Landmarks are less consistently resolved in the fifth toe; nail-region tissue, tendon continuity and marrow are absent from this mesh.',
      ],
      citations: ['pistoia2025'],
    },
  },
} as const satisfies Record<
  'halluxProximal' | 'lesserProximal' | 'middle' | 'halluxDistal' | 'lesserDistal',
  Record<'ultrasound', ToeBoneUltrasoundLesson>
>;
