import type { ReasoningConcept } from './reasoning-questions';

// Original short teaching questions, not imported publisher questions or media.
// Facts checked 2026-09-09. Every entry remains an educator-review draft.
const references = [
  {
    title: 'TTUHSC upper-limb anatomy reference',
    url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
  },
];
export const forearmReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'pronator-quadratus',
    region: 'forearm',
    bindings: [
      { fma: 'FMA38454', side: 'right', file: 'FJ1503' },
      { fma: 'FMA38455', side: 'left', file: 'FJ1503M' },
    ],
    prompt:
      'Which deep muscle links the distal forearm bones and contributes to pronation?',
    explanation:
      'Pronator quadratus spans distal ulna and radius. Supinator instead acts proximally to turn the forearm in the opposite direction.',
    distractors: ['supinator', 'brachioradialis', 'flexor-carpi-radialis'],
    references,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'supinator',
    region: 'forearm',
    bindings: [
      { fma: 'FMA38513', side: 'right', file: 'FJ1505' },
      { fma: 'FMA38514', side: 'left', file: 'FJ1505M' },
    ],
    prompt:
      'Which muscle combines proximal radial attachment with a primary role in forearm supination?',
    explanation:
      'Supinator fits both clues. Brachioradialis chiefly bends the elbow; pronator quadratus contributes to the opposing rotation.',
    distractors: [
      'pronator-quadratus',
      'brachioradialis',
      'extensor-carpi-radialis-longus',
    ],
    references,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'brachioradialis',
    region: 'forearm',
    bindings: [
      { fma: 'FMA38486', side: 'right', file: 'FJ1487' },
      { fma: 'FMA38487', side: 'left', file: 'FJ1487M' },
    ],
    prompt:
      'Which radial-innervated muscle primarily bends the elbow rather than extending the wrist?',
    explanation:
      'Brachioradialis is an elbow flexor despite its radial innervation. Nerve identity alone does not determine joint action.',
    distractors: [
      'extensor-carpi-radialis-longus',
      'supinator',
      'flexor-carpi-radialis',
    ],
    references,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'extensor-carpi-radialis-longus',
    region: 'forearm',
    bindings: [
      { fma: 'FMA38495', side: 'right', file: 'FJ1490' },
      { fma: 'FMA38496', side: 'left', file: 'FJ1490M' },
    ],
    prompt:
      'Which option helps extend the wrist and deviates it towards the thumb side?',
    explanation:
      'Extensor carpi radialis longus combines these actions. Flexor carpi radialis shares radial deviation but contributes to flexion.',
    distractors: [
      'flexor-carpi-radialis',
      'brachioradialis',
      'flexor-pollicis-longus',
    ],
    references,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'flexor-carpi-radialis',
    region: 'forearm',
    bindings: [
      { fma: 'FMA38460', side: 'right', file: 'FJ1496' },
      { fma: 'FMA38461', side: 'left', file: 'FJ1496M' },
    ],
    prompt:
      'Which option flexes the wrist while also contributing to radial deviation?',
    explanation:
      'Flexor carpi radialis provides this combination; the radial wrist extensor contributes to extension instead.',
    distractors: [
      'extensor-carpi-radialis-longus',
      'flexor-pollicis-longus',
      'pronator-quadratus',
    ],
    references,
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'flexor-pollicis-longus',
    region: 'forearm',
    bindings: [
      { fma: 'FMA38482', side: 'right', file: 'FJ1498' },
      { fma: 'FMA38484', side: 'left', file: 'FJ1498M' },
    ],
    prompt:
      'Which forearm muscle reaches the terminal thumb bone and bends its interphalangeal joint?',
    explanation:
      'Flexor pollicis longus reaches the distal phalanx. Flexor carpi radialis acts at the wrist instead.',
    distractors: [
      'flexor-carpi-radialis',
      'extensor-carpi-radialis-longus',
      'pronator-quadratus',
    ],
    references,
    readiness: 'draft',
    revision: 1,
  },
];
