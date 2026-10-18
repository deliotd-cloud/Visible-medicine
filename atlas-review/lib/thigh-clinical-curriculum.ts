import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';
import type { ShoulderClinicalGroup } from './shoulder-clinical-curriculum';

export interface ThighClinicalGroup extends Omit<
  ShoulderClinicalGroup,
  'identities'
> {
  identities: readonly (readonly [
    fmaId: string,
    side: string,
    file: string,
    region: string,
    regions: readonly string[],
  ])[];
}
/** Original factual drafts. Explicit region memberships preserve pelvic overlap
 * and psoas's spine primary region; no identity is inferred from position/name. */
export const thighClinicalGroups: readonly ThighClinicalGroup[] = [
  {
    key: 'adductors',
    identities: [
      ['FMA22452', 'right', 'FJ1401', 'thigh', ['thigh']],
      ['FMA22454', 'left', 'FJ1401M', 'thigh', ['thigh']],
      ['FMA22456', 'right', 'FJ1402', 'thigh', ['thigh']],
      ['FMA22457', 'left', 'FJ1402M', 'thigh', ['thigh']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Adductor strains can cause groin or medial-thigh pain after kicking, sprinting or changing direction. Adductor longus is commonly involved.',
      bullets: [
        'Pain may come from the muscle–tendon junction or attachment, not necessarily the visible muscle belly.',
      ],
    },
    clinical: {
      body: 'Pain with adductor loading is useful context, but does not identify one muscle or exclude other groin conditions.',
      bullets: [
        'Consider the location, onset and wider hip examination; do not infer tear severity from tenderness alone.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK493166/'],
  },
  {
    key: 'magnus-minimus',
    identities: [
      ['FMA22459', 'right', 'FJ1403', 'thigh', ['thigh']],
      ['FMA22460', 'left', 'FJ1403M', 'thigh', ['thigh']],
      ['FMA43886', 'right', 'FJ1404', 'thigh', ['thigh']],
      ['FMA43887', 'left', 'FJ1404M', 'thigh', ['thigh']],
    ],
    scope:
      'Magnus functional portions and the variably separate minimus are not independently mapped motor territories or validated non-overlapping footprints.',
    pathology: {
      body: 'Strain-related medial-thigh pain can involve adductor magnus, but its large surface does not imply that every portion is injured.',
      bullets: [
        'Adductor minimus is often described as a superior portion of magnus, rather than a universally separate muscle.',
      ],
    },
    clinical: {
      body: 'Distinguish the adductor and hamstring contributions when considering weakness.',
      bullets: [
        'Magnus classically has obturator and tibial/sciatic supply; the entire muscle should not be labelled an isolated obturator-nerve test.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK493166/',
      'https://www.ncbi.nlm.nih.gov/books/NBK534842/',
    ],
  },
  {
    key: 'gracilis',
    identities: [
      ['FMA43883', 'right', 'FJ1421', 'thigh', ['thigh']],
      ['FMA43884', 'left', 'FJ1421M', 'thigh', ['thigh']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Gracilis can be involved in groin strain; its distal tendon also forms part of the pes anserinus at the medial knee.',
      bullets: [
        'Pes anserine bursitis is inflammation of an adjacent bursa, not proof that gracilis has torn.',
      ],
    },
    clinical: {
      body: 'Use the level of symptoms to separate proximal adductor-region pain from distal medial-knee pain.',
      bullets: [
        'The shared pes insertion includes sartorius and semitendinosus; these muscles have different proximal attachments and nerve supplies.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK493166/',
      'https://www.orthoinfo.org/diseases--conditions/pes-anserine-knee-tendon-bursitis',
      'https://www.ncbi.nlm.nih.gov/books/NBK534775/',
    ],
  },
  {
    key: 'pectineus',
    identities: [
      ['FMA22450', 'right', 'FJ1427', 'thigh', ['thigh']],
      ['FMA22451', 'left', 'FJ1427M', 'thigh', ['thigh']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Pectineus is one possible contributor to adductor-region injury and groin pain.',
      bullets: [
        'A painful groin can also reflect joint, bone or other soft-tissue disease; local symptoms do not identify this small muscle.',
      ],
    },
    clinical: {
      body: 'Its combined hip-flexion and adduction role provides context for movement-related symptoms.',
      bullets: [
        'Supply is usually femoral, sometimes with obturator contribution; do not assume that all medial-thigh muscles share one motor nerve.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK493166/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
    ],
  },
  {
    key: 'gemelli-obturator-internus',
    identities: [
      ['FMA22336', 'right', 'FJ1416', 'thigh', ['thigh', 'pelvis']],
      ['FMA22337', 'left', 'FJ1416M', 'thigh', ['thigh', 'pelvis']],
      ['FMA22334', 'right', 'FJ1417', 'thigh', ['thigh', 'pelvis']],
      ['FMA22335', 'left', 'FJ1417M', 'thigh', ['thigh', 'pelvis']],
      ['FMA22324', 'right', 'FJ1426', 'thigh', ['thigh', 'pelvis']],
      ['FMA22325', 'left', 'FJ1426M', 'thigh', ['thigh', 'pelvis']],
    ],
    scope:
      'These separately labelled muscles share complex-level teaching. No sciatic-nerve tether, compression site or dynamic nerve movement is modelled.',
    pathology: {
      body: 'The gemelli–obturator-internus region is one of several anatomical relationships considered in deep gluteal syndromes with buttock or sciatica-like pain.',
      bullets: [
        'This does not establish that every deep external rotator is a cause of nerve entrapment.',
      ],
    },
    clinical: {
      body: 'Interpret posterior hip pain alongside lumbar, hip-joint and neurological findings.',
      bullets: [
        'Obturator internus and superior gemellus share a named nerve supply; inferior gemellus instead receives the nerve to quadratus femoris.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/32349600/',
      'https://www.ncbi.nlm.nih.gov/books/NBK557420/',
    ],
  },
  {
    key: 'obturator-externus',
    identities: [
      ['FMA22326', 'right', 'FJ1425', 'thigh', ['thigh', 'pelvis']],
      ['FMA22327', 'left', 'FJ1425M', 'thigh', ['thigh', 'pelvis']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Obturator externus tears are uncommon reported causes of hip or groin pain. A small football-player series identified these injuries with MRI.',
      bullets: [
        'Pain during rotation overlapped with more commonly suspected adductor or quadriceps injury.',
      ],
    },
    clinical: {
      body: 'Deep location can make the injured tissue difficult to identify from symptoms alone.',
      bullets: [
        'A small case series demonstrates a possibility, not prevalence or a universal return-to-sport timetable.',
        'Unlike obturator internus, externus is supplied by the obturator nerve.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/36143822/',
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
    ],
  },
  {
    key: 'gluteus-maximus',
    identities: [
      ['FMA22328', 'right', 'FJ1418', 'thigh', ['thigh', 'pelvis']],
      ['FMA22329', 'left', 'FJ1418M', 'thigh', ['thigh', 'pelvis']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Inferior gluteal nerve dysfunction can reduce gluteus-maximus strength and hip extension.',
      bullets: [
        'Difficulty rising from a chair or climbing stairs has multiple possible causes and does not diagnose this neuropathy.',
      ],
    },
    clinical: {
      body: 'Assess extension strength in the context of pain, other hip muscles and the wider neurological examination.',
      bullets: [
        'Distinguish inferior-gluteal involvement of maximus from superior-gluteal supply to medius, minimus and TFL.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK538193/'],
  },
  {
    key: 'hip-abductors',
    identities: [
      ['FMA22330', 'right', 'FJ1419', 'thigh', ['thigh', 'pelvis']],
      ['FMA22331', 'left', 'FJ1419M', 'thigh', ['thigh', 'pelvis']],
      ['FMA22332', 'right', 'FJ1420', 'thigh', ['thigh', 'pelvis']],
      ['FMA22333', 'left', 'FJ1420M', 'thigh', ['thigh', 'pelvis']],
    ],
    scope:
      'Medius/minimus share abductor-tendon context; individual tendon facets, fibre compartments and tear grades are not validated.',
    pathology: {
      body: 'Gluteal tendinopathy or tendon tearing can contribute to greater trochanteric pain syndrome, with or without associated bursal disease.',
      bullets: [
        'Lateral hip pain should not automatically be labelled isolated trochanteric bursitis.',
      ],
    },
    clinical: {
      body: 'Abductor dysfunction can allow the pelvis to drop on the unsupported side during single-leg stance.',
      bullets: [
        'This pattern concerns the supported hip, but does not by itself distinguish tendon injury, pain inhibition or nerve dysfunction.',
        'The reference model does not simulate gait or demonstrate a patient’s abductor tear.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK557433/',
      'https://www.ncbi.nlm.nih.gov/books/NBK556144/',
    ],
  },
  {
    key: 'iliacus',
    identities: [
      ['FMA22322', 'right', 'FJ1422', 'thigh', ['thigh', 'pelvis']],
      ['FMA22323', 'left', 'FJ1422M', 'thigh', ['thigh', 'pelvis']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'The shared iliopsoas apparatus can be affected by strain, tendinopathy or painful internal snapping.',
      bullets: [
        'A snapping sensation can also occur without symptoms; it does not automatically mean a tendon tear.',
      ],
    },
    clinical: {
      body: 'Relate anterior hip symptoms to the flexor apparatus while considering other groin causes.',
      bullets: [
        'Iliacus and psoas major have separate source identities and different motor supplies despite their shared distal relationship.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hip-strains',
      'https://www.orthoinfo.org/diseases--conditions/snapping-hip/',
      'https://www.ncbi.nlm.nih.gov/books/NBK531508/',
    ],
  },
  {
    key: 'psoas',
    identities: [
      ['FMA22342', 'right', 'FJ1431', 'spine', ['spine', 'thigh']],
      ['FMA22343', 'left', 'FJ1431M', 'spine', ['spine', 'thigh']],
    ],
    scope:
      'Psoas retains spine and thigh membership. No lumbar-plexus course, abscess, haematoma or vertebral footprint is segmented.',
    pathology: {
      body: 'Psoas-region pain can reflect tendon-related disease, but this compartment can also be affected by haematoma or infection.',
      bullets: [
        'Not every painful hip-flexor presentation is a simple strain.',
      ],
    },
    clinical: {
      body: 'Assessment may need to consider abdominal, spinal, systemic and neurological findings as well as hip movement.',
      bullets: [
        'Psoas receives direct lumbar branches rather than the femoral motor supply of iliacus.',
        'The atlas cannot establish infection, bleeding or a patient-specific cause of pain.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK531508/'],
  },
  {
    key: 'piriformis',
    identities: [
      ['FMA22340', 'right', 'FJ1428', 'thigh', ['thigh', 'pelvis']],
      ['FMA22341', 'left', 'FJ1428M', 'thigh', ['thigh', 'pelvis']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Piriformis-related sciatic irritation is a possible explanation for some buttock and radiating leg pain.',
      bullets: [
        'Similar symptoms can arise from lumbar or other deep gluteal conditions; sciatica is not synonymous with piriformis syndrome.',
      ],
    },
    clinical: {
      body: 'Use this muscle for regional orientation while considering the wider clinical differential.',
      bullets: [
        'Its surface does not prove a sciatic nerve-through-muscle variant, entrapment or the accuracy of a provocative test.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK519497/',
      'https://pubmed.ncbi.nlm.nih.gov/32349600/',
    ],
  },
  {
    key: 'quadratus-femoris',
    identities: [
      ['FMA22338', 'right', 'FJ1432', 'thigh', ['thigh', 'pelvis']],
      ['FMA22339', 'left', 'FJ1432M', 'thigh', ['thigh', 'pelvis']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Ischiofemoral impingement involves the quadratus femoris region between the ischium and lesser trochanter.',
      bullets: [
        'MRI asymmetry and soft-tissue signal changes can also occur in people without symptoms.',
      ],
    },
    clinical: {
      body: 'Interpret suspected impingement with symptoms, examination and imaging position rather than a single space measurement.',
      bullets: [
        'Explode displacement changes the teaching layout; it does not measure the anatomical space or demonstrate decompression.',
      ],
    },
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/25680726/',
      'https://pubmed.ncbi.nlm.nih.gov/25772723/',
    ],
  },
  {
    key: 'sartorius',
    identities: [
      ['FMA22354', 'right', 'FJ1434', 'thigh', ['thigh']],
      ['FMA22355', 'left', 'FJ1434M', 'thigh', ['thigh']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Distal sartorius participates in the pes anserinus, beside a bursa that can become a source of medial-knee pain.',
      bullets: [
        'Bursal pain is different from a sartorius muscle tear or femoral-nerve weakness.',
      ],
    },
    clinical: {
      body: 'Localise symptoms relative to the joint line and consider competing knee causes.',
      bullets: [
        'Sartorius crosses the hip and knee but is not one of the hamstring muscles; sharing the pes attachment does not make it a hamstring.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/pes-anserine-knee-tendon-bursitis',
      'https://www.ncbi.nlm.nih.gov/books/NBK532889/',
    ],
  },
  {
    key: 'semimembranosus',
    identities: [
      ['FMA22448', 'right', 'FJ1435', 'thigh', ['thigh']],
      ['FMA22449', 'left', 'FJ1435M', 'thigh', ['thigh']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Semimembranosus can sustain hamstring muscle–tendon injury or proximal attachment injury.',
      bullets: [
        'Acute posterior-thigh pain and bruising do not establish which tendon is damaged.',
      ],
    },
    clinical: {
      body: 'Its distal posteromedial tibial attachment differs from the pes anserinus of semitendinosus.',
      bullets: [
        'Distal expansions are not independently segmented here; selecting the surface does not identify every posteromedial-knee structure.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hamstring-muscle-injuries',
      'https://www.ncbi.nlm.nih.gov/books/NBK542215/',
    ],
  },
  {
    key: 'semitendinosus',
    identities: [
      ['FMA22358', 'right', 'FJ1436', 'thigh', ['thigh']],
      ['FMA22359', 'left', 'FJ1436M', 'thigh', ['thigh']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Semitendinosus can be injured during hamstring loading; its distal tendon is also part of the pes anserinus.',
      bullets: [
        'Proximal hamstring injury and distal pes-region pain are different clinical locations.',
      ],
    },
    clinical: {
      body: 'Relate symptoms to the muscle belly, tendon junction or attachment rather than assuming one site.',
      bullets: [
        'Its shared tibial insertion does not make sartorius or gracilis part of the hamstring group.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hamstring-muscle-injuries',
      'https://www.orthoinfo.org/diseases--conditions/pes-anserine-knee-tendon-bursitis',
      'https://www.ncbi.nlm.nih.gov/books/NBK542215/',
    ],
  },
  {
    key: 'tfl',
    identities: [
      ['FMA22425', 'right', 'FJ1438', 'thigh', ['thigh']],
      ['FMA22426', 'left', 'FJ1438M', 'thigh', ['thigh']],
    ],
    scope:
      'TFL continues into the iliotibial tract. The tract, bursae and dynamic snapping are not separately validated by this muscle surface.',
    pathology: {
      body: 'The iliotibial tract can contribute to external snapping over the greater trochanter, sometimes with lateral hip discomfort.',
      bullets: [
        'A snap can be asymptomatic and is not evidence that TFL itself has torn.',
      ],
    },
    clinical: {
      body: 'Distinguish external lateral snapping from anterior iliopsoas-related snapping or an intra-articular problem.',
      bullets: [
        'TFL contributes to hip stability through a fascial continuation, not a separately mapped tendon directly joining this muscle to the tibia.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/snapping-hip/',
      'https://www.ncbi.nlm.nih.gov/books/NBK526019/',
    ],
  },
  {
    key: 'rectus-femoris',
    identities: [
      ['FMA38928', 'right', 'FJ1433', 'thigh', ['thigh']],
      ['FMA38929', 'left', 'FJ1433M', 'thigh', ['thigh']],
    ],
    scope:
      'Proximal heads and the internal tendon are not independent selections or validated injury compartments.',
    pathology: {
      body: 'Rectus femoris can sustain muscle–tendon strain during activities loading hip flexion and knee extension.',
      bullets: [
        'A proximal injury is different from disruption of the shared quadriceps tendon near the patella.',
      ],
    },
    clinical: {
      body: 'Rectus crosses both the hip and knee; the vasti do not cross the hip.',
      bullets: [
        'The injury location matters when interpreting pain and weakness; no injury grade or rehabilitation timeline is encoded here.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hip-strains',
      'https://www.ncbi.nlm.nih.gov/books/NBK513334/',
    ],
  },
  {
    key: 'vasti',
    identities: [
      ['FMA38930', 'right', 'FJ1442', 'thigh', ['thigh']],
      ['FMA38931', 'left', 'FJ1442M', 'thigh', ['thigh']],
      ['FMA38932', 'right', 'FJ1443', 'thigh', ['thigh']],
      ['FMA38933', 'left', 'FJ1443M', 'thigh', ['thigh']],
      ['FMA38934', 'right', 'FJ1441', 'thigh', ['thigh']],
      ['FMA38935', 'left', 'FJ1441M', 'thigh', ['thigh']],
    ],
    scope:
      'The three vasti share extensor-mechanism context; selecting one does not independently validate its contribution to a shared tendon tear.',
    pathology: {
      body: 'A quadriceps-tendon tear disrupts force transmission to the patella. Complete disruption can cause major loss of active knee extension.',
      bullets: [
        'Muscle strain, shared tendon injury and neurological weakness are different mechanisms.',
      ],
    },
    clinical: {
      body: 'A new inability to straighten the knee after injury warrants prompt clinical assessment.',
      bullets: [
        'Neither vastus medialis fibre subdivisions nor a separate tear in each vastus are represented.',
        'The quadriceps tendon lies above the patella; it is not the patellar tendon below it.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/quadriceps-tendon-tear',
      'https://www.ncbi.nlm.nih.gov/books/NBK513334/',
    ],
  },
  {
    key: 'biceps-long',
    identities: [
      ['FMA45888', 'right', 'FJ1395', 'thigh', ['thigh']],
      ['FMA45889', 'left', 'FJ1395M', 'thigh', ['thigh']],
    ],
    scope:
      'One head is selected; the shared distal biceps tendon and proximal avulsion are not independently reconstructed.',
    pathology: {
      body: 'The long head can be affected by hamstring strain or an avulsion involving its proximal ischial attachment.',
      bullets: [
        'An avulsion detaches a tendon from bone and may include a bony fragment; it is not just muscle soreness.',
      ],
    },
    clinical: {
      body: 'This head crosses both hip and knee and receives the tibial division of the sciatic nerve.',
      bullets: [
        'Its proximal attachment and motor supply differ from the short head; shared distal attachment does not make their injuries identical.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/hamstring-muscle-injuries',
      'https://www.ncbi.nlm.nih.gov/books/NBK546688/',
    ],
  },
  {
    key: 'biceps-short',
    identities: [
      ['FMA45891', 'right', 'FJ1444', 'thigh', ['thigh']],
      ['FMA45892', 'left', 'FJ1444M', 'thigh', ['thigh']],
    ],
    scope:
      'Reference muscle surface only; no tear, haematoma, compressed nerve or patient scan is represented.',
    pathology: {
      body: 'Pain or weakness involving the short head must be distinguished from proximal ischial hamstring injury.',
      bullets: [
        'The short head arises from the femur and has no ischial origin to avulse.',
      ],
    },
    clinical: {
      body: 'It contributes to knee flexion but does not cross or extend the hip.',
      bullets: [
        'Its motor supply is from the common fibular division of the sciatic nerve, unlike the tibial supply to the long head.',
        'The selected head cannot independently localise a sciatic lesion or establish tendon continuity.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK546688/'],
  },
];
const byFma = new Map(
  thighClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
export function thighClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle' ||
    s.sourceTree !== 'isa'
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (
    !match ||
    s.laterality !== match.identity[1] ||
    s.sources.length !== 1 ||
    s.sources[0].file !== match.identity[2] ||
    s.region !== match.identity[3] ||
    s.regions.length !== match.identity[4].length ||
    s.regions.some((r, i) => r !== match.identity[4][i])
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
