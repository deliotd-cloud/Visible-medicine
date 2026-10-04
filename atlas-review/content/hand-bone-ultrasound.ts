// Original educational interpretation of the linked CC BY 4.0 articles.
// No article text, figures, sonograms, scans, datasets or meshes are imported.
export const handBoneUltrasoundReferences = {
  wang2021: {url: 'https://www.mdpi.com/2075-4418/11/10/1834', licence: 'CC BY 4.0'},
  russo2022: {url: 'https://www.mdpi.com/2075-4426/12/10/1733', licence: 'CC BY 4.0'},
  handPain2024: {url: 'https://www.mdpi.com/2075-4418/14/7/669', licence: 'CC BY 4.0'},
} as const;

export type HandBoneUltrasoundLesson = {
  readonly body: string;
  readonly bullets: readonly string[];
  readonly citations: readonly (keyof typeof handBoneUltrasoundReferences)[];
};

export const handBoneUltrasoundReviewNote =
  'Original educational draft; revision-bound radiologist review pending. This source surface is not an acoustic image, acquisition simulator, marrow study or fracture-exclusion test. No patient registration is supplied. Atlas, imaging-case and paid-lecture access remain independent.';

export const handBoneUltrasoundTeaching = {
  metacarpal: {
    ultrasound: {
      body: 'For an index, middle, ring or little metacarpal, use the selected ray to relate the distal head at the metacarpophalangeal joint to its proximal carpal neighbour. A longitudinal hand ultrasound account follows the second metacarpal toward trapezoid and scaphoid, the third toward capitate and scaphoid or lunate, and the fourth or fifth toward hamate and lunate. A dorsal metacarpophalangeal view can distinguish a cortical head contour from overlying cartilage, capsule and extensor tendon.',
      bullets: [
        'These are adjoining landmarks in particular surface windows, not proof that one ultrasound image contains the entire metacarpal or its carpal partners.',
        'The static bone mesh contains no cartilage, capsule, tendon echo, marrow information or patient-specific joint measurement.',
      ],
      citations: ['wang2021', 'handPain2024'],
    },
  },
  thumbMetacarpal: {
    ultrasound: {
      body: 'Along the thumb ray, a longitudinal ultrasound orientation account places the first metacarpal beside the trapezium and then the scaphoid toward the wrist. At its distal end the first metacarpal meets the thumb proximal phalanx at the metacarpophalangeal joint. Use those two ends to orient the selected whole-bone surface without turning a view of one cortical segment into a claim about the complete bone or joint.',
      bullets: [
        'Keep the first carpometacarpal relationship separate from the distal thumb metacarpophalangeal level.',
        'The source has no acquired cartilage, ligament, tendon, marrow, dynamic instability or patient-space correspondence.',
      ],
      citations: ['wang2021', 'handPain2024'],
    },
  },
  proximal: {
    ultrasound: {
      body: 'An index, middle, ring or little proximal phalanx lies distal to its metacarpophalangeal joint and proximal to its proximal interphalangeal joint. In a dorsal metacarpophalangeal ultrasound view, the metacarpal head cortex and overlying cartilage, capsule and extensor tendon give separate tissue cues. At the finger, ultrasound can follow a local phalangeal cortical surface and neighbouring tendon rather than display the whole bone. Use the selected phalanx to keep the two joint levels distinct.',
      bullets: [
        'The sagittal band is described at the metacarpal head, not as a separate part of this proximal-phalanx mesh.',
        'No acoustic shadow, tendon integrity, marrow or joint disease can be inferred from an intact atlas surface.',
      ],
      citations: ['russo2022', 'handPain2024'],
    },
  },
  thumbProximal: {
    ultrasound: {
      body: 'The thumb proximal phalanx links the thumb metacarpophalangeal joint to its single interphalangeal joint. It meets the distal phalanx directly; there is no thumb middle phalanx. Use a local accessible cortical boundary and the adjacent joint level as orientation cues when relating a real ultrasound image to the selected source bone. The atlas surface does not tell which part of either joint an actual acoustic window resolves.',
      bullets: [
        'Do not transfer the fingers’ proximal-interphalangeal or central-slip landmarks to this thumb selection.',
        'Cartilage, capsule, collateral structures, marrow and dynamic motion are not established by this mesh.',
      ],
      citations: ['handPain2024'],
    },
  },
  middle: {
    ultrasound: {
      body: 'The middle phalanx of an index, middle, ring or little finger lies between the proximal and distal interphalangeal joints. Ultra-high-frequency ultrasound illustrations show the central extensor band approaching the base of a middle phalanx. This is a soft-tissue relationship at one local surface, not a separately segmented attachment in the selected whole-bone mesh. Distinguish the proximal base from the distal head before relating an acquired tendon view to the atlas.',
      bullets: [
        'A visible cortical interval is not a complete assessment of either interphalangeal joint or the extensor mechanism.',
        'The source cannot demonstrate tendon continuity, deep marrow, a fracture exclusion or measured insertion position.',
      ],
      citations: ['russo2022'],
    },
  },
  distal: {
    ultrasound: {
      body: 'For an index, middle, ring or little finger, the distal phalanx begins beyond the distal interphalangeal joint. High-frequency ultrasound examples relate the terminal extensor tendon to the dorsal joint level and the deep flexor tendon to the distal-phalangeal base. These are distinct dorsal and volar soft-tissue windows. The selected source bone supplies a location cue for its base and terminal end, not either tendon’s actual insertion footprint or an acquired image.',
      bullets: [
        'Confirm the real finger and dorsal or volar side independently; model rotation is not probe orientation.',
        'Neither a smooth atlas cortex nor a limited ultrasound window establishes marrow condition or excludes fracture.',
      ],
      citations: ['russo2022'],
    },
  },
  thumbDistal: {
    ultrasound: {
      body: 'The thumb distal phalanx starts at the thumb interphalangeal joint and ends at the thumb tip. There is no intervening middle phalanx and no separate distal interphalangeal joint. Use the selected bone to rehearse that single joint level when orienting a local ultrasound view of the thumb. The finger tendon examples in the cited high-frequency review are not evidence that the same insertion pattern or acoustic appearance applies to this thumb source.',
      bullets: [
        'Keep thumb interphalangeal terminology separate from the fingers’ PIP and DIP labels.',
        'This whole-bone surface supplies no nail-bed, tendon, cartilage, marrow or patient-specific finding.',
      ],
      citations: ['handPain2024'],
    },
  },
  capitate: {
    ultrasound: {
      body: 'The capitate sits in the distal carpal row beneath the middle-finger ray. A longitudinal ultrasound orientation account places the third metacarpal next to the capitate, then scaphoid or lunate farther toward the wrist. In transverse volar views, the capitate can contribute to the deeper floor landmark at a carpal-tunnel level. These reciprocal landmarks help name a limited exposed contour; they do not make the entire capitate visible in one sonogram.',
      bullets: [
        'Distinguish the capitate from the adjacent trapezoid and hamate rather than treating the distal row as one surface.',
        'The selected bone supplies no tunnel contents, cartilage thickness, marrow signal or validated ligament attachment.',
      ],
      citations: ['wang2021'],
    },
  },
  trapezium: {
    ultrasound: {
      body: 'The trapezium lies at the thumb side of the distal carpal row. A longitudinal thumb-ray ultrasound account places first metacarpal, trapezium and scaphoid in sequence. At a distal volar tunnel level, the trapezium tubercle and hamate hook form opposing superficial bony landmarks. The selected trapezium is a whole-bone surface; the tubercle is a local orientation feature, not a separately reviewed source part or a guarantee of complete acoustic access.',
      bullets: [
        'Keep the thumb carpometacarpal side distinct from the second-metacarpal/trapezoid ray.',
        'No ligament integrity, tunnel content, joint cartilage or patient-specific alignment is validated by the atlas.',
      ],
      citations: ['wang2021'],
    },
  },
  trapezoid: {
    ultrasound: {
      body: 'The trapezoid is the distal-row carpal neighbour of the second metacarpal. In a longitudinal index-ray ultrasound account, the second metacarpal, trapezoid and scaphoid provide a sequence of bony landmarks. A transverse volar account places the trapezoid among deeper floor landmarks at the distal carpal-tunnel level, separate from the more superficial trapezium tubercle. Use that neighbour pattern to orient the selected bone without claiming its entire surface can be followed acoustically.',
      bullets: [
        'Do not substitute the trapezium of the thumb ray or the capitate of the middle ray.',
        'The surface model has no actual acoustic shadow, cartilage, intercarpal ligament or patient correspondence.',
      ],
      citations: ['wang2021'],
    },
  },
  triquetral: {
    ultrasound: {
      body: 'The triquetrum belongs to the ulnar side of the proximal carpal row. In a volar transverse ultrasound account, the pisiform lies on its palmar aspect rather than in the same row plane. Dorsal and volar wrist views use this neighbour relationship to orient the triquetral contour and adjacent intercarpal interval. This selected whole bone should not be mistaken for the pisiform or used to infer that a single acoustic window shows its hidden surfaces.',
      bullets: [
        'The neighbouring pisiform can cast a local acoustic shadow; separating source meshes does not remove that barrier in a real scan.',
        'Ligament fibre integrity, cartilage, marrow and diagnostic wrist stability are not supplied by this bone selection.',
      ],
      citations: ['wang2021'],
    },
  },
} as const satisfies Record<
  'metacarpal' | 'thumbMetacarpal' | 'proximal' | 'thumbProximal' | 'middle' |
  'distal' | 'thumbDistal' | 'capitate' | 'trapezium' | 'trapezoid' | 'triquetral',
  Record<'ultrasound', HandBoneUltrasoundLesson>
>;
