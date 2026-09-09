import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type LimbConnectiveClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'ligament' | 'tendon' | 'fascia',
];
interface LimbConnectiveClinicalGroup {
  key: string;
  identities: readonly LimbConnectiveClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original, source-linked drafts; all left/right bindings are independently indexed.
export const limbConnectiveClinicalGroups: readonly LimbConnectiveClinicalGroup[] =
  [
    {
      key: 'long-plantar',
      identities: [
        ['FMA44249', 'right', 'isa', ['FJ1424'], 'foot', ['foot'], 'ligament'],
        ['FMA44250', 'left', 'isa', ['FJ1424M'], 'foot', ['foot'], 'ligament'],
      ],
      pathology: {
        body: 'The long plantar ligament belongs to the plantar calcaneocuboid support complex. Injury assessment must distinguish it from the short plantar ligament, spring ligament and plantar fascia; these are not interchangeable labels for plantar foot pain.',
        bullets: [
          "Cadaveric research documents variation in the ligament's shape. Shape variation alone is not proof of a tear or a painful disorder.",
          "The reference surface does not establish whether this ligament is injured or explain an individual patient's arch shape.",
        ],
      },
      clinical: {
        body: 'Use the assembled plantar view to locate the long plantar ligament relative to the calcaneus and cuboid. Clinical localisation requires assessment of neighbouring joints, tendons and other ligaments, not simply selecting the nearest visible surface.',
        bullets: [
          'Explode separates structures for viewing; it does not reproduce ligament stretch or test arch stability.',
          'This selection is not a diagnosis of plantar fasciitis, and no isolated-ligament injury grade is assigned.',
        ],
      },
      scope:
        'One indexed ligament surface per side. Fibre bundles, attachment footprints and adjacent tissue continuity are not independently validated; no load-bearing simulation or procedural guidance.',
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC7792160/'],
    },
    {
      key: 'forearm-interosseous',
      identities: [
        [
          'FMA23707',
          'right',
          'isa',
          ['FJ1476'],
          'forearm',
          ['forearm'],
          'ligament',
        ],
        [
          'FMA23708',
          'left',
          'isa',
          ['FJ1476M'],
          'forearm',
          ['forearm'],
          'ligament',
        ],
      ],
      pathology: {
        body: 'An Essex–Lopresti injury combines a radial-head fracture, forearm interosseous-membrane disruption and distal radioulnar joint injury. Together these can produce longitudinal forearm instability; an isolated radial-head fracture does not by itself establish this combined injury.',
        bullets: [
          'Elbow and wrist findings can belong to the same forearm injury rather than two unrelated problems.',
          'A whole membrane surface cannot show which band has failed or quantify displacement under load.',
        ],
      },
      clinical: {
        body: 'After a relevant forearm injury, assessment must consider the elbow, intervening forearm and wrist. Associated wrist symptoms or instability can be overlooked when attention is confined to the radial head.',
        bullets: [
          'Clinical examination and appropriate imaging determine the injury pattern; an assembled reference atlas does not exclude disruption.',
          'Keep the radius, ulna and both radioulnar joints in context. No stress-test manoeuvre, reconstruction route or implant plan is supplied.',
        ],
      },
      scope:
        'One indexed membrane surface per side; individual bands and insertions are not separately segmented. No patient-specific stability, injury grade or biomechanical simulation.',
      references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC6116505/'],
    },
    {
      key: 'leg-interosseous',
      identities: [
        ['FMA35192', 'right', 'isa', ['FJ1392'], 'leg', ['leg'], 'ligament'],
        ['FMA35193', 'left', 'isa', ['FJ1392M'], 'leg', ['leg'], 'ligament'],
      ],
      pathology: {
        body: 'A syndesmotic or high ankle sprain affects the connection between tibia and fibula. The interosseous tissues participate in this complex alongside the distal tibiofibular ligaments; injury to the complex does not mean the entire leg membrane is torn.',
        bullets: [
          'This differs from treating every ankle sprain as a lateral ankle-ligament injury.',
          'The selected membrane is not a substitute for individually identifying the anterior and posterior distal tibiofibular ligaments.',
        ],
      },
      clinical: {
        body: "A suspected syndesmotic injury needs assessment of the ankle's stability and associated bony injury. Examination and imaging are interpreted together; a normal-looking atlas relationship cannot establish a stable patient ankle.",
        bullets: [
          'The longitudinal leg view provides context, while the ankle view shows the distal relationship of tibia and fibula.',
          'No tear extent, fixation target, weight-bearing clearance or return-to-sport decision follows from this model.',
        ],
      },
      scope:
        'One indexed membrane surface per side. Distal ligament subdivisions and their failure sequence are not separately simulated; explode is not a syndesmotic stress test.',
      references: [
        'https://www.aaos.org/videos/video-detail-page/?id=20295__Videos',
      ],
    },
    {
      key: 'calcaneal-tendon',
      identities: [
        [
          'FMA258847',
          'right',
          'isa',
          ['FJ1405'],
          'leg',
          ['leg', 'foot'],
          'tendon',
        ],
        [
          'FMA264844',
          'left',
          'isa',
          ['FJ1405M'],
          'leg',
          ['leg', 'foot'],
          'tendon',
        ],
      ],
      pathology: {
        body: 'Achilles tendinopathy and an Achilles rupture are different clinical problems. Persistent tendon pain may occur at or above the heel attachment; a rupture is a partial or complete loss of tendon continuity and may cause sudden loss of effective push-off.',
        bullets: [
          'A rupture may follow a sudden pop and swelling, but symptoms alone do not determine tear extent.',
          'The calcaneal tendon selection is the Achilles tendon, not the plantar fascia or a calf-muscle belly.',
        ],
      },
      clinical: {
        body: 'A sudden injury with a pop and difficulty pushing off or standing on tiptoe warrants prompt medical assessment. Examination, sometimes supported by ultrasound or MRI, distinguishes tendon disruption from other causes of posterior ankle pain.',
        bullets: [
          'A rendered continuous surface cannot rule out a real tear, and remaining ankle movement does not measure tendon integrity here.',
          'No calf-squeeze test simulation, tendon-gap measurement, loading programme or operative decision is provided.',
        ],
      },
      scope:
        'One indexed tendon surface per side. Subtendons, paratenon and enthesis are not separately segmented; no ultrasound/MRI study or patient registration has been added.',
      references: [
        'https://www.orthoinfo.org/diseases--conditions/achilles-tendon-rupture-tear/',
        'https://www.orthoinfo.org/diseases--conditions/achilles-tendinitis/',
      ],
    },
    {
      key: 'wrist-flexor-retinaculum',
      identities: [
        [
          'FMA40120',
          'right',
          'isa',
          ['FJ1471'],
          'hand',
          ['hand', 'forearm'],
          'ligament',
        ],
        [
          'FMA40121',
          'left',
          'isa',
          ['FJ1471M'],
          'hand',
          ['hand', 'forearm'],
          'ligament',
        ],
      ],
      pathology: {
        body: 'Carpal tunnel syndrome concerns compression of the median nerve at the wrist beneath the transverse carpal ligament, within the flexor-retinaculum region. The selected retinacular surface is a boundary landmark, not a diseased nerve or a measure of tunnel pressure.',
        bullets: [
          'Symptoms may include tingling or numbness in the thumb, index and middle fingers and the thumb-side of the ring finger.',
          'Not all hand numbness is carpal tunnel syndrome; a broad symptom distribution needs clinical assessment.',
        ],
      },
      clinical: {
        body: 'History and examination evaluate sensory symptoms and hand function; nerve tests or imaging may be used when appropriate. The atlas helps orient the roof of the tunnel but cannot establish nerve compression or its severity.',
        bullets: [
          'The median nerve and flexor tendons are separate structures; fading the retinaculum does not certify clearance around them.',
          'No retinacular cutting line, injection route or safe surgical plane is supplied.',
        ],
      },
      scope:
        'One indexed retinacular surface per side. Regional thickness, attachments and individual fascial subdivisions are not clinically validated; no tunnel-pressure or nerve-conduction simulation.',
      references: [
        'https://www.orthoinfo.org/diseases--conditions/carpal-tunnel-syndrome/',
      ],
    },
    {
      key: 'iliotibial-tract',
      identities: [
        [
          'FMA58776',
          'right',
          'isa',
          ['FJ1423'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'fascia',
        ],
        [
          'FMA58777',
          'left',
          'isa',
          ['FJ1423M'],
          'thigh',
          ['thigh', 'pelvis', 'leg'],
          'fascia',
        ],
      ],
      pathology: {
        body: 'Iliotibial band syndrome is an activity-related overuse problem commonly associated with lateral knee pain in runners or cyclists. The tract is part of the lateral fascial complex, not an isolated tendon, and not every painful lateral knee has this syndrome.',
        bullets: [
          'Symptoms and training history matter; the displayed width or colour of the tract is not a disease finding.',
          'The static model does not demonstrate friction, compression, inflammation or pain generation during knee movement.',
        ],
      },
      clinical: {
        body: 'Assessment considers activity-related symptoms, the hip–thigh–knee chain and other causes of pain. Examination, with imaging when indicated, establishes clinical context that a single fascial surface cannot provide.',
        bullets: [
          'Use the regional links to follow the same indexed tract across thigh, pelvis and leg without treating these as three separate tissues.',
          'No stretching prescription, dynamic tissue-gliding test, gait diagnosis or return-to-running timetable is inferred.',
        ],
      },
      scope:
        'One indexed fascia surface per side. Deep attachments and surrounding tissue continuity are not certified; no freely sliding cord or validated movement simulation.',
      references: [
        'https://www.orthoinfo.org/diseases--conditions/iliotibial-band-it-band-syndrome',
      ],
    },
  ];
const byFma = new Map(
  limbConnectiveClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function limbConnectiveClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if ((tab !== 'pathology' && tab !== 'clinical') || s.system !== 'connective')
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions, category] = match.identity;
  if (
    s.category !== category ||
    s.laterality !== side ||
    s.sourceTree !== tree ||
    s.region !== region ||
    !same(s.regions, regions) ||
    !same(
      s.sources.map((p) => p.file),
      files,
    )
  )
    return undefined;
  const { group } = match,
    topic = group[tab];
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
