/** Original concise bony relationships, not an exhaustive attachment atlas. */
export const thighAttachmentReference = {
  title: 'UAMS · lower-limb muscle anatomy',
  url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/',
};
export const thighAttachmentBones = {
  hip: ['FMA16586', 'FMA16587'],
  femur: ['FMA24474', 'FMA24475'],
  fibula: ['FMA24480', 'FMA24481'],
  tibia: ['FMA24477', 'FMA24478'],
  patella: ['FMA24486', 'FMA24487'],
} as const;
type Bone = keyof typeof thighAttachmentBones;
type Endpoint = {
  role: 'proximal' | 'distal' | 'continuation';
  bone: Bone;
  label: string;
  site: string;
};
type Relationship = {
  key: string;
  fmas: readonly [string, string];
  endpoints: readonly Endpoint[];
  note?: string;
};
const origin = (bone: Bone, site: string): Endpoint => ({
  role: 'proximal',
  bone,
  site,
  label: 'Proximal / origin',
});
const insertion = (bone: Bone, site: string): Endpoint => ({
  role: 'distal',
  bone,
  site,
  label: 'Distal / insertion',
});
const quadriceps: readonly Endpoint[] = [
  insertion('patella', 'Patella through quadriceps tendon.'),
  {
    role: 'continuation',
    bone: 'tibia',
    label: 'Extensor-chain continuation',
    site: 'Tibial tuberosity through patellar ligament; not direct muscle insertion.',
  },
];
const pes = insertion('tibia', 'Upper medial tibia, through pes anserinus.');
const biceps = insertion('fibula', 'Fibular head: principal bony attachment.');
const bicepsNote =
  'Secondary tibial slips and soft-tissue expansions are not exhaustively represented.';
export const thighAttachments: readonly Relationship[] = [
  {
    key: 'rectus-femoris',
    fmas: ['FMA38928', 'FMA38929'],
    endpoints: [
      origin('hip', 'Ilium: AIIS and supra-acetabular region.'),
      ...quadriceps,
    ],
  },
  {
    key: 'vastus-lateralis',
    fmas: ['FMA38930', 'FMA38931'],
    endpoints: [
      origin('femur', 'Proximal/lateral femur; lateral linea-aspera lip.'),
      ...quadriceps,
    ],
  },
  {
    key: 'vastus-medialis',
    fmas: ['FMA38932', 'FMA38933'],
    endpoints: [
      origin('femur', 'Medial linea-aspera lip; other origins not mapped.'),
      ...quadriceps,
    ],
  },
  {
    key: 'vastus-intermedius',
    fmas: ['FMA38934', 'FMA38935'],
    endpoints: [
      origin('femur', 'Anterior/lateral femoral shaft.'),
      ...quadriceps,
    ],
  },
  {
    key: 'biceps-long',
    fmas: ['FMA45888', 'FMA45889'],
    endpoints: [
      origin('hip', 'Ischial tuberosity; shared proximal tendon.'),
      biceps,
    ],
    note: bicepsNote,
  },
  {
    key: 'biceps-short',
    fmas: ['FMA45891', 'FMA45892'],
    endpoints: [origin('femur', 'Femur: lateral linea-aspera lip.'), biceps],
    note: bicepsNote,
  },
  {
    key: 'semimembranosus',
    fmas: ['FMA22448', 'FMA22449'],
    endpoints: [
      origin('hip', 'Ischial tuberosity, superolateral region.'),
      insertion('tibia', 'Posteromedial tibial condyle.'),
    ],
  },
  {
    key: 'semitendinosus',
    fmas: ['FMA22358', 'FMA22359'],
    endpoints: [origin('hip', 'Ischial tuberosity, inferomedial region.'), pes],
  },
  {
    key: 'sartorius',
    fmas: ['FMA22354', 'FMA22355'],
    endpoints: [origin('hip', 'Ilium: ASIS.'), pes],
  },
  {
    key: 'gracilis',
    fmas: ['FMA43883', 'FMA43884'],
    endpoints: [origin('hip', 'Pubic body/inferior ramus region.'), pes],
  },
];
