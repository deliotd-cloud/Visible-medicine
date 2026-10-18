import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

type AxialConnectiveClinicalIdentity = readonly [
  fma: string,
  side: string,
  tree: 'isa' | 'partof',
  files: readonly string[],
  region: string,
  regions: readonly string[],
  category: 'cartilage',
];
interface AxialConnectiveClinicalGroup {
  key: string;
  identities: readonly AxialConnectiveClinicalIdentity[];
  scope: string;
  pathology: { body: string; bullets: readonly string[] };
  clinical: { body: string; bullets: readonly string[] };
  references: readonly string[];
}
// Original, source-linked teaching; source names do not certify imaging levels.
export const axialConnectiveClinicalGroups: readonly AxialConnectiveClinicalGroup[] =
  [
    {
      key: 'costal-cartilages',
      identities: [
        [
          'FMA7875',
          'right',
          'isa',
          ['FJ3333'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8005',
          'left',
          'isa',
          ['FJ3239'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA7886',
          'right',
          'isa',
          ['FJ3335'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8031',
          'left',
          'isa',
          ['FJ3242'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA7913',
          'right',
          'isa',
          ['FJ3337'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8058',
          'left',
          'isa',
          ['FJ3245'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA7976',
          'right',
          'isa',
          ['FJ3339'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8167',
          'left',
          'isa',
          ['FJ3248'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8070',
          'right',
          'isa',
          ['FJ3341'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8112',
          'left',
          'isa',
          ['FJ3251'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8194',
          'right',
          'isa',
          ['FJ3343'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8221',
          'left',
          'isa',
          ['FJ3254'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8248',
          'right',
          'isa',
          ['FJ3345'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
        [
          'FMA8275',
          'left',
          'isa',
          ['FJ3255'],
          'thorax',
          ['thorax'],
          'cartilage',
        ],
      ],
      pathology: {
        body: 'Costochondritis is inflammation near the rib–breastbone connections and can cause anterior chest pain. Pain may worsen with movement, deep breathing or pressure, but these features do not prove that the cause is harmless or localise disease to this selected cartilage.',
        bullets: [
          'This shared clinical example is not a claim that every numbered cartilage is affected equally.',
          'A coloured cartilage surface contains no finding of inflammation, fracture or infection.',
        ],
      },
      clinical: {
        body: 'Unexplained chest pain needs medical assessment. In the UK, call 999 for sudden chest pain, pain spreading to the arm, neck or jaw, chest tightness, or chest pain with difficulty breathing. Do not use tenderness or the atlas to exclude a heart or lung emergency.',
        bullets: [
          'Retain the named rib, sternum and side for orientation; the first sternocostal connection is not the same joint type as all the others.',
          'No palpation test, injection site, treatment regimen or recovery timetable is provided.',
        ],
      },
      scope:
        'One independently indexed costal-cartilage surface per selection, covering ribs one to seven on each side. No diseased cartilage, joint cavity or internal cartilage architecture is segmented; no breathing-mechanics simulation.',
      references: ['https://www.nhs.uk/conditions/costochondritis/'],
    },
    {
      key: 'cervical-discs',
      identities: [
        [
          'FMA25058',
          'midline',
          'isa',
          ['FJ3202'],
          'spine',
          ['spine', 'head-neck'],
          'cartilage',
        ],
        [
          'FMA13896',
          'midline',
          'isa',
          ['FJ3213'],
          'spine',
          ['spine', 'head-neck'],
          'cartilage',
        ],
        [
          'FMA13897',
          'midline',
          'isa',
          ['FJ3218'],
          'spine',
          ['spine', 'head-neck'],
          'cartilage',
        ],
        [
          'FMA13898',
          'midline',
          'isa',
          ['FJ3219'],
          'spine',
          ['spine', 'head-neck'],
          'cartilage',
        ],
        [
          'FMA13899',
          'midline',
          'isa',
          ['FJ3220'],
          'spine',
          ['spine', 'head-neck'],
          'cartilage',
        ],
        [
          'FMA13900',
          'midline',
          'isa',
          ['FJ3221'],
          'spine',
          ['spine', 'head-neck'],
          'cartilage',
        ],
      ],
      pathology: {
        body: "A cervical disc herniation can irritate or compress a nerve root, producing radicular arm symptoms. Compression affecting the spinal cord is a different problem, termed myelopathy; a disc abnormality and a patient's symptoms must be assessed together.",
        bullets: [
          'Radiculopathy and myelopathy are not interchangeable labels for neck pain.',
          'The whole-disc surface cannot show a displaced fragment, foraminal narrowing or actual nerve/cord compression.',
        ],
      },
      clinical: {
        body: 'Assessment distinguishes neck and arm symptoms from hand clumsiness, altered walking or other signs of spinal-cord dysfunction. New or worsening weakness, loss of coordination or bladder/bowel changes require urgent assessment, not an atlas-based level diagnosis.',
        bullets: [
          'Clinical examination and appropriate imaging establish the affected structures. The displayed source name does not determine a symptomatic nerve root.',
          'No neck-provocation manoeuvre, decompression route, implant choice or clearance for manipulation is supplied.',
        ],
      },
      scope:
        'Whole-disc source surfaces only; annulus, nucleus and endplates are not separately segmented. Source vertebral names are retained, not validated radiological level labels; no inferred C1–C2 disc or patient registration.',
      references: [
        'https://www.orthoinfo.org/diseases--conditions/cervical-radiculopathy-pinched-nerve/',
        'https://www.orthoinfo.org/diseases--conditions/cervical-spondylotic-myelopathy-spinal-cord-compression',
        'https://eastsussexmsk.nhs.uk/early-warning-signs-of-spinal-cord-compression/',
      ],
    },
    {
      key: 'thoracic-discs',
      identities: [
        [
          'FMA10458',
          'midline',
          'isa',
          ['FJ3222'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13495',
          'midline',
          'isa',
          ['FJ3223'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13500',
          'midline',
          'isa',
          ['FJ3224'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13501',
          'midline',
          'isa',
          ['FJ3203'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13502',
          'midline',
          'isa',
          ['FJ3204'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13503',
          'midline',
          'isa',
          ['FJ3205'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13504',
          'midline',
          'isa',
          ['FJ3206'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13505',
          'midline',
          'isa',
          ['FJ3207'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13506',
          'midline',
          'isa',
          ['FJ3208'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13507',
          'midline',
          'isa',
          ['FJ3209'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
        [
          'FMA13508',
          'midline',
          'isa',
          ['FJ3210'],
          'spine',
          ['spine', 'thorax'],
          'cartilage',
        ],
      ],
      pathology: {
        body: 'A thoracic disc prolapse can compress the spinal cord and cause myelopathy. This is distinct from a local chest-wall problem: the anatomical region of discomfort alone cannot establish whether its origin is spinal, musculoskeletal or elsewhere.',
        bullets: [
          'Leg weakness, altered sensation or walking difficulty can matter even when the selected structure is in the thoracic spine.',
          'A static exterior disc does not demonstrate compression, cord injury or the severity of a real lesion.',
        ],
      },
      clinical: {
        body: 'New weakness, increasing unsteadiness, changes in sensation or bladder/bowel control need urgent medical assessment. A combination suggesting spinal-cord dysfunction requires immediate assessment in A&E in the UK; do not wait for the atlas to identify a level.',
        bullets: [
          'Use the assembled vertebral context for orientation, not to infer which side or neural segment is affected.',
          'Source names remain separate from a validated scan-level map. Neither a spinal-canal clearance measurement nor a surgical access path is provided.',
        ],
      },
      scope:
        'Eleven indexed thoracic whole-disc surfaces, not proof of complete thoracic disc coverage. Annulus, nucleus and endplates are not separately segmented; no missing level is filled by interpolation or renamed.',
      references: [
        'https://eastsussexmsk.nhs.uk/early-warning-signs-of-spinal-cord-compression/',
        'https://www.aans.org/patients/conditions-treatments/spinal-pain/',
      ],
    },
    {
      key: 'lumbar-discs',
      identities: [
        [
          'FMA16033',
          'midline',
          'isa',
          ['FJ3212'],
          'spine',
          ['spine', 'abdomen'],
          'cartilage',
        ],
        [
          'FMA16034',
          'midline',
          'isa',
          ['FJ3214'],
          'spine',
          ['spine', 'abdomen'],
          'cartilage',
        ],
        [
          'FMA16035',
          'midline',
          'isa',
          ['FJ3215'],
          'spine',
          ['spine', 'abdomen'],
          'cartilage',
        ],
        [
          'FMA16036',
          'midline',
          'isa',
          ['FJ3216'],
          'spine',
          ['spine', 'abdomen'],
          'cartilage',
        ],
        [
          'FMA16037',
          'midline',
          'isa',
          ['FJ3217'],
          'spine',
          ['spine', 'abdomen'],
          'cartilage',
        ],
      ],
      pathology: {
        body: 'Lumbar disc herniation may irritate or compress nerve roots and cause radiating leg pain, altered sensation or weakness. A disc change may also be painless; its presence alone does not identify the cause of back pain.',
        bullets: [
          "The source's midline identity describes the reference disc, not the side of a patient's symptoms or herniation.",
          'The model does not separate the annulus from the nucleus or show a prolapsed fragment.',
        ],
      },
      clinical: {
        body: 'New loss of bladder or bowel control, numbness around the genitals or anus, or substantial/progressive leg weakness requires urgent medical assessment. Clinical examination and appropriate imaging establish the cause; an apparently intact model cannot exclude nerve compression.',
        bullets: [
          'Symptoms must be correlated with validated patient imaging before assigning a level or affected root.',
          'No straight-leg-raise simulation, injection target, disc-removal procedure or exercise prescription is supplied.',
        ],
      },
      scope:
        'Five indexed lumbar whole-disc surfaces. Source vertebral names are not validated radiological level labels, and vertebral variants are not resolved; no patient scan, conus/cauda-equina segmentation or registration is added.',
      references: [
        'https://www.aans.org/patients/conditions-treatments/herniated-disc/',
      ],
    },
  ];
const byFma = new Map(
  axialConnectiveClinicalGroups.flatMap((group) =>
    group.identities.map(
      (identity) => [identity[0], { group, identity }] as const,
    ),
  ),
);
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function axialConnectiveClinicalLesson(
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
