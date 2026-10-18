import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type TrunkClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
];
interface TrunkClinicalGroup {
  key: string;
  identities: readonly TrunkClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
/** Short original drafts; exact source identities, not inferred mirror copies. */
export const trunkClinicalGroups: readonly TrunkClinicalGroup[] = [
  {
    key: 'external-intercostal',
    identities: [
      [
        'FMA9756',
        'midline',
        'isa',
        ['FJ1451', 'FJ1451M'],
        'thorax',
        ['thorax'],
      ],
    ],
    scope:
      'Bilateral source group: the catalog label “midline” does not mean a single unpaired muscle. Individual spaces and diseased fibres are not segmented.',
    pathology: {
      body: 'Chest-wall strain may hurt during breathing, but respiratory pain can also have non-muscular causes.',
      bullets: [
        'Sudden persistent chest discomfort, or chest pain with breathlessness, sweating or spreading pain, needs emergency assessment; in the UK call 999.',
      ],
    },
    clinical: {
      body: 'Use this outer layer to orient the rib spaces; an apparent tender surface does not establish which intercostal muscle is injured.',
      bullets: [
        'The atlas cannot distinguish chest-wall strain from pleural or cardiac disease.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK538321/',
      'https://www.nhs.uk/symptoms/chest-pain/',
    ],
  },
  {
    key: 'internal-intercostal',
    identities: [
      [
        'FMA9757',
        'midline',
        'isa',
        ['FJ1455', 'FJ1455M'],
        'thorax',
        ['thorax'],
      ],
    ],
    scope:
      'Bilateral source group: the catalog label “midline” does not mean a single unpaired muscle. Individual spaces and diseased fibres are not segmented.',
    pathology: {
      body: 'Pain in an intercostal space does not localise a lesion to this middle muscle layer.',
      bullets: [
        'Rib, pleural and neural causes remain separate possibilities; respiratory movement alone is not a diagnostic test.',
      ],
    },
    clinical: {
      body: 'Internal-intercostal fibres do not all have the same respiratory action: interosseous and parasternal portions differ.',
      bullets: [
        'This grouped mesh cannot isolate those portions or measure their recruitment.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK538321/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC2278403/',
      'https://www.nhs.uk/symptoms/chest-pain/',
    ],
  },
  {
    key: 'innermost-intercostal',
    identities: [
      [
        'FMA9758',
        'midline',
        'isa',
        ['FJ1454', 'FJ1454M'],
        'thorax',
        ['thorax'],
      ],
    ],
    scope:
      'Bilateral source group: the catalog label “midline” does not mean a single unpaired muscle. Individual spaces and diseased fibres are not segmented.',
    pathology: {
      body: 'Injury in the deep chest wall may involve more than muscle, including nearby nerves, vessels and pleura.',
      bullets: [
        'A cutaway reveals reference relationships, not the depth or extent of a patient injury.',
      ],
    },
    clinical: {
      body: 'Keep the neurovascular plane between internal and innermost layers conceptually distinct from the muscle surfaces.',
      bullets: [
        'Do not use this selection to plan a needle, drain or nerve block.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK538321/'],
  },
  {
    key: 'external-oblique',
    identities: [
      ['FMA13336', 'right', 'isa', ['FJ1452'], 'abdomen', ['abdomen']],
      ['FMA13337', 'left', 'isa', ['FJ1452M'], 'abdomen', ['abdomen']],
    ],
    scope:
      'Only the admitted external-oblique surfaces are represented; deeper abdominal-wall layers and dynamic pressure are not supplied by this selection.',
    pathology: {
      body: 'Abdominal-wall pain after exertion can involve a strain, but a visible bulge or painful movement is not proof of an external-oblique tear.',
      bullets: [
        'Muscle injury and a hernia are different problems and require clinical assessment.',
      ],
    },
    clinical: {
      body: 'Relate trunk movement and abdominal-wall support to this superficial layer, without treating it as the entire abdominal wall.',
      bullets: [
        'Explode separation does not demonstrate a fascial defect or reproduce coughing or straining.',
      ],
    },
    references: ['https://www.nhs.uk/conditions/hernia/'],
  },
  {
    key: 'pectoralis-minor',
    identities: [
      ['FMA13375', 'right', 'isa', ['FJ1456'], 'thorax', ['thorax']],
      ['FMA13376', 'left', 'isa', ['FJ1456M'], 'thorax', ['thorax']],
    ],
    scope:
      'Reference muscle surface only; no compressed plexus, nerve territory or disease-specific dynamic test is rendered.',
    pathology: {
      body: 'Abnormal chest-wall development may involve pectoralis minor as part of Poland syndrome; a missing model component is not a congenital diagnosis.',
      bullets: [
        'Do not diagnose a compression syndrome from this surface or from posture alone.',
      ],
    },
    clinical: {
      body: 'Pectoralis minor attaches to the coracoid and influences the scapula, not the humerus directly.',
      bullets: [
        'Distinguish it from the larger pectoralis major when interpreting anterior shoulder movement.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK538321/'],
  },
  {
    key: 'pectoralis-major',
    identities: [
      [
        'FMA13373',
        'right',
        'partof',
        ['FJ1446', 'FJ1464'],
        'thorax',
        ['thorax'],
      ],
      [
        'FMA13374',
        'left',
        'partof',
        ['FJ1446M', 'FJ1464M'],
        'thorax',
        ['thorax'],
      ],
    ],
    scope:
      'PART-OF representation contains sternocostal and abdominal components only. The clavicular component is absent, not torn; no independent diseased tendon footprint is included.',
    pathology: {
      body: 'An eccentric load, such as lowering a bench press, can injure the pectoralis major muscle–tendon unit.',
      bullets: [
        'A tear may involve muscle belly, musculotendinous junction or tendon; bruising and loss of the anterior axillary contour warrant assessment.',
      ],
    },
    clinical: {
      body: 'Compare the chest and axillary fold, strength and the injury history; a partial source model cannot grade a tear.',
      bullets: [
        'If imaging is required, routine shoulder MRI may not cover the whole pectoralis: appropriate dedicated coverage matters. Ultrasound can also be used.',
      ],
    },
    references: [
      'https://www.orthoinfo.org/diseases--conditions/pectoralis-tendon-tear/',
    ],
  },
  {
    key: 'transversus-thoracis',
    identities: [
      ['FMA9761', 'right', 'isa', ['FJ1461'], 'thorax', ['thorax']],
      ['FMA9762', 'left', 'isa', ['FJ1461M'], 'thorax', ['thorax']],
    ],
    scope:
      'Variable anterior chest-wall slips; no internal-thoracic vessel course, pleural depth or safe access route is validated.',
    pathology: {
      body: 'Anterior chest symptoms should not automatically be assigned to this deep muscle.',
      bullets: [
        'The selected normal reference surface does not show a haematoma, tear or inflammatory lesion.',
      ],
    },
    clinical: {
      body: 'Use the inner chest-wall location as orientation, not as a procedural target.',
      bullets: [
        'A muscle-only cutaway is insufficient for a safe injection or surgical corridor.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK538321/',
      'https://www.nhs.uk/symptoms/chest-pain/',
    ],
  },
  {
    key: 'diaphragm',
    identities: [
      ['FMA13295', 'midline', 'isa', ['FJ3131'], 'thorax', ['thorax']],
    ],
    scope:
      'Single source surface: no validated crura, hiatus boundaries, breathing motion or patient-specific phrenic branches.',
    pathology: {
      body: 'Diaphragm weakness may arise from phrenic nerve dysfunction or muscle disease. An elevated hemidiaphragm on a radiograph is not specific for paralysis.',
      bullets: [
        'Symptoms and respiratory function must be correlated; this static surface cannot confirm unilateral paralysis.',
      ],
    },
    clinical: {
      body: 'Each hemidiaphragm has its own phrenic motor supply, predominantly C3–C5.',
      bullets: [
        'Dynamic ultrasound or fluoroscopic assessment evaluates movement; CT can investigate an underlying cause. No excursion, sniff-test result or patient scan is supplied here.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK557388/'],
  },
  {
    key: 'trapezius',
    identities: [
      ['FMA33581', 'right', 'isa', ['FJ1520'], 'spine', ['spine']],
      ['FMA33583', 'left', 'isa', ['FJ1520M'], 'spine', ['spine']],
      ['FMA33584', 'right', 'isa', ['FJ1554'], 'spine', ['spine']],
      ['FMA33585', 'left', 'isa', ['FJ1554M'], 'spine', ['spine']],
      ['FMA33586', 'right', 'isa', ['FJ1521'], 'spine', ['spine']],
      ['FMA33587', 'left', 'isa', ['FJ1521M'], 'spine', ['spine']],
    ],
    scope:
      'Shared clinical context for separately selectable upper, middle and lower source parts; mesh seams are not proven motor territories.',
    pathology: {
      body: 'Spinal accessory nerve injury after posterior-triangle procedures can impair trapezius function, with shoulder droop and altered scapular control.',
      bullets: [
        'Painful elevation is not by itself proof of an accessory neuropathy.',
      ],
    },
    clinical: {
      body: 'Assess scapular control and shoulder elevation in context; distinguish trapezius dysfunction from serratus anterior weakness.',
      bullets: [
        'Preserved movement can reflect compensation. Clinical examination and, when indicated, electrophysiology assess nerve function; the mesh does not.',
      ],
    },
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK532245/'],
  },
  {
    key: 'rotatores',
    identities: [
      ['FMA23089', 'right', 'isa', ['FJ1522'], 'spine', ['spine', 'abdomen']],
      ['FMA23090', 'left', 'isa', ['FJ1522M'], 'spine', ['spine', 'abdomen']],
      [
        'FMA23083',
        'midline',
        'isa',
        ['FJ1525', 'FJ1525M'],
        'spine',
        ['spine', 'thorax'],
      ],
    ],
    scope:
      'Lumbar and grouped thoracic entries retain their identities. Lumbar slips are variable; no numbered segments, isolated lesions or individual motor branches are validated.',
    pathology: {
      body: 'Deep paraspinal pain does not establish an isolated rotator muscle lesion.',
      bullets: [
        'A symptom labelled “back strain” should not be assigned to one tiny source slip without supporting evidence.',
      ],
    },
    clinical: {
      body: 'These small deep muscles belong to the transversospinal group; surface movement cannot selectively test a single rotator.',
      bullets: [
        'Relate symptoms to the wider spinal and neurological examination rather than the nearest mesh.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
      'https://www.nhs.uk/conditions/back-pain/',
    ],
  },
  {
    key: 'erector-spinae',
    identities: [
      ['FMA22740', 'right', 'isa', ['FJ1527'], 'spine', ['spine']],
      ['FMA22741', 'left', 'isa', ['FJ1527M'], 'spine', ['spine']],
      ['FMA22742', 'right', 'isa', ['FJ1528'], 'spine', ['spine']],
      ['FMA22743', 'left', 'isa', ['FJ1528M'], 'spine', ['spine']],
      ['FMA22751', 'right', 'isa', ['FJ1535'], 'spine', ['spine']],
      ['FMA22753', 'left', 'isa', ['FJ1535M'], 'spine', ['spine']],
      [
        'FMA77179',
        'midline',
        'isa',
        ['FJ1543', 'FJ1543M', 'FJ1544', 'FJ1544M'],
        'spine',
        ['spine'],
      ],
    ],
    scope:
      'Shared context for iliocostalis, longissimus thoracis and the four-file spinalis group. The unresolved spinalis components do not establish a skull attachment or a complete serial muscle.',
    pathology: {
      body: 'Paraspinal strain can cause back pain; pain alone does not identify the affected erector-spinae column.',
      bullets: [
        'Back pain with new bladder/bowel dysfunction, saddle sensory loss or symptoms in both legs needs emergency assessment; in the UK call 999 or attend A&E.',
      ],
    },
    clinical: {
      body: 'Iliocostalis lies lateral to longissimus, with spinalis medial; these columns contribute together to trunk control.',
      bullets: [
        'A selected column is not an isolated strength test, an MRI diagnosis or a validated injection target.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
      'https://www.nhs.uk/conditions/back-pain/',
    ],
  },
  {
    key: 'semispinalis-thoracis',
    identities: [
      ['FMA22872', 'right', 'isa', ['FJ1540'], 'spine', ['spine']],
      ['FMA22873', 'left', 'isa', ['FJ1540M'], 'spine', ['spine']],
    ],
    scope:
      'Thoracic semispinalis selection, not semispinalis capitis. No cranial attachment or individual nerve territory is established by this mesh.',
    pathology: {
      body: 'Local deep-back tenderness is not evidence of an isolated semispinalis thoracis disorder.',
      bullets: [
        'The source surface is not a patient lesion and cannot explain pain by itself.',
      ],
    },
    clinical: {
      body: 'Keep thoracic semispinalis distinct from its cervical and head-related namesakes when localising a clinical question.',
      bullets: [
        'Its contribution to spinal movement is shared with other deep muscles; a single-fibre bedside test is not provided.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
      'https://www.ncbi.nlm.nih.gov/books/NBK537074/',
    ],
  },
  {
    key: 'serratus-posterior',
    identities: [
      ['FMA13405', 'right', 'isa', ['FJ1541'], 'spine', ['spine']],
      ['FMA13406', 'left', 'isa', ['FJ1541M'], 'spine', ['spine']],
      ['FMA13403', 'right', 'isa', ['FJ1542'], 'spine', ['spine']],
      ['FMA13404', 'left', 'isa', ['FJ1542M'], 'spine', ['spine']],
    ],
    scope:
      'Shared context for separate superior and inferior posterior serratus selections. Their respiratory role is debated; no symptomatic trigger point or contraction is validated.',
    pathology: {
      body: 'Posterior rib-region pain is not proof of a serratus posterior lesion.',
      bullets: [
        'Do not transfer serratus-anterior winging or long-thoracic neuropathy teaching to these posterior muscles.',
      ],
    },
    clinical: {
      body: 'Identify the posterior rib relationship before interpreting the similar names.',
      bullets: [
        'These muscles are distinct from serratus anterior; neither mesh proves respiratory impairment.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK538321/',
      'https://pubmed.ncbi.nlm.nih.gov/18196199/',
    ],
  },
  {
    key: 'lateral-lumbar-intertransversarii',
    identities: [
      [
        'FMA22850',
        'midline',
        'isa',
        ['FJ1547', 'FJ1547M'],
        'spine',
        ['spine', 'abdomen'],
      ],
    ],
    scope:
      'Bilateral lateral-lumbar group, not one midline muscle or a separately adjudicated slip at every level.',
    pathology: {
      body: 'The atlas contains no validated isolated disease pattern for the lateral lumbar intertransversarii.',
      bullets: [
        'A model gap or asymmetry is not evidence of muscle wasting or injury.',
      ],
    },
    clinical: {
      body: 'Use the lateral lumbar intertransverse location to distinguish this group from its medial counterpart.',
      bullets: [
        'Do not assign a specific affected spinal root from a single selected surface.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'medial-lumbar-intertransversarii',
    identities: [
      [
        'FMA22851',
        'midline',
        'isa',
        ['FJ1548', 'FJ1548M'],
        'spine',
        ['spine', 'abdomen'],
      ],
    ],
    scope:
      'Bilateral medial-lumbar group; serial levels and individual motor branches have not been segmented.',
    pathology: {
      body: 'Deep lumbar symptoms cannot be localised to this small group from the reference model.',
      bullets: ['No tear, denervation or diagnostic test is represented here.'],
    },
    clinical: {
      body: 'Keep medial and lateral intertransverse groups separate when relating source anatomy to a clinical question.',
      bullets: [
        'Neither grouping is an isolated bedside muscle test or a patient-specific root map.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
    ],
  },
  {
    key: 'thoracic-interspinales',
    identities: [
      ['FMA22890', 'right', 'isa', ['FJ1551'], 'spine', ['spine']],
      ['FMA22891', 'left', 'isa', ['FJ1551M'], 'spine', ['spine']],
    ],
    scope:
      'Thoracic interspinal slips are sparse and variable. This selection does not prove a muscle at every interspinous level.',
    pathology: {
      body: 'Pain between spinous processes is not synonymous with an interspinal muscle injury.',
      bullets: [
        'Muscle, ligament and bony structures remain distinct; a source surface does not establish the pain generator.',
      ],
    },
    clinical: {
      body: 'Distinguish an interspinal muscle from an interspinous ligament and from the adjacent spinous processes.',
      bullets: [
        'An explode gap is artificial and must not be read as traumatic separation.',
      ],
    },
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html',
      'https://www.ncbi.nlm.nih.gov/books/NBK537074/',
    ],
  },
  {
    key: 'coccygeus',
    identities: [
      ['FMA46443', 'right', 'isa', ['FJ2547'], 'pelvis', ['pelvis']],
      ['FMA46444', 'left', 'isa', ['FJ1449M', 'FJ2542'], 'pelvis', ['pelvis']],
    ],
    scope:
      'Posterior pelvic-diaphragm reference, not complete pelvic-floor, sphincter or female-pelvis geometry. Left source has two components and right one; this does not establish a patient asymmetry.',
    pathology: {
      body: 'Tailbone pain and pelvic-floor dysfunction are not synonymous with an isolated coccygeus injury.',
      bullets: [
        'Pelvic-floor problems may involve impaired relaxation as well as weakness; symptoms do not identify this muscle alone.',
      ],
    },
    clinical: {
      body: 'Relate coccygeus to the ischial spine, lower sacrum and coccyx, alongside the sacrospinous ligament.',
      bullets: [
        'A reference surface cannot assess continence, resting tone or treatment needs. Do not automatically prescribe strengthening for pelvic pain.',
        'For interstitial cystitis with tight pelvic-floor muscles, specialist physiotherapy may focus on relaxation; this is not a general exercise prescription.',
      ],
    },
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK482258/',
      'https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html',
      'https://www.niddk.nih.gov/health-information/urologic-diseases/interstitial-cystitis-bladder-pain-syndrome/treatment',
    ],
  },
];

const byFma = new Map(
  trunkClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function trunkClinicalLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'pathology' && tab !== 'clinical') ||
    s.system !== 'muscles' ||
    s.category !== 'muscle'
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match) return undefined;
  const [, side, tree, files, region, regions] = match.identity;
  if (
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
