import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface LegMuscleLesson {
  key: string;
  fmaIds: readonly string[];
  representation: 'muscle' | 'head';
  compartment:
    | 'Anterior'
    | 'Lateral'
    | 'Superficial posterior'
    | 'Deep posterior';
  origin: string;
  insertion: string;
  action: string;
  motorSupply: string;
  caution?: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const table =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const deep = 'Deep fibular (peroneal) nerve.';
const superficial = 'Superficial fibular (peroneal) nerve.';
const tibial = 'Tibial nerve.';
const achilles =
  'Posterior calcaneus through the shared calcaneal (Achilles) tendon.';

// Original brief factual drafts; explicit source identities, not inferred pairs.
export const legMuscleLessons: readonly LegMuscleLesson[] = [
  {
    key: 'extensor-digitorum-longus',
    fmaIds: ['FMA22548', 'FMA22549'],
    representation: 'muscle',
    compartment: 'Anterior',
    origin:
      'Lateral tibial condyle, anterior fibula and adjacent interosseous membrane.',
    insertion:
      'Extensor apparatus of toes 2–5, continuing to their middle and distal phalanges.',
    action: 'Straightens toes 2–5 and assists ankle dorsiflexion.',
    motorSupply: deep,
    caution:
      'One source entry does not provide individually selectable toe tendons or extensor-expansion slips.',
    references: [books + 'NBK539725/'],
  },
  {
    key: 'extensor-hallucis-longus',
    fmaIds: ['FMA22546', 'FMA22547'],
    representation: 'muscle',
    compartment: 'Anterior',
    origin: 'Middle anterior fibula and adjacent interosseous membrane.',
    insertion: 'Dorsal base of the hallux distal phalanx.',
    action: 'Straightens the great toe and assists ankle dorsiflexion.',
    motorSupply: deep,
    references: [books + 'NBK539725/'],
  },
  {
    key: 'fibularis-brevis',
    fmaIds: ['FMA22554', 'FMA22555'],
    representation: 'muscle',
    compartment: 'Lateral',
    origin: 'Distal lateral fibular shaft and adjacent septum.',
    insertion: 'Tuberosity at the lateral base of metatarsal 5.',
    action:
      'Everting the foot is its main action; it also assists ankle plantarflexion.',
    motorSupply: superficial,
    references: [books + 'NBK519526/'],
  },
  {
    key: 'fibularis-longus',
    fmaIds: ['FMA22552', 'FMA22553'],
    representation: 'muscle',
    compartment: 'Lateral',
    origin: 'Fibular head and proximal lateral shaft, with septal attachments.',
    insertion:
      'Plantar first-metatarsal base and medial cuneiform, after crossing the sole.',
    action:
      'Everts the foot, assists ankle plantarflexion and supports the transverse arch.',
    motorSupply: superficial,
    caution:
      'The distal course and attachment variants require review; a named attachment is not a verified surface footprint.',
    references: [books + 'NBK519526/', table],
  },
  {
    key: 'fibularis-tertius',
    fmaIds: ['FMA22550', 'FMA22551'],
    representation: 'muscle',
    compartment: 'Anterior',
    origin: 'Distal anterior fibula and adjacent interosseous membrane.',
    insertion: 'Dorsal proximal fifth metatarsal.',
    action: 'Assists ankle dorsiflexion and foot eversion.',
    motorSupply: deep,
    caution:
      'Despite its name it belongs to the anterior compartment. Its presence and separation from extensor digitorum longus vary.',
    references: [books + 'NBK539725/'],
  },
  {
    key: 'flexor-digitorum-longus',
    fmaIds: ['FMA65016', 'FMA65017'],
    representation: 'muscle',
    compartment: 'Deep posterior',
    origin: 'Posterior tibial shaft below the soleal line.',
    insertion: 'Plantar bases of the distal phalanges of toes 2–5.',
    action: 'Bends toes 2–5 and assists ankle plantarflexion.',
    motorSupply: tibial,
    caution:
      'The selected source is not a separately segmented set of digital slips or plantar tendon connections.',
    references: [books + 'NBK537340/'],
  },
  {
    key: 'flexor-hallucis-longus',
    fmaIds: ['FMA65014', 'FMA65015'],
    representation: 'muscle',
    compartment: 'Deep posterior',
    origin: 'Distal posterior fibula and adjacent interosseous membrane.',
    insertion: 'Plantar base of the hallux distal phalanx.',
    action: 'Bends the great toe and assists ankle plantarflexion.',
    motorSupply: tibial,
    references: [books + 'NBK537340/', books + 'NBK526084/'],
  },
  {
    key: 'plantaris',
    fmaIds: ['FMA22560', 'FMA22561'],
    representation: 'muscle',
    compartment: 'Superficial posterior',
    origin: 'Lateral supracondylar region of the femur.',
    insertion:
      'Usually the posterior calcaneal region beside the Achilles tendon; distal attachments vary.',
    action:
      'Makes a small contribution to ankle plantarflexion and knee flexion.',
    motorSupply: tibial,
    caution:
      'Plantaris can be absent. Its long tendon is not a nerve, and this specimen is not a universal insertion pattern.',
    references: [table, books + 'NBK459362/'],
  },
  {
    key: 'popliteus',
    fmaIds: ['FMA22591', 'FMA22592'],
    representation: 'muscle',
    compartment: 'Deep posterior',
    origin: 'Lateral femoral condyle through the popliteus tendon.',
    insertion: 'Posterior proximal tibia above the soleal line.',
    action:
      'Helps initiate knee flexion: internally rotates the free tibia, or externally rotates the femur on a fixed tibia. It does not act across the ankle.',
    motorSupply: tibial,
    caution:
      'Meniscal and posterolateral connections are not independently segmented by this muscle entry.',
    references: [books + 'NBK526084/'],
  },
  {
    key: 'soleus',
    fmaIds: ['FMA22558', 'FMA22559'],
    representation: 'muscle',
    compartment: 'Superficial posterior',
    origin: 'Posterior proximal fibula and tibial soleal-line region.',
    insertion: achilles,
    action:
      'Plantarflexes the ankle. Unlike gastrocnemius, it does not cross the knee.',
    motorSupply: tibial,
    caution:
      'Intramuscular aponeuroses and Achilles subtendons are not separately mapped here.',
    references: [books + 'NBK537340/'],
  },
  {
    key: 'tibialis-anterior',
    fmaIds: ['FMA22544', 'FMA22545'],
    representation: 'muscle',
    compartment: 'Anterior',
    origin:
      'Lateral tibial condyle, proximal lateral shaft and interosseous membrane.',
    insertion: 'Medial cuneiform and first-metatarsal base.',
    action:
      'Dorsiflexes the ankle and inverts the foot, helping clear the toes during swing.',
    motorSupply: deep,
    references: [books + 'NBK513304/'],
  },
  {
    key: 'tibialis-posterior',
    fmaIds: ['FMA65018', 'FMA65019'],
    representation: 'muscle',
    compartment: 'Deep posterior',
    origin: 'Posterior tibia, fibula and intervening interosseous membrane.',
    insertion:
      'Main attachment at the navicular tuberosity, with expansions to cuneiforms and other plantar midfoot sites.',
    action:
      'Inverts the foot, assists plantarflexion and supports the medial longitudinal arch.',
    motorSupply: tibial,
    caution:
      'The broad distal insertion is not a single navicular point; its individual slips and variants are not mapped on this source.',
    references: [books + 'NBK539913/'],
  },
  {
    key: 'gastrocnemius-medial-head',
    fmaIds: ['FMA45957', 'FMA45958'],
    representation: 'head',
    compartment: 'Superficial posterior',
    origin: 'Posterior femur at the medial condylar region.',
    insertion: achilles,
    action:
      'Plantarflexes the ankle and assists knee flexion; it crosses both joints.',
    motorSupply: tibial,
    references: [books + 'NBK459362/', books + 'NBK537340/'],
  },
  {
    key: 'gastrocnemius-lateral-head',
    fmaIds: ['FMA45960', 'FMA45961'],
    representation: 'head',
    compartment: 'Superficial posterior',
    origin: 'Lateral aspect of the lateral femoral condylar region.',
    insertion: achilles,
    action:
      'Plantarflexes the ankle and assists knee flexion; it crosses both joints.',
    motorSupply: tibial,
    references: [books + 'NBK459362/', books + 'NBK537340/'],
  },
];

const byFma = new Map(
  legMuscleLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function legMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('leg')
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
          ? 'One source-labelled gastrocnemius head is selected, not the whole muscle. The distal note describes its shared tendon apparatus.'
          : 'Typical attachments are described below, not measured footprints or validated tendon compartments on this surface.',
    bullets:
      tab === 'anatomy'
        ? [
            `Compartment: ${l.compartment} leg`,
            `Proximal attachment: ${l.origin}`,
            `Distal attachment: ${l.insertion}`,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}`,
          ]
        : [
            `Motor supply: ${l.motorSupply}`,
            'Named limb nerves are teaching references; their courses and root territories are not rendered by this muscle entry.',
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
