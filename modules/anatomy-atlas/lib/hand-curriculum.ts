import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface HandMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  representation: 'muscle' | 'head' | 'group';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution?: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const table =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_upperlimb.html';
const deepUlnar = 'Usually the deep branch of the ulnar nerve.';
const recurrentMedian =
  'Usually the recurrent motor branch of the median nerve.';

// Original brief teaching drafts. Explicit IDs retain source heads and groups;
// no inferred counterpart, tendon slip, nerve geometry or clinical approval.
export const handMuscleLessons: readonly HandMuscleLesson[] = [
  {
    key: 'abductor-digiti-minimi',
    fmaIds: ['FMA37396', 'FMA37397'],
    representation: 'muscle',
    origin: 'Pisiform, with connection to the flexor carpi ulnaris tendon.',
    insertion: 'Little-finger proximal phalanx, at the ulnar side of its base.',
    action: 'Moves the little finger away from the middle-finger axis.',
    motorSupply: deepUlnar,
    references: [books + 'NBK546622/', books + 'NBK539810/'],
  },
  {
    key: 'flexor-digiti-minimi-brevis',
    fmaIds: ['FMA37398', 'FMA37399'],
    representation: 'muscle',
    origin: 'Hamate hook and adjacent flexor retinaculum.',
    insertion: 'Base of the little-finger proximal phalanx.',
    action:
      'Bends the little finger at its knuckle (metacarpophalangeal joint).',
    motorSupply: deepUlnar,
    references: [books + 'NBK546622/', table],
  },
  {
    key: 'opponens-digiti-minimi',
    fmaIds: ['FMA37400', 'FMA37401'],
    representation: 'muscle',
    origin: 'Hamate hook and adjacent flexor retinaculum.',
    insertion:
      'Ulnar aspect of the fifth metacarpal shaft, not a finger phalanx.',
    action:
      'Turns the fifth metacarpal to help cup the palm and bring the little finger towards the thumb.',
    motorSupply: deepUlnar,
    references: [table],
  },
  {
    key: 'abductor-pollicis-brevis',
    fmaIds: ['FMA37386', 'FMA37387'],
    representation: 'muscle',
    origin: 'Flexor retinaculum and the scaphoid/trapezium tubercles.',
    insertion: 'Base of the thumb proximal phalanx.',
    action:
      'Lifts the thumb away from the plane of the palm (palmar abduction).',
    motorSupply: recurrentMedian,
    references: [books + 'NBK580533/'],
  },
  {
    key: 'opponens-pollicis',
    fmaIds: ['FMA37390', 'FMA37391'],
    representation: 'muscle',
    origin: 'Trapezium tubercle and adjacent flexor retinaculum.',
    insertion: 'Palmar-radial aspect of the first metacarpal shaft.',
    action:
      'Turns the first metacarpal across the palm during opposition, orienting the thumb pad towards the finger pads.',
    motorSupply: recurrentMedian,
    references: [books + 'NBK580533/'],
  },
  {
    key: 'adductor-pollicis-oblique-head',
    fmaIds: ['FMA46121', 'FMA46122'],
    representation: 'head',
    origin: 'Capitate and the bases of metacarpals II and III.',
    insertion:
      'Shared adductor attachment at the base of the thumb proximal phalanx.',
    action: 'Contributes to drawing the thumb towards the hand (adduction).',
    motorSupply: deepUlnar,
    references: [table],
  },
  {
    key: 'adductor-pollicis-transverse-head',
    fmaIds: ['FMA46123', 'FMA46124'],
    representation: 'head',
    origin: 'Palmar aspect of the third metacarpal shaft.',
    insertion:
      'Shared adductor attachment at the base of the thumb proximal phalanx.',
    action: 'Contributes to drawing the thumb towards the hand (adduction).',
    motorSupply: deepUlnar,
    references: [table],
  },
  {
    key: 'lumbrical-group',
    fmaIds: ['FMA42398', 'FMA42399'],
    representation: 'group',
    origin: 'Finger flexor digitorum profundus tendons within the palm.',
    insertion:
      'Extensor apparatus of fingers 2–5; this grouped surface does not identify separate slips.',
    action:
      'Helps bend the knuckles while straightening the finger interphalangeal joints.',
    motorSupply:
      'Typically median nerve for lumbricals 1–2 (index/middle fingers); deep ulnar branch for 3–4 (ring/little fingers).',
    caution:
      'This is group-level teaching, not a numbered muscle or segmented motor-territory map.',
    references: [books + 'NBK539810/'],
  },
  {
    key: 'palmar-interosseous-group',
    fmaIds: ['FMA42402', 'FMA42403'],
    representation: 'group',
    origin:
      'Palmar metacarpal surfaces associated with fingers 2, 4 and 5 in the conventional finger group.',
    insertion:
      'Proximal phalanges and extensor apparatus on the sides facing the middle-finger axis.',
    action:
      'Draws fingers towards the middle-finger axis; also assists knuckle flexion and interphalangeal extension.',
    motorSupply: deepUlnar,
    caution:
      'Descriptions differ on a separate thumb palmar interosseous. Neither its presence nor an individual muscle count is established by this source group.',
    references: [books + 'NBK539810/', books + 'NBK534772/'],
  },
  {
    key: 'dorsal-interosseous-group',
    fmaIds: ['FMA42404', 'FMA42405'],
    representation: 'group',
    origin: 'Facing sides of adjacent metacarpals.',
    insertion:
      'Proximal phalanges and extensor apparatus of fingers 2–4; middle-finger insertions lie on both sides.',
    action:
      'Spreads fingers 2–4 relative to the middle-finger axis; also assists knuckle flexion and interphalangeal extension.',
    motorSupply: deepUlnar,
    caution:
      'The middle finger can move to either side of its axis. The little-finger abductor is a separate muscle, not an extra dorsal interosseous.',
    references: [books + 'NBK534772/'],
  },
];

const byFma = new Map(
  handMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);

export function handMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('hand')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'function'
        ? l.action
        : l.representation === 'group'
          ? 'This selected source is a muscle group, not individually numbered or separately segmented muscles. Attachments below summarize the group, not validated mesh footprints.'
          : l.representation === 'head'
            ? 'One source-labelled head is selected, not the whole muscle. Distal notes describe the shared attachment, not a separately validated tendon.'
            : 'Typical attachments are described below; precise footprints and tendon relationships on this surface still need review.',
    bullets:
      tab === 'anatomy'
        ? [
            `Proximal attachment: ${l.origin}`,
            `Distal attachment: ${l.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}`,
          ]
        : [
            `Motor supply: ${l.motorSupply}`,
            'Named nerve courses are not rendered in this hand model; a source surface does not establish nerve branching or individual variation.',
          ],
    note: [
      'Draft teaching; independent anatomical and clinical review pending.',
      l.caution,
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
