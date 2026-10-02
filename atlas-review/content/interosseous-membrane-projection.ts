// Original anatomical orientation drafts. Reading links do not license images or patient data.
export const interosseousMembraneProjectionReferences = {
  forearm: {
    title: 'AO Surgery Reference: Clinical and radiographic examination of the forearm',
    url: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/forearm-shaft/further-reading/clinical-and-radiographic-examination',
  },
  leg: {
    title: 'AO Surgery Reference: Suprasyndesmotic fibular fracture and interosseous injury',
    url: 'https://surgeryreference.aofoundation.org/orthopedic-trauma/adult-trauma/malleoli/suprasyndesmotic-simple-fibular-fracture-medial-injury-posterior-fracture/orif',
  },
  ankle: {
    title: 'ACR Appropriateness Criteria: Acute Trauma to the Ankle',
    url: 'https://acsearch.acr.org/docs/69436/Narrative/',
  },
  ct: {
    title: 'RadiologyInfo: Body CT',
    url: 'https://www.radiologyinfo.org/en/info/bodyct',
  },
} as const;

type ProjectionTopic = {
  body: string;
  bullets: readonly string[];
  references: readonly (keyof typeof interosseousMembraneProjectionReferences)[];
};

export const interosseousMembraneProjectionTopics: Record<'forearm' | 'leg', Record<'ct' | 'xray', ProjectionTopic>> = {
  forearm: {
    ct: {
      body: 'The forearm interosseous membrane spans the space between radius and ulna. Use CT sections to orient their bony shafts and their relationships at the elbow and wrist.',
      bullets: [
        'Bone position or a visible gap supplies alignment context; it does not prove continuity of the whole membrane.',
        'Keep proximal and distal radioulnar relationships distinct when following either bone through the study.',
      ],
      references: ['forearm', 'ct'],
    },
    xray: {
      body: 'On a forearm radiograph, follow radius and ulna between elbow and wrist. Their projected space helps locate the membrane region, although an intact membrane is not directly outlined.',
      bullets: [
        'Compare the bone contours and adjacent joint relationships as indirect alignment clues.',
        'Projection overlap and forearm rotation can change the apparent space; the atlas camera is not an acquired radiograph.',
        'Normal-looking bone alignment alone does not establish continuity of the whole membrane.',
      ],
      references: ['forearm'],
    },
  },
  leg: {
    ct: {
      body: 'The leg interosseous membrane lies between tibia and fibula along the shafts. CT supplies bony and alignment context from the proximal fibula toward the ankle.',
      bullets: [
        'The distal tibiofibular syndesmosis is an ankle region, not the entire length of the membrane.',
        'A local ankle field may not show the proximal fibula or the full extent of a leg injury; CT bone detail alone cannot establish whole-membrane integrity.',
      ],
      references: ['leg', 'ankle', 'ct'],
    },
    xray: {
      body: 'Trace the tibia and fibula through the leg and distinguish the proximal fibula from the distal ankle relationship. Their separation is a projection cue, not a direct image of the intact membrane.',
      bullets: [
        'Ankle alignment may suggest concern at the syndesmosis while a more proximal fibular finding changes the region to consider.',
        'A single projected view cannot establish the full extent of membrane injury.',
      ],
      references: ['leg', 'ankle'],
    },
  },
};

export const interosseousMembraneProjectionShared = [
  'These four existing root membrane models orient the space between paired bones; their surfaces do not assert segmented subbands or complete attachment footprints.',
  'The fixed atlas scene is not an acquired CT or radiograph, patient registration, or a validated injury simulation. No colour, separation or camera angle encodes tissue signal or clinical status.',
  'These teaching drafts require revision-bound radiologist sign-off before any clinical or imaging approval claim.',
] as const;
