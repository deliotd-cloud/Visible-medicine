import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface ConnectiveAnatomyDefinition {
  fmaId: string;
  side: 'right' | 'left' | 'midline';
  category: 'ligament' | 'tendon' | 'cartilage';
  region: 'foot' | 'leg' | 'spine';
  regions: readonly string[];
  anatomy: string;
  relationships: string;
  distinction: string;
  references: readonly string[];
}
const back = 'https://anatomy.ttuhscep.edu/anatomytables/joints_back.html';
const discs = 'https://www.ncbi.nlm.nih.gov/books/NBK470583/';
function pair(
  ids: readonly [string, string],
  definition: Omit<ConnectiveAnatomyDefinition, 'fmaId' | 'side'>,
): ConnectiveAnatomyDefinition[] {
  return ids.map((fmaId, i) => ({
    ...definition,
    fmaId,
    side: i === 0 ? 'right' : 'left',
  }));
}
const discGroups = {
  cervical: {
    regions: ['spine', 'head-neck'],
    anatomy:
      'Cervical interbody discs form fibrocartilaginous joints between adjacent vertebral bodies. An annulus fibrosus surrounds the central nucleus pulposus; cartilaginous endplates interface with the vertebral bodies.',
    relationships:
      'The normal disc series begins below the axis, at C2–C3; there is no intervertebral disc between atlas and axis. Disc joints are distinct from the posterior synovial facet joints.',
  },
  thoracic: {
    regions: ['spine', 'thorax'],
    anatomy:
      'Thoracic interbody discs join vertebral bodies in the rib-bearing spine. Their fibrous annulus encloses a nucleus pulposus, with endplates at the superior and inferior interfaces.',
    relationships:
      'The posterior longitudinal ligament runs behind the vertebral bodies and discs within the vertebral canal. It is a separate structure, not the disc annulus.',
  },
  lumbar: {
    regions: ['spine', 'abdomen'],
    anatomy:
      'Lumbar interbody discs connect neighbouring vertebral bodies in the lower back. Concentric annular tissue surrounds the nucleus pulposus, and cartilaginous endplates separate disc tissue from the vertebral bodies.',
    relationships:
      'These interbody joints are distinct from the paired posterior facet joints. A disc-level name alone does not establish a nerve-root lesion or a patient-specific vertebral count.',
  },
} as const;
// Source names are preserved. They are not validated two-vertebra imaging labels.
export const connectiveDiscIdentities = [
  ['FMA25058', 'axis', 'cervical'],
  ['FMA13896', 'third cervical vertebra', 'cervical'],
  ['FMA13897', 'fourth cervical vertebra', 'cervical'],
  ['FMA13898', 'fifth cervical vertebra', 'cervical'],
  ['FMA13899', 'sixth cervical vertebra', 'cervical'],
  ['FMA13900', 'seventh cervical vertebra', 'cervical'],
  ['FMA10458', 'first thoracic vertebra', 'thoracic'],
  ['FMA13495', 'second thoracic vertebra', 'thoracic'],
  ['FMA13500', 'third thoracic vertebra', 'thoracic'],
  ['FMA13501', 'fourth thoracic vertebra', 'thoracic'],
  ['FMA13502', 'fifth thoracic vertebra', 'thoracic'],
  ['FMA13503', 'sixth thoracic vertebra', 'thoracic'],
  ['FMA13504', 'seventh thoracic vertebra', 'thoracic'],
  ['FMA13505', 'eighth thoracic vertebra', 'thoracic'],
  ['FMA13506', 'ninth thoracic vertebra', 'thoracic'],
  ['FMA13507', 'tenth thoracic vertebra', 'thoracic'],
  ['FMA13508', 'eleventh thoracic vertebra', 'thoracic'],
  ['FMA16033', 'first lumbar vertebra', 'lumbar'],
  ['FMA16034', 'second lumbar vertebra', 'lumbar'],
  ['FMA16035', 'third lumbar vertebra', 'lumbar'],
  ['FMA16036', 'fourth lumbar vertebra', 'lumbar'],
  ['FMA16037', 'fifth lumbar vertebra', 'lumbar'],
] as const;
export const connectiveAnatomyLessons: readonly ConnectiveAnatomyDefinition[] =
  [
    ...pair(['FMA44249', 'FMA44250'], {
      category: 'ligament',
      region: 'foot',
      regions: ['foot'],
      anatomy:
        'The long plantar ligament spans the sole from the calcaneus to the cuboid, with superficial fibres continuing toward the lateral metatarsal bases.',
      relationships:
        'Its superficial extension contributes to a tunnel for the fibularis longus tendon. The short plantar ligament lies deeper; neither should be confused with the plantar aponeurosis.',
      distinction:
        'This selection does not separately show deep/superficial fascicles or validate each attachment footprint. A nearby tendon surface does not prove a complete tunnel.',
      references: [
        'https://anatomy.ttuhscep.edu/anatomytables/joints_lowerlimb.html',
        'https://anatomy.ttuhscep.edu/schemes/joints_lower_ans.html',
      ],
    }),
    ...pair(['FMA258847', 'FMA264844'], {
      category: 'tendon',
      region: 'leg',
      regions: ['leg', 'foot'],
      anatomy:
        'The calcaneal (Achilles) tendon continues from gastrocnemius and soleus down the back of the distal leg to attach to the posterior calcaneus.',
      relationships:
        'It connects calf muscle force to the heel across the back of the ankle. It is tendon tissue, not a ligament joining two bones.',
      distinction:
        'Subtendons, paratenon, bursae and a validated insertion footprint are not independently resolved. Exploding this surface does not model tendon strain or rupture.',
      references: [
        'https://anatomy.ttuhscep.edu/anatomytables/muscles_lowerlimb.html',
      ],
    }),
    ...connectiveDiscIdentities.map(
      ([fmaId, sourceLevel, group]): ConnectiveAnatomyDefinition => ({
        fmaId,
        side: 'midline',
        category: 'cartilage',
        region: 'spine',
        ...discGroups[group],
        distinction: `Source designation: intervertebral disk of ${sourceLevel}. This whole-disc surface does not separate annulus, nucleus or endplates. The source designation is not a validated radiological interval; one additional source disc remains unresolved.`,
        references: [back, discs],
      }),
    ),
  ];
const byFma = new Map(connectiveAnatomyLessons.map((l) => [l.fmaId, l]));
export function connectiveAnatomyLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  const l = byFma.get(s.fmaId);
  if (
    !l ||
    tab !== 'anatomy' ||
    s.system !== 'connective' ||
    s.category !== l.category ||
    s.laterality !== l.side ||
    s.region !== l.region ||
    !l.regions.every((r) => s.regions.includes(r))
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · Anatomy & relationships · draft`,
    body: l.anatomy,
    bullets: [
      l.relationships,
      l.distinction,
      `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. A surface count is not a count of tissue layers or validated attachments.`,
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/clipping controls are teaching aids, not physiological deformation, acquired imaging or procedure guidance.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
