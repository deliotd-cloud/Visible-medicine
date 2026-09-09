import type { BodyStructure } from '../app/body-types';
import { forearmReasoningConcepts } from './forearm-reasoning';
import { handReasoningConcepts } from './hand-reasoning';
import { thighReasoningConcepts } from './thigh-reasoning';
import { legReasoningConcepts } from './leg-reasoning';
import { footReasoningConcepts } from './foot-reasoning';
export interface ReasoningConcept {
  key: string;
  region: 'shoulder-arm' | 'forearm' | 'hand' | 'thigh' | 'leg' | 'foot';
  // Exact ordered source memberships for a cross-region representation.
  // Omission retains the original single-region contract.
  sourceRegions?: readonly string[];
  bindings: readonly { fma: string; side: 'right' | 'left'; file: string }[];
  prompt: string;
  explanation: string;
  references: readonly { title: string; url: string }[];
  distractors: readonly string[];
  readiness: 'draft';
  revision: number;
}
// Original questions, not copied/adapted from a publisher question bank.
// Source geometry is matched exactly; this does not grant clinical approval.
export const reasoningConcepts: readonly ReasoningConcept[] = [
  {
    key: 'supraspinatus',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA32544',
        side: 'right',
        file: 'FJ1506',
      },
      {
        fma: 'FMA32545',
        side: 'left',
        file: 'FJ1506M',
      },
    ],
    prompt:
      'Which cuff muscle passes from the fossa above the scapular spine towards the top of the greater humeral tubercle?',
    explanation:
      'Supraspinatus follows this superior route and contributes to abduction. Infraspinatus arises below the scapular spine; subscapularis lies on its anterior side.',
    references: [
      {
        title: 'University anatomy reference',
        url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
      },
    ],
    distractors: ['infraspinatus', 'subscapularis', 'teres-minor'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'infraspinatus',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA32547',
        side: 'right',
        file: 'FJ1500',
      },
      {
        fma: 'FMA32548',
        side: 'left',
        file: 'FJ1500M',
      },
    ],
    prompt:
      'Which posterior cuff muscle combines external rotation with suprascapular nerve supply?',
    explanation:
      'Infraspinatus has this combination. Teres minor also externally rotates the arm, but its motor supply is the axillary nerve.',
    references: [
      {
        title: 'University anatomy reference',
        url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
      },
    ],
    distractors: ['teres-minor', 'subscapularis', 'supraspinatus'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'subscapularis',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA13414',
        side: 'right',
        file: 'FJ1504',
      },
      {
        fma: 'FMA13415',
        side: 'left',
        file: 'FJ1504M',
      },
    ],
    prompt:
      'Which cuff muscle reaches the lesser, rather than greater, humeral tubercle from the anterior scapula?',
    explanation:
      'Subscapularis occupies the anterior scapular surface and contributes to internal rotation. The other three cuff muscles reach the greater tubercle.',
    references: [
      {
        title: 'University anatomy reference',
        url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
      },
    ],
    distractors: ['supraspinatus', 'infraspinatus', 'teres-minor'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'teres-minor',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA32553',
        side: 'right',
        file: 'FJ1508',
      },
      {
        fma: 'FMA32554',
        side: 'left',
        file: 'FJ1508M',
      },
    ],
    prompt:
      'Among the cuff muscles, which external rotator receives axillary nerve supply?',
    explanation:
      'Teres minor is the axillary-innervated cuff external rotator. Infraspinatus shares the action but receives suprascapular nerve supply. This question does not diagnose a nerve injury.',
    references: [
      {
        title: 'Anatomy reference',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK513324/',
      },
    ],
    distractors: ['infraspinatus', 'subscapularis', 'supraspinatus'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'teres-major',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA32551',
        side: 'right',
        file: 'FJ1507',
      },
      {
        fma: 'FMA32552',
        side: 'left',
        file: 'FJ1507M',
      },
    ],
    prompt:
      'Which muscle assists internal rotation from near the inferior scapular angle but is not a rotator-cuff member?',
    explanation:
      'Teres major assists internal rotation and adduction outside the cuff. Teres minor belongs to the cuff and contributes to external rotation.',
    references: [
      {
        title: 'University anatomy reference',
        url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html',
      },
    ],
    distractors: ['teres-minor', 'subscapularis', 'infraspinatus'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'serratus-anterior',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA13398',
        side: 'right',
        file: 'FJ1459',
      },
      {
        fma: 'FMA13399',
        side: 'left',
        file: 'FJ1459M',
      },
    ],
    prompt:
      'Which long-thoracic-nerve-supplied muscle helps hold the scapula against the ribs during reaching?',
    explanation:
      'Serratus anterior supports scapular protraction and upward rotation. Winging has more than one possible cause; this anatomical relationship alone is not a clinical diagnosis.',
    references: [
      {
        title: 'Anatomy reference',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK531457/',
      },
    ],
    distractors: ['subscapularis', 'coracobrachialis', 'teres-major'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'brachialis',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA37668',
        side: 'right',
        file: 'FJ1486',
      },
      {
        fma: 'FMA37669',
        side: 'left',
        file: 'FJ1486M',
      },
    ],
    prompt:
      'Which elbow flexor attaches to the ulna and does not itself supinate the forearm?',
    explanation:
      'Brachialis flexes the elbow across forearm positions. Its ulnar attachment distinguishes it from biceps, which attaches to the radius and also contributes to supination.',
    references: [
      {
        title: 'Anatomy reference',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK551630/',
      },
    ],
    distractors: ['biceps-long-head', 'coracobrachialis', 'triceps-long-head'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'coracobrachialis',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA37665',
        side: 'right',
        file: 'FJ1488',
      },
      {
        fma: 'FMA37666',
        side: 'left',
        file: 'FJ1488M',
      },
    ],
    prompt:
      'Which muscle runs from the coracoid process to the humeral shaft, acting at the shoulder without crossing the elbow?',
    explanation:
      'Coracobrachialis ends on the humerus and contributes to shoulder flexion and adduction. Biceps and brachialis extend beyond the humerus to act across the elbow.',
    references: [
      {
        title: 'Anatomy reference',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK554420/',
      },
    ],
    distractors: ['brachialis', 'biceps-long-head', 'triceps-long-head'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'biceps-long-head',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA37686',
        side: 'right',
        file: 'FJ1478',
      },
      {
        fma: 'FMA37687',
        side: 'left',
        file: 'FJ1478M',
      },
    ],
    prompt:
      'Which muscle head combines a supraglenoid origin with a contribution to elbow flexion and forearm supination?',
    explanation:
      'The long head of biceps begins above the glenoid and joins the distal biceps apparatus. The long head of triceps begins below the glenoid and contributes to elbow extension.',
    references: [
      {
        title: 'Anatomy reference',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK554420/',
      },
    ],
    distractors: ['triceps-long-head', 'brachialis', 'coracobrachialis'],
    readiness: 'draft',
    revision: 1,
  },
  {
    key: 'triceps-long-head',
    region: 'shoulder-arm',
    bindings: [
      {
        fma: 'FMA37699',
        side: 'right',
        file: 'FJ1479',
      },
      {
        fma: 'FMA37700',
        side: 'left',
        file: 'FJ1479M',
      },
    ],
    prompt:
      'Which muscle head links the infraglenoid region to the olecranon, crossing both shoulder and elbow?',
    explanation:
      'The long head of triceps crosses both joints. It contributes to elbow extension and assists shoulder extension and adduction; the biceps long head has a supraglenoid origin.',
    references: [
      {
        title: 'Anatomy reference',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK536996/',
      },
    ],
    distractors: ['biceps-long-head', 'brachialis', 'coracobrachialis'],
    readiness: 'draft',
    revision: 1,
  },
  ...forearmReasoningConcepts,
  ...handReasoningConcepts,
  ...thighReasoningConcepts,
  ...legReasoningConcepts,
  ...footReasoningConcepts,
];
export function reasoningConceptFor(s: BodyStructure) {
  if (
    s.system !== 'muscles' ||
    s.category !== 'muscle' ||
    s.sourceTree !== 'isa' ||
    s.sources.length !== 1
  )
    return undefined;
  return reasoningConcepts.find(
    (c) =>
      s.region === c.region &&
      s.regions.length === (c.sourceRegions ?? [c.region]).length &&
      s.regions.every(
        (region, index) => region === (c.sourceRegions ?? [c.region])[index],
      ) &&
      c.bindings.some(
        (b) =>
          b.fma === s.fmaId &&
          b.side === s.laterality &&
          b.file === s.sources[0].file,
      ),
  );
}
