import type { TissueRule, DissectionView } from '../app/dissection-data';

const back = 'https://anatomy.ttuhscep.edu/anatomytables/muscles_back.html';
export type AxialGroup = {
  id: string;
  name: string;
  fmaIds: string[];
  anatomy: string;
  function: string;
  caution: string;
  references: string[];
};
// Original, concise teaching summaries. No copied illustrations or table datasets.
export const axialGroups: AxialGroup[] = [
  {
    id: 'wrist-retinaculum',
    name: 'Wrist flexor retinacula',
    fmaIds: ['FMA40120', 'FMA40121'],
    anatomy:
      'The flexor retinaculum bridges the palmar carpal arch, between the scaphoid/trapezium and pisiform/hamate sides.',
    function:
      'With the carpal bones it forms the carpal tunnel. The tunnel normally carries the median nerve and long digital flexor tendons.',
    caution:
      'Median nerves, synovial sheaths and a validated carpal-tunnel lumen are absent. A source surface is not proof of attachment footprints or tunnel dimensions.',
    references: [
      'https://anatomy.ttuhscep.edu/musculoskeletal_system/hand_tables.html',
    ],
  },
  {
    id: 'iliotibial',
    name: 'Iliotibial tracts',
    fmaIds: ['FMA58776', 'FMA58777'],
    anatomy:
      'The iliotibial tract is a thickened lateral part of the fascia lata with connections to the femur and proximal lateral tibia.',
    function:
      'It transmits forces within the lateral hip–thigh–knee complex. Its mechanics depend on connections to surrounding tissues, not a freely sliding isolated cord.',
    caution:
      'The displayed tract is not a complete fascia-lata sheet. Separate deep attachments, laminae, insertion footprints and knee mechanics have not been validated.',
    references: [
      'https://pubmed.ncbi.nlm.nih.gov/17349469/',
      'https://pmc.ncbi.nlm.nih.gov/articles/PMC2100245/',
    ],
  },
  {
    id: 'linea-alba',
    name: 'Linea alba',
    fmaIds: ['FMA11336'],
    anatomy:
      'The linea alba is the midline aponeurotic junction of the anterior abdominal wall, extending between the xiphoid region and pubis.',
    function: 'It unites the abdominal muscle aponeuroses across the midline.',
    caution:
      'The rectus sheath, layered abdominal aponeuroses and rectus-abdominis surfaces are not established by this view. Do not infer an intact wall, diastasis or a surgical plane.',
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/topogr_abdomen.html',
    ],
  },
  {
    id: 'interspinales',
    name: 'Interspinal muscle sets',
    fmaIds: ['FMA71307', 'FMA71309'],
    anatomy:
      'Interspinal muscles occupy short intervals between spinous processes. The cervical and lumbar source sets are separate selectable entries.',
    function:
      'These short deep muscles contribute to extension of the neck and trunk.',
    caution:
      'Each source set groups multiple components across both sides. Individual fascicles, attachments and vertebral levels are not independently labelled.',
    references: [back],
  },
  {
    id: 'cervical-intertransversarii',
    name: 'Cervical intertransverse muscle sets',
    fmaIds: ['FMA71442', 'FMA71443'],
    anatomy:
      'The anterior and posterior cervical intertransverse sets are represented separately, beside the cervical transverse processes.',
    function:
      'Intertransverse muscles contribute to lateral bending. This draft does not assign a uniform nerve supply to all subdivisions.',
    caution:
      'These are bilateral grouped source sets, not per-level or per-side segmentation. Their exact anterior/posterior relationships and attachments require specialist review.',
    references: [back],
  },
  {
    id: 'levatores-breves',
    name: 'Short rib-elevator muscle sets',
    fmaIds: ['FMA74077', 'FMA74078'],
    anatomy:
      'Levatores costarum run from vertebral transverse processes towards the ribs. The source-labelled breves are available as right and left sets.',
    function: 'These muscles assist rib elevation.',
    caution:
      'Per-rib fascicles and endpoints are not validated. The separate source-labelled longi candidates remain withheld for level, fibre-course and overlap review.',
    references: [
      'https://anatomy.ttuhscep.edu/anatomytables/muscles_thorax.html',
    ],
  },
];
export const axialGroupFor = (fmaId: string) =>
  axialGroups.find((g) => g.fmaIds.includes(fmaId));

export type AxialStudy = {
  id: string;
  title: string;
  regions: string[];
  targetFmaIds: string[];
  context: TissueRule[];
  view: DissectionView;
  description: string;
  inspect: string;
  landmarks: string[];
};
export const axialStudySets: AxialStudy[] = [
  {
    id: 'wrist-retinaculum',
    title: 'Retinaculum & carpal arch',
    regions: ['hand'],
    targetFmaIds: ['FMA40120', 'FMA40121'],
    context: [
      {
        systems: ['skeleton'],
        pattern:
          '(?:scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)$',
      },
    ],
    view: 'anterior',
    description:
      'Keep only the carpal bones and supplied flexor retinacula. Finger bones and overlying muscles are set aside.',
    inspect:
      'Choose a side, then rotate around the arch or hide the retinaculum. This is a roof-and-bone study, not a complete carpal tunnel: the median nerve is absent.',
    landmarks: ['flexor retinaculum', 'scaphoid$', 'hamate$', 'pisiform$'],
  },
  {
    id: 'iliotibial-context',
    title: 'Lateral thigh & iliotibial tract',
    regions: ['thigh'],
    targetFmaIds: ['FMA58776', 'FMA58777'],
    context: [
      {
        fmaIds: [
          'FMA22328',
          'FMA22329',
          'FMA22425',
          'FMA22426',
          'FMA24474',
          'FMA24475',
          'FMA16586',
          'FMA16587',
        ],
      },
    ],
    view: 'right',
    description:
      'Compare the source tracts with the available tensor fasciae latae, gluteus maximus, hip bones and femora.',
    inspect:
      'Use the matching left/right view after choosing a side. Hide a muscle to expose the tract; use Knee & leg for the tibial context. Exploded positions are illustrative, not attachment measurements.',
    landmarks: ['iliotibial tract', 'tensor fasciae latae', 'gluteus maximus'],
  },
  {
    id: 'linea-alba-context',
    title: 'Anterior midline junction',
    regions: ['abdomen'],
    targetFmaIds: ['FMA11336'],
    context: [{ fmaIds: ['FMA13336', 'FMA13337'] }],
    view: 'anterior',
    description:
      'Remove the viscera to examine the linea alba and the available external-oblique surfaces.',
    inspect:
      'Inspect the narrow midline surface, then fade or hide the external oblique. This is not a complete abdominal-wall dissection; rectus muscles, sheath layers and internal aponeuroses are not shown here.',
    landmarks: ['linea alba', 'external oblique'],
  },
  {
    id: 'deep-cervical-sets',
    title: 'Deep cervical muscle sets',
    regions: ['spine', 'head-neck'],
    targetFmaIds: ['FMA71309', 'FMA71442', 'FMA71443'],
    context: [
      {
        systems: ['skeleton'],
        pattern:
          '^(atlas|axis|(?:third|fourth|fifth|sixth|seventh) cervical vertebra)$',
      },
    ],
    view: 'posterior',
    description:
      'A close cervical window with interspinal and anterior/posterior intertransverse sets. The remaining column and skull are excluded.',
    inspect:
      'Rotate to compare spinous and transverse-process relationships. Each muscle set stays bilateral under the side filter; individual levels are not segmented or attachment-validated.',
    landmarks: [
      'interspinales cervicis',
      'anterior cervical intertransversarii',
      'posterior cervical intertransversarii',
    ],
  },
  {
    id: 'deep-lumbar-sets',
    title: 'Deep lumbar muscle sets',
    regions: ['spine'],
    targetFmaIds: ['FMA71307'],
    context: [
      { fmaIds: ['FMA22850', 'FMA22851'] },
      { systems: ['skeleton'], pattern: 'lumbar vertebra$' },
    ],
    view: 'posterior',
    description:
      'Compare lumbar interspinal and existing intertransverse groups within a lumbar-only skeletal frame.',
    inspect:
      'Hide a vertebra to inspect the small muscles. Source groups are not individual level assignments; the central canal is not included and no complete spinal cord is implied.',
    landmarks: ['interspinales lumborum', 'lumbar intertransversarius'],
  },
  {
    id: 'rib-elevator-sets',
    title: 'Short rib-elevator sets',
    regions: ['thorax', 'spine'],
    targetFmaIds: ['FMA74077', 'FMA74078'],
    context: [
      {
        systems: ['skeleton'],
        pattern: '(?:thoracic vertebra|rib|seventh cervical vertebra)$',
      },
    ],
    view: 'posterior',
    description:
      'Inspect the source-labelled breves with the thoracic bones available in this region; lungs and superficial muscles are set aside.',
    inspect:
      'Use Thorax for the ribs and Spine & back for vertebral context. Individual rib attachments remain unvalidated. Longi alternatives are withheld rather than overlaid.',
    landmarks: ['levatores costarum breves'],
  },
];
