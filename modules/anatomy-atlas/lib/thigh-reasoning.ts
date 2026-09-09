import type { ReasoningConcept } from './reasoning-questions';

// Original, source-bound draft questions. Anatomical facts do not validate the
// delivery mesh, a missing nerve, or an independently selectable subcompartment.
const university = [
  {
    title: 'UAMS: lower-limb muscle anatomy',
    url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/',
  },
];
const uw = (name: string, slug: string) => [
  {
    title: `University of Washington: ${name}`,
    url: `https://rad.uw.edu/muscle-atlas/${slug}`,
  },
];

export const thighReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'thigh-rectus-femoris',
    region: 'thigh',
    bindings: [
      { fma: 'FMA38928', side: 'right', file: 'FJ1433' },
      { fma: 'FMA38929', side: 'left', file: 'FJ1433M' },
    ],
    prompt: 'Which quadriceps component crosses the hip as well as the knee?',
    explanation:
      'Rectus femoris can extend the knee and flex the hip. Vastus intermedius starts on the femur and does not cross the hip.',
    distractors: [
      'thigh-vastus-intermedius',
      'thigh-sartorius',
      'thigh-biceps-long-head',
    ],
    references: [...university, ...uw('rectus femoris', 'rectus-femoris')],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-vastus-intermedius',
    region: 'thigh',
    bindings: [
      { fma: 'FMA38934', side: 'right', file: 'FJ1441' },
      { fma: 'FMA38935', side: 'left', file: 'FJ1441M' },
    ],
    prompt:
      'Which quadriceps component starts on the anterior/lateral femoral shaft and feeds the deep quadriceps tendon?',
    explanation:
      'Vastus intermedius contributes to knee extension through this deep route. Its supplied surface does not establish a separately validated tendon layer.',
    distractors: [
      'thigh-rectus-femoris',
      'thigh-biceps-short-head',
      'thigh-semimembranosus',
    ],
    references: uw('vastus intermedius', 'vastus-intermedius'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-sartorius',
    region: 'thigh',
    bindings: [
      { fma: 'FMA22354', side: 'right', file: 'FJ1434' },
      { fma: 'FMA22355', side: 'left', file: 'FJ1434M' },
    ],
    prompt:
      'Which muscle travels from the anterior superior iliac spine to the medial proximal tibia, crossing both hip and knee?',
    explanation:
      'Sartorius takes this oblique route. Gracilis starts at the pubis; semitendinosus starts at the ischium.',
    distractors: [
      'thigh-gracilis',
      'thigh-semitendinosus',
      'thigh-rectus-femoris',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-gracilis',
    region: 'thigh',
    bindings: [
      { fma: 'FMA43883', side: 'right', file: 'FJ1421' },
      { fma: 'FMA43884', side: 'left', file: 'FJ1421M' },
    ],
    prompt:
      'Which pubis-origin muscle adducts the thigh and reaches the pes anserinus beyond the knee?',
    explanation:
      'Gracilis links the pubis to the medial tibia. Sartorius and semitendinosus share the pes insertion region, but not that origin.',
    distractors: [
      'thigh-sartorius',
      'thigh-semitendinosus',
      'thigh-adductor-longus',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-adductor-longus',
    region: 'thigh',
    bindings: [
      { fma: 'FMA22456', side: 'right', file: 'FJ1402' },
      { fma: 'FMA22457', side: 'left', file: 'FJ1402M' },
    ],
    prompt:
      'Which adductor attaches from the pubic body to the middle third of the linea aspera, without crossing the knee?',
    explanation:
      'Adductor longus ends on the femur rather than the tibia. This distinguishes its attachment route from gracilis, despite both contributing to thigh adduction.',
    distractors: ['thigh-gracilis', 'thigh-sartorius', 'thigh-semitendinosus'],
    references: uw('adductor longus', 'adductor-longus'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-adductor-magnus',
    region: 'thigh',
    bindings: [
      { fma: 'FMA22459', side: 'right', file: 'FJ1403' },
      { fma: 'FMA22460', side: 'left', file: 'FJ1403M' },
    ],
    prompt:
      'Which adductor includes an ischial, hip-extending portion with tibial-division supply, unlike its obturator-supplied portion?',
    explanation:
      'Adductor magnus has functionally distinct portions. This question selects the supplied muscle surface; it does not create separate portion meshes or display their nerves.',
    distractors: [
      'thigh-adductor-longus',
      'thigh-gracilis',
      'thigh-gluteus-maximus',
    ],
    references: uw('adductor magnus', 'adductor-magnus'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-semitendinosus',
    region: 'thigh',
    bindings: [
      { fma: 'FMA22358', side: 'right', file: 'FJ1436' },
      { fma: 'FMA22359', side: 'left', file: 'FJ1436M' },
    ],
    prompt:
      'Which ischial-origin hamstring reaches the pes anserinus instead of the fibular head or posterior medial tibial condyle?',
    explanation:
      'Semitendinosus reaches the medial tibial shaft. Semimembranosus has a condylar attachment; biceps femoris primarily reaches the fibular head.',
    distractors: [
      'thigh-semimembranosus',
      'thigh-biceps-long-head',
      'thigh-biceps-short-head',
    ],
    references: [...university, ...uw('semitendinosus', 'semitendinosus')],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-semimembranosus',
    region: 'thigh',
    bindings: [
      { fma: 'FMA22448', side: 'right', file: 'FJ1435' },
      { fma: 'FMA22449', side: 'left', file: 'FJ1435M' },
    ],
    prompt:
      'Which medial hamstring attaches to the back of the medial tibial condyle rather than the pes anserinus?',
    explanation:
      'Semimembranosus follows this condylar route. It assists hip extension and knee flexion, so action alone does not distinguish it from semitendinosus.',
    distractors: ['thigh-semitendinosus', 'thigh-gracilis', 'thigh-sartorius'],
    references: uw('semimembranosus', 'semimembranosus'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-biceps-long-head',
    region: 'thigh',
    bindings: [
      { fma: 'FMA45888', side: 'right', file: 'FJ1395' },
      { fma: 'FMA45889', side: 'left', file: 'FJ1395M' },
    ],
    prompt:
      'Which biceps femoris head begins at the ischium and can contribute to both hip extension and knee flexion?',
    explanation:
      'The long head crosses both joints and has tibial-division supply. Its short partner begins on the femur and does not cross the hip.',
    distractors: [
      'thigh-biceps-short-head',
      'thigh-semitendinosus',
      'thigh-semimembranosus',
    ],
    references: uw('biceps femoris long head', 'biceps-femoris-long-head'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-biceps-short-head',
    region: 'thigh',
    bindings: [
      { fma: 'FMA45891', side: 'right', file: 'FJ1444' },
      { fma: 'FMA45892', side: 'left', file: 'FJ1444M' },
    ],
    prompt:
      'Which posterior-thigh head starts on the femur and has common fibular-division supply rather than tibial-division supply?',
    explanation:
      'The short biceps femoris head flexes the knee without spanning the hip. This is a head-specific distinction, not a rule for the entire biceps muscle.',
    distractors: [
      'thigh-biceps-long-head',
      'thigh-semitendinosus',
      'thigh-semimembranosus',
    ],
    references: uw('biceps femoris short head', 'biceps-femoris-short-head'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-gluteus-maximus',
    region: 'thigh',
    sourceRegions: ['thigh', 'pelvis'],
    bindings: [
      { fma: 'FMA22328', side: 'right', file: 'FJ1418' },
      { fma: 'FMA22329', side: 'left', file: 'FJ1418M' },
    ],
    prompt:
      'Which gluteal muscle combines a major hip-extensor role with inferior gluteal nerve supply?',
    explanation:
      'Gluteus maximus is supplied by the inferior gluteal nerve. Gluteus medius has superior gluteal supply; the shared word gluteal does not imply the same nerve.',
    distractors: [
      'thigh-gluteus-medius',
      'thigh-adductor-magnus',
      'thigh-biceps-long-head',
    ],
    references: [
      ...uw('gluteus maximus', 'gluteus-maximus'),
      ...uw('gluteus medius', 'gluteus-medius'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'thigh-gluteus-medius',
    region: 'thigh',
    sourceRegions: ['thigh', 'pelvis'],
    bindings: [
      { fma: 'FMA22330', side: 'right', file: 'FJ1419' },
      { fma: 'FMA22331', side: 'left', file: 'FJ1419M' },
    ],
    prompt:
      'Which listed muscle is a major hip abductor attaching to the greater trochanter and supplied by the superior gluteal nerve?',
    explanation:
      'Gluteus medius meets this combined clue. Hip abduction is shared with other muscles; the question distinguishes the displayed alternatives, not an exclusive action.',
    distractors: [
      'thigh-gluteus-maximus',
      'thigh-adductor-longus',
      'thigh-rectus-femoris',
    ],
    references: uw('gluteus medius', 'gluteus-medius'),
    readiness: 'draft',
    revision: 1,
  },
];
