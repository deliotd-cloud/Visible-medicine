import type { ReasoningConcept } from './reasoning-questions';

// Original brief factual questions; no source tables, illustrations or question
// banks are reproduced. Existing ISA muscle surfaces only; review remains pending.
const reference = {
  title: 'Texas Tech University Health Sciences Center El Paso · upper-limb muscles',
  url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
};
const pair = (right: string, left: string, file: string) => [
  { fma: right, side: 'right' as const, file },
  { fma: left, side: 'left' as const, file: `${file}M` },
];
export const upperArmReasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'upper-arm-anconeus', bindings: pair('FMA37705', 'FMA37706', 'FJ1485'),
    prompt: 'Which small elbow extensor connects the lateral epicondyle to the proximal ulna?',
    explanation: 'Anconeus has these attachments and assists forearm extension.',
    distractors: ['upper-arm-triceps-medial', 'upper-arm-triceps-lateral', 'brachialis'],
  },
  {
    key: 'upper-arm-biceps-short', bindings: pair('FMA37684', 'FMA37685', 'FJ1512'),
    prompt: 'Which biceps head begins at the coracoid rather than the supraglenoid tubercle?',
    explanation: 'The short head starts at the coracoid; the long head starts above the glenoid.',
    distractors: ['biceps-long-head', 'coracobrachialis', 'brachialis'],
  },
  {
    key: 'upper-arm-triceps-medial', bindings: pair('FMA37695', 'FMA37696', 'FJ1480'),
    prompt: 'Which triceps head originates from the lower posteromedial humerus?',
    explanation: 'The medial head joins the other heads in the common olecranon tendon.',
    distractors: ['upper-arm-triceps-lateral', 'triceps-long-head', 'upper-arm-anconeus'],
  },
  {
    key: 'upper-arm-triceps-lateral', bindings: pair('FMA37697', 'FMA37698', 'FJ1477'),
    prompt: 'Which triceps head has its humeral origin posterolaterally?',
    explanation: 'The lateral head arises here, unlike the medial head or scapular long head.',
    distractors: ['upper-arm-triceps-medial', 'triceps-long-head', 'upper-arm-anconeus'],
  },
  {
    key: 'upper-arm-levator-scapulae', bindings: pair('FMA32540', 'FMA32541', 'FJ1532'),
    prompt: 'Which scapular elevator connects upper cervical transverse processes to the superior scapular angle?',
    explanation: 'Levator scapulae follows this cervical-to-scapular course.',
    distractors: ['upper-arm-rhomboid-major', 'upper-arm-rhomboid-minor', 'serratus-anterior'],
  },
  {
    key: 'upper-arm-rhomboid-major', bindings: pair('FMA13381', 'FMA13382', 'FJ1536'),
    prompt: 'Which rhomboid attaches along the medial scapula below its spine?',
    explanation: 'Rhomboid major inserts below the spine and retracts the scapula.',
    distractors: ['upper-arm-rhomboid-minor', 'upper-arm-levator-scapulae', 'serratus-anterior'],
  },
  {
    key: 'upper-arm-rhomboid-minor', bindings: pair('FMA13383', 'FMA13384', 'FJ1537'),
    prompt: 'Which rhomboid attaches at the root of the scapular spine?',
    explanation: 'Rhomboid minor reaches this landmark; major attaches farther inferiorly.',
    distractors: ['upper-arm-rhomboid-major', 'upper-arm-levator-scapulae', 'serratus-anterior'],
  },
].map(concept => ({ ...concept, region: 'shoulder-arm', references: [reference], readiness: 'draft', revision: 1 }));
