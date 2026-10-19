// Original educational prose. References are reading links, not licensed image assets.
export const hipImagingGroups = {
  iliopsoas: ['FMA22322', 'FMA22323', 'FMA22342', 'FMA22343'],
  abductors: ['FMA22330', 'FMA22331', 'FMA22332', 'FMA22333'],
  rectus: ['FMA38928', 'FMA38929'],
  adductors: [
    'FMA22452',
    'FMA22454',
    'FMA22456',
    'FMA22457',
    'FMA22459',
    'FMA22460',
    'FMA43883',
    'FMA43884',
  ],
  hamstrings: [
    'FMA45888',
    'FMA45889',
    'FMA22448',
    'FMA22449',
    'FMA22358',
    'FMA22359',
  ],
  quadratus: ['FMA22338', 'FMA22339'],
} as const;
export type HipImagingGroup = keyof typeof hipImagingGroups;
export type HipImagingModality = 'ct' | 'mri' | 'ultrasound';
export const hipImagingReferences = {
  hipUS: 'https://www.essr.org/content-essr/uploads/2016/10/hip.pdf',
  tendons: 'https://pubs.rsna.org/doi/full/10.1148/rg.220055',
  hamstrings: 'https://pubs.rsna.org/doi/10.1148/rg.240061',
  rectus: 'https://archive.rsna.org/2004/4412390.html',
  trochanter: 'https://pubmed.ncbi.nlm.nih.gov/11687692/',
  quadratus: 'https://pubmed.ncbi.nlm.nih.gov/19542413/',
  mri: 'https://www.radiologyinfo.org/en/info/muscmr',
  ultrasound: 'https://www.radiologyinfo.org/en/info/musculous',
} as const;
type Reference = keyof typeof hipImagingReferences;
type Topic = {
  body: string;
  bullets: readonly string[];
  references: readonly Reference[];
};
const topic = (
  body: string,
  bullets: readonly string[],
  ...references: Reference[]
): Topic => ({ body, bullets, references });

// Shared regional concepts are counted once, not as a new lesson per side.
export const hipImagingTopics: Record<
  HipImagingGroup,
  Record<HipImagingModality, Topic>
> = {
  iliopsoas: {
    ct: topic(
      'Use the iliac wing, anterior hip and lesser trochanter as landmarks for the iliopsoas region.',
      [
        'Compare the assembled source with sequential patient sections; a muscle can change shape substantially along its length.',
        'CT can show bone and mineralization near an attachment. It does not replace detailed tendon assessment with MRI or ultrasound.',
      ],
      'tendons',
    ),
    mri: topic(
      'Trace iliacus and psoas major separately towards their distal attachment apparatus; a shared destination does not make them one muscle.',
      [
        'Their distal anatomy can include separate tendinous and muscular contributions. A cleft is not automatically a tear.',
        'Compare acquired anatomy and fluid-sensitive images before interpreting an apparent abnormality. The source has no internal tendon signal or bursal-fluid measurement.',
      ],
      'tendons',
      'mri',
    ),
    ultrasound: topic(
      'The anterior hip offers a window onto the iliopsoas, lateral to the femoral neurovascular structures.',
      [
        'Look for the tendon deep within the muscle and distinguish the bursa beneath it from the tendon itself.',
        'Real-time ultrasound can assess movement. Rotating or exploding this static model is not a dynamic snapping-hip examination.',
      ],
      'hipUS',
      'ultrasound',
    ),
  },
  abductors: {
    ct: topic(
      'Start with the greater trochanter when orienting the lateral hip; do not confuse it with the medially placed lesser trochanter.',
      [
        'Use CT bone detail to locate the attachment region, not to declare the selected abductor tendon intact.',
        'No tendon footprint, avulsed fragment or calcific deposit is independently labelled by this muscle selection.',
      ],
      'tendons',
    ),
    mri: topic(
      'Follow gluteus medius and minimus to their different attachments around the greater trochanter.',
      [
        'Medius reaches lateral and superior-posterior facets; minimus attaches anteriorly. Nearby bursae are separate structures.',
        'MRI can assess the tendon and surrounding muscle. The atlas cannot demonstrate a tear, fatty change or bursitis from its surface colour.',
      ],
      'trochanter',
      'mri',
    ),
    ultrasound: topic(
      'At the lateral hip, gluteus medius is superficial to gluteus minimus.',
      [
        'Follow each muscle towards its tendon in long and short axes; do not swap the anterior minimus attachment for the medius tendon.',
        'Non-visualization of a normal collapsed bursa does not mean that the bursa is anatomically absent.',
      ],
      'hipUS',
      'trochanter',
    ),
  },
  rectus: {
    ct: topic(
      'Distinguish the anterior inferior iliac spine from the anterior superior iliac spine when locating proximal rectus femoris.',
      [
        'CT can help characterize nearby bone or ossification, but the displayed muscle surface is not an avulsion fragment.',
        'This adult source cannot establish an adolescent apophyseal injury or demonstrate an open growth plate.',
      ],
      'rectus',
      'tendons',
    ),
    mri: topic(
      'Rectus femoris has proximal direct and indirect tendon contributions; the indirect contribution continues deeply into the muscle.',
      [
        'Trace from the anterior inferior iliac spine and supra-acetabular region into the thigh across more than one plane.',
        'Injury can involve the internal musculotendinous junction, not just the outer muscle margin. The selected mesh does not segment those internal contributions.',
      ],
      'rectus',
    ),
    ultrasound: topic(
      'The direct rectus femoris tendon can be oriented from the anterior inferior iliac spine.',
      [
        'Follow the muscle distally and recognize its central aponeurotic region; the proximal indirect component is not equally easy to see.',
        'The single source selection is not separate direct-head, indirect-head and intramuscular-tendon imaging.',
      ],
      'hipUS',
      'tendons',
    ),
  },
  adductors: {
    ct: topic(
      'Orient the medial thigh using the pubic region and femur, keeping each selected muscle distinct.',
      [
        'Adductor longus, brevis and magnus do not share one complete attachment footprint; gracilis continues beyond the knee.',
        'CT depiction of bone or mineralization near the pubis does not establish the condition of the rectus–adductor aponeurotic tissues.',
      ],
      'tendons',
    ),
    mri: topic(
      'Assess the selected adductor as part of the medial-thigh layers rather than treating every groin abnormality as adductor longus disease.',
      [
        'Relate muscle and tendon findings to their exact attachment and the adjacent pubic region.',
        'An isolated source surface contains neither the complete rectus–adductor aponeurotic complex nor an MR assessment of the pubic marrow.',
      ],
      'tendons',
      'mri',
    ),
    ultrasound: topic(
      'The proximal medial thigh has superficial longus/gracilis, intermediate brevis and deeper magnus layers.',
      [
        'Confirm the selected layer in transverse views, then follow its own course longitudinally.',
        'Changing probe angle can change tendon brightness. A dark region alone does not establish a tear; the atlas cannot reproduce anisotropy.',
      ],
      'hipUS',
      'tendons',
    ),
  },
  hamstrings: {
    ct: topic(
      'Use the ischial tuberosity to orient the proximal hamstring attachment region.',
      [
        'CT can characterize a bony attachment injury, but absence of a visible bone fragment does not exclude a tendon injury.',
        'These whole source muscles are not avulsed fragments; Explode is not tendon retraction or a displacement measurement.',
      ],
      'tendons',
      'hamstrings',
    ),
    mri: topic(
      'The long head of biceps femoris and semitendinosus share a proximal conjoint tendon; semimembranosus has a distinct origin.',
      [
        'Follow the proximal attachment, internal muscle–connective tissue junctions and distal course. Fluid-sensitive MRI can reveal oedema beyond an apparent surface defect.',
        'Oedema does not by itself prove fibre disruption, and an image finding alone does not determine readiness to return to sport.',
      ],
      'hamstrings',
    ),
    ultrasound: topic(
      'Locate the ischial tuberosity and follow the proximal hamstring tendons into the posterior thigh.',
      [
        'Depth and the close proximal tendon relationships can limit confident separation. Do not infer one-to-one sonographic boundaries from the mesh labels.',
        'A limited ultrasound window is not exclusion of proximal injury; comparison with MRI and clinical assessment may be needed.',
      ],
      'hamstrings',
      'ultrasound',
    ),
  },
  quadratus: {
    ct: topic(
      'Orient quadratus femoris between the ischial region and proximal femur.',
      [
        'Use bone landmarks for location; this source is not a patient-specific ischiofemoral distance measurement.',
        'Explode deliberately changes spacing and must never be used to infer or exclude impingement.',
      ],
      'quadratus',
    ),
    mri: topic(
      'Quadratus femoris is a deep posterior-hip muscle considered during assessment of the ischiofemoral region.',
      [
        'MRI studies describe muscle signal abnormalities together with narrowing in symptomatic patients; model spacing alone is not a diagnosis.',
        'The source does not supply patient symptoms, position, muscle oedema or a validated diagnostic threshold.',
      ],
      'quadratus',
    ),
    ultrasound: topic(
      'A deep muscle selection is not a guarantee of a complete ultrasound window.',
      [
        'Bone and tissue depth can limit ultrasound access. Hiding overlying meshes does not remove those acoustic constraints in a patient.',
        'Use the selected muscle for spatial orientation only; no probe route, injection target or diagnostic exclusion is supplied.',
      ],
      'ultrasound',
    ),
  },
};

export const hipImagingSelectionNotes: readonly {
  fmaIds: readonly string[];
  note: string;
}[] = [
  {
    fmaIds: ['FMA22322', 'FMA22323'],
    note: 'Selected: iliacus, not the whole iliopsoas complex. Psoas major is a separate source muscle.',
  },
  {
    fmaIds: ['FMA22342', 'FMA22343'],
    note: 'Selected: psoas major, not iliacus or psoas minor. The whole course is not contained in one hip slice.',
  },
  {
    fmaIds: ['FMA22330', 'FMA22331'],
    note: 'Selected: gluteus medius. Its distinct attachment facets are not separate selectable tendon surfaces.',
  },
  {
    fmaIds: ['FMA22332', 'FMA22333'],
    note: 'Selected: gluteus minimus. Keep its deeper position distinct from gluteus medius.',
  },
  {
    fmaIds: ['FMA38928', 'FMA38929'],
    note: 'Selected: whole rectus femoris; its direct and indirect contributions are not separately modelled.',
  },
  {
    fmaIds: ['FMA22452', 'FMA22454'],
    note: 'Selected: adductor brevis, not the superficial adductor longus.',
  },
  {
    fmaIds: ['FMA22456', 'FMA22457'],
    note: 'Selected: adductor longus; do not apply its proximal attachment description to every medial-thigh muscle.',
  },
  {
    fmaIds: ['FMA22459', 'FMA22460'],
    note: 'Selected: adductor magnus. Its adductor and hamstring portions are not independent source selections here.',
  },
  {
    fmaIds: ['FMA43883', 'FMA43884'],
    note: 'Selected: gracilis. Its distal pes-anserine attachment is outside this proximal-hip teaching focus.',
  },
  {
    fmaIds: ['FMA45888', 'FMA45889'],
    note: 'Selected: long head of biceps femoris. The short head does not arise from the ischial tuberosity and is not included in this proximal group.',
  },
  {
    fmaIds: ['FMA22448', 'FMA22449'],
    note: 'Selected: semimembranosus, not the semitendinosus–biceps conjoint tendon.',
  },
  {
    fmaIds: ['FMA22358', 'FMA22359'],
    note: 'Selected: semitendinosus. Its shared proximal tendon does not make it the same muscle as biceps femoris.',
  },
  {
    fmaIds: ['FMA22338', 'FMA22339'],
    note: 'Selected: quadratus femoris, not quadratus lumborum or a quadriceps muscle.',
  },
];
