import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
import type { ShoulderClinicalGroup } from './shoulder-clinical-curriculum';

const books = 'https://www.ncbi.nlm.nih.gov/books/';
const pubmed = 'https://pubmed.ncbi.nlm.nih.gov/';
const scapular =
  'https://www.orthoinfo.org/diseases--conditions/scapular-shoulder-blade-disorders/';
const muscleScope =
  'Reference muscle surface only; no patient tear, haematoma, tendon footprint or nerve lesion is segmented.';

/** Original factual drafts. Rare case reports establish possibilities, not
 * prevalence, diagnostic accuracy, treatment rules or source-mesh pathology. */
export const scapularArmClinicalGroups: readonly ShoulderClinicalGroup[] = [
  {
    key: 'anconeus',
    identities: [
      ['FMA37705', 'right', 'FJ1485'],
      ['FMA37706', 'left', 'FJ1485M'],
    ],
    scope:
      'This is the normal posterolateral anconeus, not an accessory anconeus epitrochlearis at the medial elbow.',
    pathology: {
      body: 'Traumatic anconeus contusion has been reported as an unusual cause of lateral elbow pain.',
      bullets: [
        'The published example also had other elbow injuries; it does not establish that anconeus is the usual source of lateral pain.',
        'Anconeus epitrochlearis is a different, accessory muscle that can be associated with ulnar nerve compression. Its presence is not necessarily symptomatic.',
      ],
    },
    clinical: {
      body: 'Distinguish the posterolateral muscle from medial cubital-tunnel anatomy when relating a painful elbow to the model.',
      bullets: [
        'A muscle contusion and compression of the ulnar nerve are different mechanisms.',
        'The selected surface cannot demonstrate an accessory muscle, nerve compression or the cause of a patient’s symptoms.',
      ],
    },
    references: [pubmed + '31152653/', pubmed + '29582694/'],
  },
  {
    key: 'brachialis',
    identities: [
      ['FMA37668', 'right', 'FJ1486'],
      ['FMA37669', 'left', 'FJ1486M'],
    ],
    scope: muscleScope,
    pathology: {
      body: 'Isolated brachialis tears are reported but uncommon. Trauma or heavy loading can injure this deep elbow flexor without a biceps tear.',
      bullets: [
        'Anterior arm pain, swelling and reduced elbow flexion do not identify the injured structure on their own.',
        'Distinguish a muscle-belly injury from distal biceps tendon rupture and from nerve-related weakness.',
      ],
    },
    clinical: {
      body: 'The brachialis lies beneath biceps; examining only the superficial muscle can miss a deeper injury.',
      bullets: [
        'MRI or ultrasound may help identify the involved tissue when the clinical picture is uncertain.',
        'Case reports are limited evidence and do not justify a universal treatment recommendation.',
      ],
    },
    references: [
      books + 'NBK551630/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC5694606/',
    ],
  },
  {
    key: 'coracobrachialis',
    identities: [
      ['FMA37665', 'right', 'FJ1488'],
      ['FMA37666', 'left', 'FJ1488M'],
    ],
    scope: muscleScope,
    pathology: {
      body: 'Compression of the musculocutaneous nerve as it traverses coracobrachialis is one described cause of neuropathy.',
      bullets: [
        'Affected patients may have weakness of biceps and brachialis with altered sensation along the lateral forearm.',
        'Isolated musculocutaneous syndromes are uncommon; these findings do not prove entrapment in this muscle.',
      ],
    },
    clinical: {
      body: 'Relate the nerve–muscle relationship to a pattern spanning several muscles and a sensory territory, not just local arm pain.',
      bullets: [
        'Elbow-flexion weakness is not evidence that coracobrachialis crosses the elbow; its own action is at the shoulder.',
        'The atlas does not display a verified nerve course, compression site or electrodiagnostic result.',
      ],
    },
    references: [books + 'NBK534199/', books + 'NBK554420/'],
  },
  {
    key: 'teres-major',
    identities: [
      ['FMA32551', 'right', 'FJ1507'],
      ['FMA32552', 'left', 'FJ1507M'],
    ],
    scope: muscleScope,
    pathology: {
      body: 'Teres major injury may be isolated or occur with latissimus dorsi injury. These uncommon injuries have been described in sporting activity.',
      bullets: [
        'Posterior axillary pain or bruising can accompany reduced adduction, extension or internal rotation.',
        'Teres major is not a rotator-cuff muscle: its injury must not be relabelled as a teres-minor cuff tear.',
      ],
    },
    clinical: {
      body: 'Assessment should distinguish the muscle belly, myotendinous region and humeral attachment from the adjacent latissimus dorsi.',
      bullets: [
        'A published case used imaging tailored to the suspected teres-major injury; a generic shoulder view is not proof that the entire muscle has been assessed.',
        'This surface provides orientation only and does not encode a tear grade, tendon retraction or scan protocol.',
      ],
    },
    references: [books + 'NBK580487/', pubmed + '27200170/'],
  },
  {
    key: 'levator',
    identities: [
      ['FMA32540', 'right', 'FJ1532'],
      ['FMA32541', 'left', 'FJ1532M'],
    ],
    scope:
      'The upper medial scapular relationship is shown for orientation; no painful trigger point, bursa or dynamic abnormality is mapped.',
    pathology: {
      body: 'Pain and tenderness near the upper medial scapular angle are described in levator-scapulae-related pain syndromes.',
      bullets: [
        'Local tenderness does not establish a tear or explain every episode of neck or shoulder pain.',
        'Abnormal scapular motion may have muscular, neural, bony or joint-related contributors rather than a single painful muscle.',
      ],
    },
    clinical: {
      body: 'Consider neck movement and the position and movement of the scapula together when assessing this region.',
      bullets: [
        'Levator scapulae has cervical as well as dorsal scapular nerve contributions; it is not an isolated test of one nerve.',
        'Muscle tightness, altered movement and a structural lesion are distinct observations that require clinical interpretation.',
      ],
    },
    references: [books + 'NBK553120/', scapular],
  },
  {
    key: 'rhomboids',
    identities: [
      ['FMA13381', 'right', 'FJ1536'],
      ['FMA13382', 'left', 'FJ1536M'],
      ['FMA13383', 'right', 'FJ1537'],
      ['FMA13384', 'left', 'FJ1537M'],
    ],
    scope:
      'Rhomboid major and minor share this group-level context; the selected muscle is not an independently localised nerve lesion.',
    pathology: {
      body: 'Dorsal scapular nerve injury can weaken the rhomboids and disturb scapular control, sometimes producing subtle winging.',
      bullets: [
        'Periscapular pain or altered motion does not distinguish rhomboid palsy from other scapular or cervical disorders.',
        'Rhomboid weakness is not the same as serratus-anterior palsy, and neither is diagnosed from an exploded reference model.',
      ],
    },
    clinical: {
      body: 'Scapular retraction and support against the thorax depend on coordinated muscles, not the rhomboids alone.',
      bullets: [
        'Assessment compares scapular position and movement and considers other shoulder and neck findings.',
        'Electrodiagnostic assessment may help evaluate suspected nerve dysfunction; no such measurement is supplied by this atlas.',
      ],
    },
    references: [books + 'NBK534856/', scapular],
  },
];

const byFma = new Map(
  scapularArmClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
export function scapularArmClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle' ||
    s.region !== 'shoulder-arm' ||
    s.regions.length !== 1 ||
    s.regions[0] !== 'shoulder-arm' ||
    s.sourceTree !== 'isa'
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (
    !match ||
    s.laterality !== match.identity[1] ||
    s.sources.length !== 1 ||
    s.sources[0].file !== match.identity[2]
  )
    return undefined;
  const { group } = match;
  const topic = group[tab];
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'pathology' ? 'Injury & disease' : 'Clinical context'} · draft`,
    body: topic.body,
    bullets: [...topic.bullets, group.scope],
    note: [
      'Draft teaching; independent anatomical and clinical review pending. Educational context, not a patient diagnosis or treatment plan.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...group.references],
  };
}
