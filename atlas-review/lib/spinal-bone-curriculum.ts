import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface SpinalBoneLesson {
  fmaIds: readonly string[];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const cervical = books + 'NBK459200/';
const thoracic = books + 'NBK459153/';
const lumbar = books + 'NBK459278/';
const thoracicRole =
  'Supports the trunk and links the spine to the ribs. Joint geometry and the rib cage constrain movement.';
const surfaceLimit =
  'Bone surface only: named landmarks are teaching context, not separately selectable or independently validated substructures. Marrow, cortical thickness and joint cartilage are not resolved by this surface.';

// Original brief teaching; no source prose, images, scans or mechanics imported.
export const spinalBoneLessons: readonly SpinalBoneLesson[] = [
  {
    fmaIds: ['FMA12519'],
    anatomy:
      'C1 (atlas) is a ring with lateral masses and anterior/posterior arches, without a vertebral body. It meets the occipital condyles above and C2 below.',
    function:
      'Transfers head load through its lateral masses. Head nodding mainly involves the skull–C1 joints; turning mainly involves C1–C2.',
    distinction:
      'There is no C1–C2 intervertebral disc. Separating these bones does not demonstrate ligament stability or a safe range of movement.',
    references: [cervical],
  },
  {
    fmaIds: ['FMA12520'],
    anatomy:
      'C2 (axis) carries the dens, which projects upward behind the anterior arch of C1.',
    function:
      'Provides the pivot for atlas/head rotation and transfers load towards C3.',
    distinction:
      'The dens remains part of this C2 selection, not a separately validated mesh. Its relationship to the transverse ligament needs review.',
    references: [cervical],
  },
  {
    fmaIds: ['FMA12521', 'FMA12522', 'FMA12523', 'FMA12524'],
    anatomy:
      'A subaxial cervical vertebra with a body, posterior arch, articular processes and paired transverse foramina.',
    function:
      'Supports the neck while neighbouring discs and facet joints permit coordinated bending and turning.',
    distinction:
      'Spinous-process shape and arterial entry level vary; this reference surface is not a patient-specific vascular map.',
    references: [cervical],
  },
  {
    fmaIds: ['FMA12525'],
    anatomy:
      'C7 lies at the cervicothoracic junction and commonly has a long, non-bifid spinous process.',
    function:
      'Connects the mobile neck to the thoracic spine and provides muscle and ligament attachment sites.',
    distinction:
      'A prominent process alone cannot confirm vertebral numbering. The vertebral artery usually enters at C6, not C7, but variants occur.',
    references: [cervical],
  },
  {
    fmaIds: ['FMA9165'],
    anatomy:
      'T1 has a complete costal facet on each side for rib 1 and an inferior demifacet for rib 2.',
    function: thoracicRole,
    distinction:
      'The upper thoracic transition is not identical to a typical mid-thoracic vertebra. Costal facets remain part of this bone selection.',
    references: [thoracic],
  },
  {
    fmaIds: [
      'FMA9187',
      'FMA9209',
      'FMA9248',
      'FMA9922',
      'FMA9945',
      'FMA9968',
      'FMA9991',
    ],
    anatomy:
      'A rib-bearing thoracic vertebra, typically with paired body demifacets and transverse costal facets. Adjacent body demifacets share a rib-head articulation.',
    function: thoracicRole,
    distinction:
      'Level-specific facet shape and rib contact need review; the viewer does not calculate joint contact or breathing movement.',
    references: [thoracic],
  },
  {
    fmaIds: ['FMA10014'],
    anatomy:
      'T9 is near the lower thoracic transition. Its inferior costal demifacet may be absent when rib 10 articulates only with T10.',
    function: thoracicRole,
    distinction:
      'Do not infer a universal T9–rib 10 articulation from the label; variant facet patterns are not classified here.',
    references: [thoracic],
  },
  {
    fmaIds: ['FMA10037'],
    anatomy:
      'T10 bears the tenth-rib articulation; its costal facet pattern is variable and may differ from the paired demifacets above.',
    function: thoracicRole,
    distinction:
      'This source label does not certify which T9/T10 facet variant the mesh depicts.',
    references: [thoracic],
  },
  {
    fmaIds: ['FMA10059'],
    anatomy:
      'T11 has a complete costal facet on each side for rib 11, without a transverse costal facet.',
    function: thoracicRole,
    distinction:
      'Do not assume the rib-tubercle articulation of the upper thoracic region also exists at this level.',
    references: [thoracic],
  },
  {
    fmaIds: ['FMA10081'],
    anatomy:
      'T12 articulates with rib 12 without transverse costal facets. Its inferior articular processes have lumbar-like orientation.',
    function:
      'Forms a transition between the rib-bearing thoracic spine and the lumbar load-bearing region.',
    distinction:
      'A transitional shape is not a measured movement limit. Source numbering is not patient vertebral numbering.',
    references: [thoracic],
  },
  {
    fmaIds: ['FMA13072', 'FMA13073', 'FMA13074', 'FMA13075'],
    anatomy:
      'A lumbar vertebra with a large body and a posterior arch bearing short robust processes; mammillary processes lie on its superior articular processes.',
    function:
      'Carries axial load. Disc–facet motion segments allow bending while limiting axial rotation.',
    distinction:
      'The vertebral canal is not a solid spinal-cord mesh. Bone level and spinal-cord segment must not be treated as interchangeable.',
    references: [lumbar, books + 'NBK551653/'],
  },
  {
    fmaIds: ['FMA13076'],
    anatomy:
      'L5 meets the sacrum. Its substantial, commonly anteriorly taller body contributes to the lumbosacral angle.',
    function:
      'Transfers trunk load towards the sacrum; the disc, facets and surrounding ligaments help resist displacement.',
    distinction:
      'Lumbosacral transitional anatomy varies. This fixed reference cannot establish a patient’s level count, alignment or instability.',
    references: [lumbar],
  },
  {
    fmaIds: ['FMA16202'],
    anatomy:
      'The sacrum is usually formed by five fused vertebrae. It lies below L5, between the hip bones, with a canal continuing through it.',
    function:
      'Transfers forces between the spine and pelvis through the sacroiliac connections and provides muscle and ligament attachments.',
    distinction:
      'One fused-bone selection, not five independently dissectible sacral vertebrae. Coccyx, canal contents and foramina are not validated separate components of this selection.',
    references: [books + 'NBK551653/'],
  },
];
const byFma = new Map(
  spinalBoneLessons.flatMap((l) => l.fmaIds.map((id) => [id, l] as const)),
);
export function spinalBoneLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'skeleton' ||
    s.category !== 'bone' ||
    s.region !== 'spine' ||
    !s.regions.includes('spine') ||
    s.laterality !== 'midline' ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l) return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Structure & relationships' : 'Role & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            surfaceLimit,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component. Exact boundaries require independent review.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, physiological joint motion or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
