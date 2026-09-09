import type { ReasoningConcept } from './reasoning-questions';

// Original draft questions. Exact source selections include heads and groups;
// neither a muscle count nor individual segmentation is inferred from a group.
const university = [
  {
    title: 'TTUHSC upper-limb anatomy reference',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  },
];
export const handReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'hand-abductor-digiti-minimi',
    region: 'hand',
    bindings: [
      { fma: 'FMA37396', side: 'right', file: 'FJ1466' },
      { fma: 'FMA37397', side: 'left', file: 'FJ1466M' },
    ],
    prompt:
      'Which hypothenar muscle separates the little finger from its neighbours?',
    explanation: 'Abductor digiti minimi provides this spreading action.',
    distractors: [
      'hand-flexor-digiti-minimi-brevis',
      'hand-opponens-digiti-minimi',
      'hand-palmar-interossei',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-flexor-digiti-minimi-brevis',
    region: 'hand',
    bindings: [
      { fma: 'FMA37398', side: 'right', file: 'FJ1470' },
      { fma: 'FMA37399', side: 'left', file: 'FJ1470M' },
    ],
    prompt:
      'Which hamate-origin hypothenar muscle reaches a finger phalanx to help bend its knuckle?',
    explanation:
      'Flexor digiti minimi brevis contributes to little-finger metacarpophalangeal flexion. Its phalangeal attachment distinguishes it from the adjacent opponens.',
    distractors: [
      'hand-abductor-digiti-minimi',
      'hand-opponens-digiti-minimi',
      'hand-opponens-pollicis',
    ],
    references: [
      {
        title: 'Loyola University: flexor digiti minimi brevis',
        url: 'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/fdmh.htm',
      },
      ...university,
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-opponens-digiti-minimi',
    region: 'hand',
    bindings: [
      { fma: 'FMA37400', side: 'right', file: 'FJ1482' },
      { fma: 'FMA37401', side: 'left', file: 'FJ1482M' },
    ],
    prompt:
      'Which hypothenar muscle acts through the fifth metacarpal to support opposition?',
    explanation:
      'Opponens digiti minimi influences metacarpal positioning rather than attaching to a phalanx.',
    distractors: [
      'hand-flexor-digiti-minimi-brevis',
      'hand-abductor-digiti-minimi',
      'hand-opponens-pollicis',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-abductor-pollicis-brevis',
    region: 'hand',
    bindings: [
      { fma: 'FMA37386', side: 'right', file: 'FJ1483' },
      { fma: 'FMA37387', side: 'left', file: 'FJ1483M' },
    ],
    prompt: 'Which short thenar muscle lifts the thumb away from the palm?',
    explanation:
      'Abductor pollicis brevis contributes to palmar abduction. This is a movement distinction, not a diagnostic test for nerve injury.',
    distractors: [
      'hand-adductor-oblique',
      'hand-adductor-transverse',
      'hand-abductor-digiti-minimi',
    ],
    references: [
      {
        title: 'Skoff: abductor pollicis brevis and opposition',
        url: 'https://pubmed.ncbi.nlm.nih.gov/9604109/',
      },
    ],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-opponens-pollicis',
    region: 'hand',
    bindings: [
      { fma: 'FMA37390', side: 'right', file: 'FJ1501' },
      { fma: 'FMA37391', side: 'left', file: 'FJ1501M' },
    ],
    prompt:
      'Which thenar muscle acts through its first-metacarpal attachment to assist thumb opposition?',
    explanation: 'Opponens pollicis helps position the thumb across the palm.',
    distractors: [
      'hand-abductor-pollicis-brevis',
      'hand-adductor-oblique',
      'hand-adductor-transverse',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-adductor-oblique',
    region: 'hand',
    bindings: [
      { fma: 'FMA46121', side: 'right', file: 'FJ1481' },
      { fma: 'FMA46122', side: 'left', file: 'FJ1481M' },
    ],
    prompt:
      'Which adductor head has an origin involving the capitate and metacarpal bases?',
    explanation:
      'The oblique head differs from the third-metacarpal-shaft origin of its transverse partner.',
    distractors: [
      'hand-adductor-transverse',
      'hand-opponens-pollicis',
      'hand-abductor-pollicis-brevis',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-adductor-transverse',
    region: 'hand',
    bindings: [
      { fma: 'FMA46123', side: 'right', file: 'FJ1515' },
      { fma: 'FMA46124', side: 'left', file: 'FJ1515M' },
    ],
    prompt: 'Which adductor head arises from the third metacarpal shaft?',
    explanation:
      'The transverse head shares thumb adduction with its oblique partner.',
    distractors: [
      'hand-adductor-oblique',
      'hand-opponens-pollicis',
      'hand-abductor-pollicis-brevis',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-lumbricals',
    region: 'hand',
    bindings: [
      { fma: 'FMA42398', side: 'right', file: 'FJ1510' },
      { fma: 'FMA42399', side: 'left', file: 'FJ1510M' },
    ],
    prompt:
      'Which grouped selection arises from deep flexor tendons rather than metacarpal bone?',
    explanation:
      'The lumbrical set is grouped here; individual members cannot be selected separately.',
    distractors: [
      'hand-palmar-interossei',
      'hand-dorsal-interossei',
      'hand-flexor-digiti-minimi-brevis',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-palmar-interossei',
    region: 'hand',
    bindings: [
      { fma: 'FMA42402', side: 'right', file: 'FJ1511' },
      { fma: 'FMA42403', side: 'left', file: 'FJ1511M' },
    ],
    prompt:
      'Which interosseous set draws fingers towards the middle-finger axis?',
    explanation:
      'This is the palmar set; its mesh is not a validated count of individual muscles.',
    distractors: [
      'hand-dorsal-interossei',
      'hand-lumbricals',
      'hand-abductor-digiti-minimi',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'hand-dorsal-interossei',
    region: 'hand',
    bindings: [
      { fma: 'FMA42404', side: 'right', file: 'FJ1509' },
      { fma: 'FMA42405', side: 'left', file: 'FJ1509M' },
    ],
    prompt:
      'Which interosseous set spreads fingers away from the middle-finger axis?',
    explanation:
      'The dorsal set remains grouped, so this question does not identify a numbered interosseous.',
    distractors: [
      'hand-palmar-interossei',
      'hand-lumbricals',
      'hand-opponens-digiti-minimi',
    ],
    references: university,
    readiness: 'draft',
    revision: 1,
  },
];
