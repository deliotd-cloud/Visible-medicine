import type { ReasoningConcept } from './reasoning-questions';

const source = (title: string, file: string) => [
  {
    title: `Loyola University: ${title}`,
    url: `https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/${file}.htm`,
  },
];
// Original draft teaching. Source aliases and heads stay explicit; no individual
// toe slip, sesamoid identity, nerve or additional segmentation is inferred.
export const footReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'foot-abductor-hallucis',
    region: 'foot',
    bindings: [
      { fma: 'FMA37459', side: 'right', file: 'FJ1400' },
      { fma: 'FMA37460', side: 'left', file: 'FJ1400M' },
    ],
    prompt:
      'Which calcaneal-origin intrinsic abducts the great toe and reaches the medial side of its proximal phalanx?',
    explanation:
      'Abductor hallucis follows this medial route. The two adductor hallucis heads approach the lateral side and should not be confused with it.',
    distractors: [
      'foot-adductor-hallucis-oblique',
      'foot-adductor-hallucis-transverse',
      'foot-abductor-digiti-minimi',
    ],
    references: [
      ...source('abductor hallucis', 'abhf'),
      ...source('adductor hallucis', 'adhf'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'foot-abductor-digiti-minimi',
    region: 'foot',
    bindings: [
      { fma: 'FMA37463', side: 'right', file: 'FJ1390' },
      { fma: 'FMA37464', side: 'left', file: 'FJ1390M' },
    ],
    prompt:
      'Which intrinsic starts at the calcaneus and can abduct the little toe as well as flex it?',
    explanation:
      'Abductor digiti minimi of the foot combines these roles. The short little-toe flexor starts near the fifth-metatarsal base instead.',
    distractors: [
      'foot-flexor-digiti-minimi-brevis',
      'foot-abductor-hallucis',
      'foot-flexor-digitorum-brevis',
    ],
    references: source('abductor digiti minimi of foot', 'admf'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'foot-flexor-digiti-minimi-brevis',
    region: 'foot',
    bindings: [
      { fma: 'FMA37471', side: 'right', file: 'FJ1391' },
      { fma: 'FMA37472', side: 'left', file: 'FJ1391M' },
    ],
    prompt:
      'Which short little-toe flexor starts at the fifth-metatarsal base rather than the calcaneus?',
    explanation:
      'Flexor digiti minimi brevis reaches the little toe\u2019s proximal phalanx. Its origin distinguishes it from the calcaneal-origin abductor of the same digit.',
    distractors: [
      'foot-abductor-digiti-minimi',
      'foot-flexor-digitorum-brevis',
      'foot-quadratus-plantae',
    ],
    references: source('flexor digiti minimi brevis of foot', 'fdmf'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'foot-flexor-digitorum-brevis',
    region: 'foot',
    bindings: [
      { fma: 'FMA37461', side: 'right', file: 'FJ1413' },
      { fma: 'FMA37462', side: 'left', file: 'FJ1413M' },
    ],
    prompt:
      'Which short intrinsic flexor reaches the middle phalanges of the four lesser toes, allowing the long flexor tendons to pass through its divided tendons?',
    explanation:
      'Flexor digitorum brevis has this middle-phalangeal route. The supplied muscle remains one selection; individual tendon slips are not made selectable by this question.',
    distractors: [
      'foot-quadratus-plantae',
      'foot-flexor-digiti-minimi-brevis',
      'foot-extensor-hallucis-brevis',
    ],
    references: source('flexor digitorum brevis', 'fdbf'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'foot-quadratus-plantae',
    region: 'foot',
    bindings: [
      { fma: 'FMA37465', side: 'right', file: 'FJ1412' },
      { fma: 'FMA37466', side: 'left', file: 'FJ1412M' },
    ],
    prompt:
      'Which calcaneal-origin intrinsic joins the long digital flexor tendons rather than attaching directly to a phalanx?',
    explanation:
      'Quadratus plantae is displayed under its retained source name, flexor accessorius. Its two anatomical heads are not separate source selections here.',
    distractors: [
      'foot-flexor-digitorum-brevis',
      'foot-abductor-digiti-minimi',
      'foot-abductor-hallucis',
    ],
    references: [
      ...source('quadratus plantae', 'qp'),
      {
        title:
          'FIPAT Terminologia Anatomica: quadratus plantae / flexor accessorius',
        url: 'https://anatomy.ttuhscep.edu/AnatomicalTerminology/TA2.pdf',
      },
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'foot-extensor-hallucis-brevis',
    region: 'foot',
    bindings: [
      { fma: 'FMA51144', side: 'right', file: 'FJ1407' },
      { fma: 'FMA51145', side: 'left', file: 'FJ1407M' },
    ],
    prompt:
      'Which short great-toe extensor starts at the calcaneus and ends on the proximal phalanx?',
    explanation:
      'Extensor hallucis brevis has this proximal-phalangeal attachment. The long extensor reaches the distal phalanx, so the two should not be treated as interchangeable.',
    distractors: [
      'foot-abductor-hallucis',
      'foot-quadratus-plantae',
      'foot-flexor-digitorum-brevis',
    ],
    references: [
      ...source('extensor hallucis brevis', 'ehb'),
      ...source('extensor hallucis longus', 'exhl'),
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'foot-adductor-hallucis-oblique',
    region: 'foot',
    bindings: [
      { fma: 'FMA46018', side: 'right', file: 'FJ1398' },
      { fma: 'FMA46019', side: 'left', file: 'FJ1398M' },
    ],
    prompt:
      'Which adductor hallucis head has origins involving the bases of metatarsals two to four?',
    explanation:
      'The oblique head differs from the ligament-related origin of its transverse partner. This selects a source head, not the entire adductor muscle.',
    distractors: [
      'foot-adductor-hallucis-transverse',
      'foot-abductor-hallucis',
      'foot-flexor-digitorum-brevis',
    ],
    references: source('adductor hallucis', 'adhf'),
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'foot-adductor-hallucis-transverse',
    region: 'foot',
    bindings: [
      { fma: 'FMA46020', side: 'right', file: 'FJ1445' },
      { fma: 'FMA46021', side: 'left', file: 'FJ1445M' },
    ],
    prompt:
      'Which adductor hallucis head arises from plantar metatarsal and deep transverse ligament structures rather than the metatarsal bases?',
    explanation:
      'The transverse head shares great-toe adduction with its oblique partner. Their different origin patterns, rather than that common action, distinguish the heads.',
    distractors: [
      'foot-adductor-hallucis-oblique',
      'foot-abductor-hallucis',
      'foot-flexor-digiti-minimi-brevis',
    ],
    references: source('adductor hallucis', 'adhf'),
    readiness: 'draft',
    revision: 1,
  },
];
