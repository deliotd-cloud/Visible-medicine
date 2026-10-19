import type { ReasoningConcept } from './reasoning-questions';

const source = (title: string, file: string) => [
  {
    title: `Loyola University: ${title}`,
    url: `https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/${file}.htm`,
  },
];
const university = [
  {
    title: 'UAMS: lower-limb muscle anatomy',
    url: 'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/',
  },
];

// Original draft questions. Source heads remain heads; a motor-supply fact is
// not evidence that the associated nerve or every tendon branch is rendered.
export const legReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'leg-tibialis-anterior',
    region: 'leg',
    bindings: [
      { fma: 'FMA22544', side: 'right', file: 'FJ1439' },
      { fma: 'FMA22545', side: 'left', file: 'FJ1439M' },
    ],
    prompt:
      'Which dorsiflexor also inverts the foot and reaches the medial cuneiform and first-metatarsal base?',
    explanation:
      'Tibialis anterior combines these actions with a medial-foot attachment. The long great-toe extensor reaches a phalanx instead.',
    distractors: [
      'leg-tibialis-posterior',
      'leg-extensor-hallucis-longus',
      'leg-fibularis-longus',
    ],
    references: [
      ...source('tibialis anterior', 'tiba'),
      ...source('extensor hallucis longus', 'exhl'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-tibialis-posterior',
    region: 'leg',
    bindings: [
      { fma: 'FMA65018', side: 'right', file: 'FJ1440' },
      { fma: 'FMA65019', side: 'left', file: 'FJ1440M' },
    ],
    prompt:
      'Which plantarflexing inverter has an important navicular attachment rather than a distal toe attachment?',
    explanation:
      'Tibialis posterior reaches the navicular region. Sharing inversion with tibialis anterior does not mean sharing its dorsiflexion action.',
    distractors: [
      'leg-tibialis-anterior',
      'leg-flexor-digitorum-longus',
      'leg-flexor-hallucis-longus',
    ],
    references: source('tibialis posterior', 'tibp'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-fibularis-longus',
    region: 'leg',
    bindings: [
      { fma: 'FMA22552', side: 'right', file: 'FJ1410' },
      { fma: 'FMA22553', side: 'left', file: 'FJ1410M' },
    ],
    prompt:
      'Which fibularis tendon crosses the sole towards the medial cuneiform and first metatarsal instead of ending at the fifth metatarsal?',
    explanation:
      'Fibularis longus follows this plantar route. Its medial endpoint does not make it an inverter: it contributes to eversion.',
    distractors: [
      'leg-fibularis-brevis',
      'leg-fibularis-tertius',
      'leg-tibialis-anterior',
    ],
    references: source('peroneus (fibularis) longus', 'perl'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-fibularis-brevis',
    region: 'leg',
    bindings: [
      { fma: 'FMA22554', side: 'right', file: 'FJ1409' },
      { fma: 'FMA22555', side: 'left', file: 'FJ1409M' },
    ],
    prompt:
      'Which superficial-fibular-nerve-supplied everter attaches at the fifth-metatarsal tuberosity?',
    explanation:
      'Fibularis brevis reaches this lateral attachment. Longus continues across the sole, while tertius has deep fibular supply.',
    distractors: [
      'leg-fibularis-longus',
      'leg-fibularis-tertius',
      'leg-tibialis-posterior',
    ],
    references: [
      ...source('peroneus (fibularis) brevis', 'perb'),
      ...source('peroneus tertius', 'pert'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-fibularis-tertius',
    region: 'leg',
    bindings: [
      { fma: 'FMA22550', side: 'right', file: 'FJ1411' },
      { fma: 'FMA22551', side: 'left', file: 'FJ1411M' },
    ],
    prompt:
      'Which fibularis muscle combines eversion with dorsiflexion and receives deep rather than superficial fibular nerve supply?',
    explanation:
      'Fibularis tertius differs from longus and brevis in this action-and-supply combination. Similar muscle names do not establish a shared motor branch.',
    distractors: [
      'leg-fibularis-longus',
      'leg-fibularis-brevis',
      'leg-tibialis-anterior',
    ],
    references: source('peroneus (fibularis) tertius', 'pert'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-extensor-digitorum-longus',
    region: 'leg',
    bindings: [
      { fma: 'FMA22548', side: 'right', file: 'FJ1406' },
      { fma: 'FMA22549', side: 'left', file: 'FJ1406M' },
    ],
    prompt:
      'Which long leg muscle extends the four lesser toes through their extensor expansions?',
    explanation:
      'Extensor digitorum longus serves the lesser toes. The supplied muscle remains one selection; this question does not assert separate selectable slips for each digit.',
    distractors: [
      'leg-extensor-hallucis-longus',
      'leg-flexor-digitorum-longus',
      'leg-fibularis-tertius',
    ],
    references: source('extensor digitorum longus', 'exdl'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-extensor-hallucis-longus',
    region: 'leg',
    bindings: [
      { fma: 'FMA22546', side: 'right', file: 'FJ1408' },
      { fma: 'FMA22547', side: 'left', file: 'FJ1408M' },
    ],
    prompt:
      'Which long extensor reaches the great toe\u2019s distal phalanx rather than the four lesser toes?',
    explanation:
      'Extensor hallucis longus extends the great toe. Flexor hallucis longus also reaches its distal phalanx, but acts in flexion.',
    distractors: [
      'leg-extensor-digitorum-longus',
      'leg-flexor-hallucis-longus',
      'leg-tibialis-anterior',
    ],
    references: [
      ...source('extensor hallucis longus', 'exhl'),
      ...source('flexor hallucis longus', 'fhl'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-flexor-digitorum-longus',
    region: 'leg',
    bindings: [
      { fma: 'FMA65016', side: 'right', file: 'FJ1414' },
      { fma: 'FMA65017', side: 'left', file: 'FJ1414M' },
    ],
    prompt:
      'Which deep long flexor reaches the distal phalanges of the four lesser toes?',
    explanation:
      'Flexor digitorum longus acts on the lesser toes. Its counterpart named hallucis targets the great toe; digitorum alone does not distinguish flexion from extension.',
    distractors: [
      'leg-flexor-hallucis-longus',
      'leg-extensor-digitorum-longus',
      'leg-tibialis-posterior',
    ],
    references: source('flexor digitorum longus', 'fdl'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-flexor-hallucis-longus',
    region: 'leg',
    bindings: [
      { fma: 'FMA65014', side: 'right', file: 'FJ1415' },
      { fma: 'FMA65015', side: 'left', file: 'FJ1415M' },
    ],
    prompt:
      'Which long flexor starts on the posterior fibula and reaches the great toe\u2019s distal phalanx?',
    explanation:
      'Flexor hallucis longus follows this route. The distal attachment helps distinguish it from shorter intrinsic great-toe flexors that end more proximally.',
    distractors: [
      'leg-flexor-digitorum-longus',
      'leg-extensor-hallucis-longus',
      'leg-tibialis-posterior',
    ],
    references: source('flexor hallucis longus', 'fhl'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-soleus',
    region: 'leg',
    bindings: [
      { fma: 'FMA22558', side: 'right', file: 'FJ1437' },
      { fma: 'FMA22559', side: 'left', file: 'FJ1437M' },
    ],
    prompt:
      'Which calcaneal-tendon plantarflexor begins below the knee on tibia and fibula, unlike the femoral-origin gastrocnemius heads?',
    explanation:
      'Soleus does not span the knee. Its calcaneal-tendon contribution therefore does not imply the same joint-spanning route as gastrocnemius.',
    distractors: [
      'leg-gastrocnemius-medial',
      'leg-gastrocnemius-lateral',
      'leg-plantaris',
    ],
    references: source('soleus', 'sole'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-popliteus',
    region: 'leg',
    bindings: [
      { fma: 'FMA22591', side: 'right', file: 'FJ1430' },
      { fma: 'FMA22592', side: 'left', file: 'FJ1430M' },
    ],
    prompt:
      'Which muscle links the lateral femoral condyle to the posterior proximal tibia and helps unlock the extended knee?',
    explanation:
      'Popliteus acts at the knee rather than continuing to the heel. With the foot planted, its unlocking action includes lateral rotation of the femur on the tibia.',
    distractors: ['leg-plantaris', 'leg-gastrocnemius-lateral', 'leg-soleus'],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-plantaris',
    region: 'leg',
    bindings: [
      { fma: 'FMA22560', side: 'right', file: 'FJ1429' },
      { fma: 'FMA22561', side: 'left', file: 'FJ1429M' },
    ],
    prompt:
      'Which muscle begins above the lateral gastrocnemius origin and follows a long slender tendon towards the heel?',
    explanation:
      'Plantaris follows this long course. Unlike popliteus, it continues past the knee towards the calcaneal region; the model does not establish every tendon variant.',
    distractors: ['leg-popliteus', 'leg-soleus', 'leg-fibularis-brevis'],
    references: [...university, ...source('plantaris', 'plnt')],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-gastrocnemius-medial',
    region: 'leg',
    bindings: [
      { fma: 'FMA45957', side: 'right', file: 'FJ1397' },
      { fma: 'FMA45958', side: 'left', file: 'FJ1397M' },
    ],
    prompt:
      'Which gastrocnemius head starts on the posterior femur above the medial condyle?',
    explanation:
      'The medial head is selected, not the whole gastrocnemius. Both heads contribute to the calcaneal tendon, so that shared distal route cannot identify the head.',
    distractors: ['leg-gastrocnemius-lateral', 'leg-soleus', 'leg-plantaris'],
    references: source('gastrocnemius', 'gast'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'leg-gastrocnemius-lateral',
    region: 'leg',
    bindings: [
      { fma: 'FMA45960', side: 'right', file: 'FJ1394' },
      { fma: 'FMA45961', side: 'left', file: 'FJ1394M' },
    ],
    prompt:
      'Which gastrocnemius head attaches around the lateral femoral condyle before joining the calf\u2019s calcaneal-tendon route?',
    explanation:
      'The lateral head shares plantarflexion and knee-flexion roles with its medial partner. The proximal side-specific attachment distinguishes the two source selections.',
    distractors: ['leg-gastrocnemius-medial', 'leg-soleus', 'leg-popliteus'],
    references: source('gastrocnemius', 'gast'),
    readiness: 'draft',
    revision: 1,
  },
];
