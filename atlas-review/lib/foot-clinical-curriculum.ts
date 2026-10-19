import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
import type { ShoulderClinicalGroup } from './shoulder-clinical-curriculum';

const foot = 'https://www.ncbi.nlm.nih.gov/books/NBK539705/';
const tunnel = 'https://www.ncbi.nlm.nih.gov/books/NBK513273/';
const table =
  'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html';
const hammer = 'https://www.orthoinfo.org/diseases--conditions/hammer-toe';
const bunion = 'https://www.orthoinfo.org/diseases--conditions/bunions/';
const surface =
  'Reference muscle surface only; no nerve territory, pathological tendon, deformity or patient-specific lesion is segmented.';

/** Original short teaching drafts, not clinically approved diagnostic criteria. */
export const footClinicalGroups: readonly ShoulderClinicalGroup[] = [
  {
    key: 'first-lumbrical',
    identities: [
      ['FMA37717', 'right', 'FJ1383'],
      ['FMA37718', 'left', 'FJ1383M'],
    ],
    scope: surface,
    pathology: {
      body: 'Intrinsic muscle weakness can contribute to lesser-toe imbalance. A deformed second toe does not establish an isolated first-lumbrical injury.',
      bullets: [
        'Joint stiffness, tendon balance and neurological findings need to be considered together.',
      ],
    },
    clinical: {
      body: 'The first foot lumbrical uses the medial plantar motor supply, unlike the other three lumbricals.',
      bullets: [
        'Relate its action to flexion at the second-toe base and extension at the interphalangeal joints; this is not a perfectly isolated bedside test.',
      ],
    },
    references: [foot, hammer],
  },
  {
    key: 'lateral-lumbricals',
    identities: [
      ['FMA37719', 'right', 'FJ1385'],
      ['FMA37720', 'left', 'FJ1385M'],
      ['FMA37485', 'right', 'FJ1387'],
      ['FMA37486', 'left', 'FJ1387M'],
      ['FMA37483', 'right', 'FJ1389'],
      ['FMA37484', 'left', 'FJ1389M'],
    ],
    scope:
      'Shared clinical context for lumbricals 2–4; each source muscle remains individually selectable. No denervation or deformity is rendered.',
    pathology: {
      body: 'Weakness affecting the lateral plantar motor supply can impair these lumbricals and other intrinsic muscles together.',
      bullets: [
        'A bent toe is not proof of a single lumbrical tear or one nerve-compression site.',
      ],
    },
    clinical: {
      body: 'Lumbricals 2–4 act on toes 3–5 and receive lateral plantar innervation; do not apply the median/ulnar pattern of hand lumbricals.',
      bullets: [
        'Compare toe posture, active movement, passive correction and sensation as parts of a wider examination.',
      ],
    },
    references: [foot, tunnel, hammer],
  },
  {
    key: 'plantar-interossei',
    identities: [
      ['FMA37745', 'right', 'FJ1384'],
      ['FMA37746', 'left', 'FJ1384M'],
      ['FMA37743', 'right', 'FJ1386'],
      ['FMA37744', 'left', 'FJ1386M'],
      ['FMA37741', 'right', 'FJ1388'],
      ['FMA37742', 'left', 'FJ1388M'],
    ],
    scope:
      'Shared clinical context for three separately identified plantar interossei; absent dorsal interossei are not supplied by these selections.',
    pathology: {
      body: 'Interosseous weakness can accompany lateral plantar nerve dysfunction and altered intrinsic balance.',
      bullets: [
        'Toe malalignment alone cannot distinguish muscle weakness from tendon or joint disease.',
      ],
    },
    clinical: {
      body: 'Assess movement towards the second-toe axis: plantar interossei adduct toes 3–5, not towards a hand-like middle-finger axis.',
      bullets: [
        'They also act at metatarsophalangeal and interphalangeal joints; reduced movement is not a selective nerve test.',
      ],
    },
    references: [table, tunnel, hammer],
  },
  {
    key: 'abductor-digiti-minimi',
    identities: [
      ['FMA37463', 'right', 'FJ1390'],
      ['FMA37464', 'left', 'FJ1390M'],
    ],
    scope: surface,
    pathology: {
      body: 'The nerve supplying this muscle is relevant to the proposed Baxter neuropathy explanation for plantar heel pain.',
      bullets: [
        'Fatty infiltration of the muscle on MRI is not an established stand-alone diagnosis of Baxter neuropathy: a 2025 systematic review found the association uncertain.',
      ],
    },
    clinical: {
      body: 'Correlate heel symptoms with the wider examination and actual imaging; the reference mesh cannot demonstrate denervation.',
      bullets: [
        'Do not infer a symptomatic compressed nerve, or an indication for surgery, from muscle appearance alone.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/12197005/',
      'https://pubmed.ncbi.nlm.nih.gov/40836398/',
    ],
  },
  {
    key: 'flexor-digiti-minimi-brevis',
    identities: [
      ['FMA37471', 'right', 'FJ1391'],
      ['FMA37472', 'left', 'FJ1391M'],
    ],
    scope: surface,
    pathology: {
      body: 'Pain near the little-toe base can arise from joint prominence and pressure, including a bunionette; it is not automatically a short-flexor lesion.',
      bullets: [
        'Separate local painful movement from a wider pattern of intrinsic motor weakness.',
      ],
    },
    clinical: {
      body: 'This short flexor acts at the fifth metatarsophalangeal joint, not the distal toe joint.',
      bullets: [
        'Use its proximal-phalanx attachment to distinguish it from the long-flexor tendon and the adjacent metatarsal-attaching opponens slip.',
      ],
    },
    references: [table, bunion],
  },
  {
    key: 'opponens-digiti-minimi',
    identities: [
      ['FMA86034', 'right', 'FJ1399'],
      ['FMA86035', 'left', 'FJ1399M'],
    ],
    scope:
      'Variable source-labelled slip, not an adjudicated independent muscle, mass or diseased surface.',
    pathology: {
      body: 'Variation in whether this slip is separate from flexor digiti minimi brevis should not be labelled an acquired tear or a pathological mass.',
      bullets: [
        'No structure-specific disease pattern has been validated for this atlas entry.',
      ],
    },
    clinical: {
      body: 'The retained source label concerns the foot, not the hypothenar muscle of the hand.',
      bullets: [
        'A fifth-metatarsal attachment does not establish thumb-like opposition, an isolated examination manoeuvre or a treatment target.',
      ],
    },
    references: [
      'https://www.kenhub.com/en/library/anatomy/opponens-digiti-minimi-muscle-of-foot',
    ],
  },
  {
    key: 'abductor-hallucis',
    identities: [
      ['FMA37459', 'right', 'FJ1400'],
      ['FMA37460', 'left', 'FJ1400M'],
    ],
    scope: surface,
    pathology: {
      body: 'Tibial or medial plantar nerve dysfunction can affect this medial intrinsic muscle.',
      bullets: [
        'Medial arch pain by itself does not establish tarsal tunnel syndrome or muscle denervation.',
      ],
    },
    clinical: {
      body: 'Relate hallux abduction and flexion to the medial plantar motor supply, alongside sensory symptoms and other muscles.',
      bullets: [
        'This muscle selection is not a nerve-conduction test or a validated tunnel boundary.',
      ],
    },
    references: [tunnel, table],
  },
  {
    key: 'extensor-hallucis-brevis',
    identities: [
      ['FMA51144', 'right', 'FJ1407'],
      ['FMA51145', 'left', 'FJ1407M'],
    ],
    scope: surface,
    pathology: {
      body: 'Loss of great-toe extension can involve local tendon injury or neurological weakness; it cannot be assigned to this short extensor from movement alone.',
      bullets: [
        'A preserved reference surface provides no evidence of tendon integrity in a patient.',
      ],
    },
    clinical: {
      body: 'The short extensor acts at the great-toe base; the long extensor reaches the distal phalanx.',
      bullets: [
        'Its deep fibular motor supply differs from plantar intrinsic innervation; this entry does not represent missing short extensors of the lesser toes.',
      ],
    },
    references: [table, 'https://www.ncbi.nlm.nih.gov/books/NBK554393/'],
  },
  {
    key: 'quadratus-plantae',
    identities: [
      ['FMA37465', 'right', 'FJ1412'],
      ['FMA37466', 'left', 'FJ1412M'],
    ],
    scope: surface,
    pathology: {
      body: 'Lateral plantar motor dysfunction may involve quadratus plantae alongside other intrinsic muscles.',
      bullets: [
        'Weak toe flexion does not identify an isolated lesion of this muscle.',
      ],
    },
    clinical: {
      body: 'Quadratus plantae assists flexion through the long-flexor tendon apparatus, rather than attaching directly to a toe phalanx.',
      bullets: [
        'The source name flexor accessorius refers to this entry; its two heads and individual tendon connections are not separate selections.',
      ],
    },
    references: [foot, tunnel],
  },
  {
    key: 'flexor-digitorum-brevis',
    identities: [
      ['FMA37461', 'right', 'FJ1413'],
      ['FMA37462', 'left', 'FJ1413M'],
    ],
    scope: surface,
    pathology: {
      body: 'Lesser-toe deformity reflects the balance of muscles, tendons and joints, not simply shortening or rupture of the short flexor.',
      bullets: [
        'Hammer toe describes a bend at the proximal interphalangeal joint; the diagnosis does not identify one responsible tendon.',
      ],
    },
    clinical: {
      body: 'The short flexor reaches the middle phalanges; the long flexor continues to the distal phalanges.',
      bullets: [
        'Compare active movement with passive flexibility; this grouped muscle cannot resolve the integrity of one digital tendon slip.',
      ],
    },
    references: [table, hammer],
  },
  {
    key: 'flexor-hallucis-brevis',
    identities: [
      ['FMA45971', 'right', 'FJ1396'],
      ['FMA45972', 'left', 'FJ1396M'],
      ['FMA45973', 'right', 'FJ1393'],
      ['FMA45974', 'left', 'FJ1393M'],
    ],
    scope:
      'Shared hallux plantar-complex context for two separately labelled muscle heads; unresolved sesamoid groups are not assigned medial/lateral identity by this lesson.',
    pathology: {
      body: 'Turf toe affects the plantar stabilising complex of the first metatarsophalangeal joint; it is not synonymous with an isolated short-flexor tear.',
      bullets: [
        'Pain under the great-toe base may also involve sesamoiditis or a sesamoid fracture; these are different problems.',
      ],
    },
    clinical: {
      body: 'Relate push-off and great-toe-base flexion to the short-flexor/sesamoid apparatus, distinct from the long flexor reaching the distal phalanx.',
      bullets: [
        'A bipartite sesamoid can be a normal variant, not automatically a fracture.',
        'This selection cannot grade turf toe, prove instability or assign a painful sesamoid to a source muscle head.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/turf-toe',
      'https://www.orthoinfo.org/diseases--conditions/sesamoiditis/',
    ],
  },
  {
    key: 'adductor-hallucis',
    identities: [
      ['FMA46018', 'right', 'FJ1398'],
      ['FMA46019', 'left', 'FJ1398M'],
      ['FMA46020', 'right', 'FJ1445'],
      ['FMA46021', 'left', 'FJ1445M'],
    ],
    scope:
      'Shared clinical context for the oblique and transverse heads; neither selection is an independent diseased tendon footprint.',
    pathology: {
      body: 'Hallux valgus involves first-ray alignment and soft-tissue mechanics. A bunion is not proof of an isolated adductor-hallucis lesion.',
      bullets: [
        'Inherited foot structure, footwear and inflammatory or neurological disease can contribute.',
      ],
    },
    clinical: {
      body: 'Adduction draws the hallux towards the second-toe axis. Both heads contribute to the shared adductor apparatus.',
      bullets: [
        'Standing alignment and joint assessment are different from viewing an unloaded reference model; moving this head in explode mode does not simulate corrective surgery.',
      ],
    },
    references: [bunion, foot],
  },
];

const byFma = new Map(
  footClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);

export function footClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle' ||
    s.region !== 'foot' ||
    s.regions.length !== 1 ||
    s.regions[0] !== 'foot' ||
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
