import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface FootMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  representation: 'muscle' | 'head' | 'variable-slip';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution?: string;
  references: readonly string[];
}
const foot = 'https://www.ncbi.nlm.nih.gov/books/NBK539705/';
const table =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const kenhub = 'https://www.kenhub.com/en/library/anatomy/';
const medial = 'Medial plantar nerve.';
const lateral = 'Lateral plantar nerve.';
const lumbrical = (
  number: number,
  toe: number,
  fmaIds: readonly string[],
): FootMuscleLesson => ({
  key: `lumbrical-${number}`,
  fmaIds,
  representation: 'muscle',
  origin:
    number === 1
      ? 'Medial side of the long-flexor tendon to toe 2.'
      : `Facing long-flexor tendons to toes ${toe - 1} and ${toe}.`,
  insertion: `Medial extensor apparatus of toe ${toe}.`,
  action: `Bends toe ${toe} at its metatarsophalangeal joint while helping straighten its interphalangeal joints.`,
  motorSupply: number === 1 ? medial : lateral,
  references: [kenhub + 'lumbricals-of-foot'],
});
const interosseous = (
  number: number,
  toe: number,
  fmaIds: readonly string[],
): FootMuscleLesson => ({
  key: `plantar-interosseous-${number}`,
  fmaIds,
  representation: 'muscle',
  origin: `Medial base and shaft of metatarsal ${toe}.`,
  insertion: `Medial proximal-phalanx base and extensor apparatus of toe ${toe}.`,
  action: `Draws toe ${toe} towards the second-toe axis, flexes its metatarsophalangeal joint and assists interphalangeal extension.`,
  motorSupply: lateral,
  references: [kenhub + 'central-muscles-of-the-sole-of-the-foot'],
});

// Source IDs are explicit: numbering of muscles must never imply FMA order.
// These short original drafts do not import reference tables or illustrations.
export const footMuscleLessons: readonly FootMuscleLesson[] = [
  lumbrical(1, 2, ['FMA37717', 'FMA37718']),
  lumbrical(2, 3, ['FMA37719', 'FMA37720']),
  lumbrical(3, 4, ['FMA37485', 'FMA37486']),
  lumbrical(4, 5, ['FMA37483', 'FMA37484']),
  interosseous(1, 3, ['FMA37745', 'FMA37746']),
  interosseous(2, 4, ['FMA37743', 'FMA37744']),
  interosseous(3, 5, ['FMA37741', 'FMA37742']),
  {
    key: 'abductor-digiti-minimi',
    fmaIds: ['FMA37463', 'FMA37464'],
    representation: 'muscle',
    origin: 'Medial and lateral calcaneal tuberosity.',
    insertion: 'Lateral base of the fifth proximal phalanx.',
    action:
      'Moves the little toe away from the second-toe axis and assists flexion at its base.',
    motorSupply: lateral,
    references: [table],
  },
  {
    key: 'flexor-digiti-minimi-brevis',
    fmaIds: ['FMA37471', 'FMA37472'],
    representation: 'muscle',
    origin: 'Plantar base of metatarsal 5.',
    insertion: 'Base of the fifth proximal phalanx.',
    action: 'Bends the little toe at its metatarsophalangeal joint.',
    motorSupply: lateral,
    references: [foot],
  },
  {
    key: 'opponens-digiti-minimi',
    fmaIds: ['FMA86034', 'FMA86035'],
    representation: 'variable-slip',
    origin:
      'Described near the fifth-metatarsal base, long plantar ligament and fibularis-longus tendon sheath.',
    insertion: 'Lateral border of metatarsal 5, not its proximal phalanx.',
    action:
      'This variable deep slip attaches to metatarsal 5. Its independent action is not established for this source; do not infer thumb-like opposition.',
    motorSupply: lateral,
    caution:
      'Often described with flexor digiti minimi brevis. Its metatarsal attachment alone does not validate a separate muscle or toe-joint action.',
    references: [kenhub + 'opponens-digiti-minimi-muscle-of-foot'],
  },
  {
    key: 'abductor-hallucis',
    fmaIds: ['FMA37459', 'FMA37460'],
    representation: 'muscle',
    origin: 'Medial calcaneal tuberosity.',
    insertion: 'Medial base of the hallux proximal phalanx.',
    action:
      'Moves the great toe away from the second-toe axis and assists flexion at its base.',
    motorSupply: medial,
    references: [table],
  },
  {
    key: 'extensor-hallucis-brevis',
    fmaIds: ['FMA51144', 'FMA51145'],
    representation: 'muscle',
    origin: 'Dorsal calcaneal surface.',
    insertion: 'Dorsal base of the hallux proximal phalanx.',
    action:
      'Straightens the great toe at its metatarsophalangeal joint, unlike the long extensor which reaches the distal phalanx.',
    motorSupply: 'Deep fibular (peroneal) nerve.',
    caution:
      'This hallux entry does not supply missing extensor-digitorum-brevis components for the other toes.',
    references: [foot],
  },
  {
    key: 'quadratus-plantae',
    fmaIds: ['FMA37465', 'FMA37466'],
    representation: 'muscle',
    origin: 'Medial calcaneus and lateral calcaneal tuberosity.',
    insertion: 'Flexor digitorum longus tendon apparatus.',
    action:
      'Assists toe flexion through the long-flexor tendon, rather than a direct attachment to a toe bone.',
    motorSupply: lateral,
    caution:
      'Flexor accessorius is the retained source name for quadratus plantae; its two heads are not separate selections here.',
    references: [kenhub + 'quadratus-plantae-muscle'],
  },
  {
    key: 'flexor-digitorum-brevis',
    fmaIds: ['FMA37461', 'FMA37462'],
    representation: 'muscle',
    origin: 'Medial calcaneal tuberosity, plantar aponeurosis and septa.',
    insertion: 'Middle phalanges of toes 2–5 through split tendons.',
    action:
      'Bends toes 2–5; its tendons stop on the middle phalanges, unlike the long flexor.',
    motorSupply: medial,
    caution:
      'Digital slips and their variations are not individually selectable in this source entry.',
    references: [kenhub + 'flexor-digitorum-brevis-muscle'],
  },
  {
    key: 'flexor-hallucis-brevis-medial-head',
    fmaIds: ['FMA45971', 'FMA45972'],
    representation: 'head',
    origin: 'Shared plantar cuboid and lateral-cuneiform origin region.',
    insertion:
      'Medial hallux proximal-phalanx base through the medial sesamoid apparatus.',
    action: 'Bends the great toe at its metatarsophalangeal joint.',
    motorSupply: medial,
    references: [foot, table],
  },
  {
    key: 'flexor-hallucis-brevis-lateral-head',
    fmaIds: ['FMA45973', 'FMA45974'],
    representation: 'head',
    origin: 'Shared plantar cuboid and lateral-cuneiform origin region.',
    insertion:
      'Lateral hallux proximal-phalanx base through the lateral sesamoid apparatus.',
    action: 'Bends the great toe at its metatarsophalangeal joint.',
    motorSupply:
      'Usually medial plantar nerve; additional lateral plantar supply is described.',
    references: [foot, table],
  },
  {
    key: 'adductor-hallucis-oblique-head',
    fmaIds: ['FMA46018', 'FMA46019'],
    representation: 'head',
    origin:
      'Metatarsal bases 2–4, with tarsal and fibularis-longus tendon connections.',
    insertion:
      'Shared adductor tendon at the lateral hallux proximal-phalanx base.',
    action:
      'Draws the great toe towards the second-toe axis and assists flexion at its base.',
    motorSupply: 'Deep branch of lateral plantar nerve.',
    references: [kenhub + 'adductor-hallucis-muscle'],
  },
  {
    key: 'adductor-hallucis-transverse-head',
    fmaIds: ['FMA46020', 'FMA46021'],
    representation: 'head',
    origin:
      'Plantar joint ligaments of toes 3–5 and the intervening deep transverse metatarsal ligaments.',
    insertion:
      'Shared adductor tendon at the lateral hallux proximal-phalanx base.',
    action:
      'Draws the great toe towards the second-toe axis and assists flexion at its base.',
    motorSupply: 'Deep branch of lateral plantar nerve.',
    references: [kenhub + 'adductor-hallucis-muscle'],
  },
];
const byFma = new Map(
  footMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function footMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('foot')
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
        : l.representation === 'head'
          ? 'One source-labelled head is selected, not the whole muscle. Shared attachment notes do not map an independent tendon footprint.'
          : l.representation === 'variable-slip'
            ? 'This source represents a variably separate slip; its boundaries require specialist adjudication.'
            : 'Typical attachments are described below, not measured footprints or validated tendon slips on this surface.',
    bullets:
      tab === 'anatomy'
        ? [
            `Proximal attachment: ${l.origin}`,
            `Distal attachment: ${l.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}`,
          ]
        : [
            `Motor supply: ${l.motorSupply}`,
            'Named plantar and fibular nerves are teaching references; their courses and motor territories are not rendered by this muscle entry.',
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
