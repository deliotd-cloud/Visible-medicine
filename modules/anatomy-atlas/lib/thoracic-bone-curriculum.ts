import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface ThoracicBoneLesson {
  // A single midline identity, or a right/left pair in that exact order.
  fmaIds: readonly [string] | readonly [string, string];
  anatomy: string;
  function: string;
  distinction: string;
  references: readonly string[];
}
const books = 'https://www.ncbi.nlm.nih.gov/books/';
const ribs = books + 'NBK538328/';
const facets = books + 'NBK459153/';
const sternum = books + 'NBK541141/';
const angle = books + 'NBK459336/';
const margin = 'https://pubmed.ncbi.nlm.nih.gov/37982795/';
const role =
  'Contributes to the chest framework and muscle-driven changes in thoracic dimensions during breathing. Bone does not actively contract.';
const boneLimit =
  'Bone surface only: named facets, grooves and attachment sites are not independently segmented or validated. Cartilage, joint cavities, marrow and cortical thickness are not supplied by this selection.';

function typicalRib(
  n: number,
  fmaIds: readonly [string, string],
): ThoracicBoneLesson {
  return {
    fmaIds,
    anatomy:
      `Rib ${n} has a head, neck, tubercle and curved shaft. Its head typically meets T${n - 1} and T${n}; its tubercle meets the T${n} transverse process. ` +
      (n <= 7
        ? 'Its own costal cartilage connects it to the sternum.'
        : 'It usually connects anteriorly through the costal margin rather than directly to the sternum.'),
    function: role,
    distinction:
      n <= 7
        ? 'The bone–cartilage boundary is not the sternocostal joint. A fixed surface does not establish rib excursion or a procedural access corridor.'
        : 'Lower-rib cartilage connections and tip mobility vary. Cadaver observations are not a diagnosis of instability or slipping rib syndrome in this reference model.',
    references: n <= 7 ? [ribs, facets] : [facets, margin],
  };
}

// Original bounded notes; no source prose, figures, scans or datasets imported.
export const thoracicBoneLessons: readonly ThoracicBoneLesson[] = [
  {
    fmaIds: ['FMA7857', 'FMA7987'],
    anatomy:
      'The first rib is short and broad, with a head articulating with T1. Its cartilage connects anteriorly to the manubrium.',
    function:
      'Forms part of the upper thoracic boundary and provides anchorage within the neck–chest framework.',
    distinction:
      'The first sternocostal connection differs from the usual synovial pattern below. Bone selection does not certify its cartilage, vascular grooves or adjacent neurovascular clearance.',
    references: [ribs, sternum],
  },
  {
    fmaIds: ['FMA7882', 'FMA8012'],
    anatomy:
      'The second rib has a serratus-anterior attachment area. Its cartilage reaches the manubrium–sternal-body junction at the sternal angle.',
    function: role,
    distinction:
      'This rib–sternal-angle relationship supports orientation, not verified patient rib counting or a precisely registered T4/T5 plane.',
    references: [ribs, angle],
  },
  typicalRib(3, ['FMA7909', 'FMA8039']),
  typicalRib(4, ['FMA7957', 'FMA8148']),
  typicalRib(5, ['FMA8066', 'FMA8093']),
  typicalRib(6, ['FMA8175', 'FMA8202']),
  typicalRib(7, ['FMA8229', 'FMA8256']),
  typicalRib(8, ['FMA8283', 'FMA8310']),
  typicalRib(9, ['FMA8364', 'FMA8391']),
  {
    fmaIds: ['FMA8445', 'FMA8472'],
    anatomy:
      'The tenth rib meets the lower thoracic spine. Its anterior connection is variable: it may join the costal margin or have an unattached tip.',
    function:
      'Contributes to the lower chest framework; its attachments influence how forces are transmitted locally.',
    distinction:
      'Posterior facet pattern and anterior cartilage attachment are separate questions. Neither is classified from this surface; study frequencies are not applied to an individual or used to diagnose disease.',
    references: [facets, margin],
  },
  {
    fmaIds: ['FMA8531', 'FMA8532'],
    anatomy:
      'Rib 11 articulates posteriorly with T11 but lacks a costotransverse joint. Its anterior end does not attach to the sternum.',
    function:
      'Provides lower chest-wall support and muscle attachments without a direct anterior sternal connection.',
    distinction:
      'Floating describes the anterior attachment pattern, not a loose bone or a permissible direction of dissection.',
    references: [ribs, facets],
  },
  {
    fmaIds: ['FMA8533', 'FMA8534'],
    anatomy:
      'Rib 12 is the lowest rib in this source numbering. It meets T12, lacks a costotransverse joint and has no anterior sternal attachment.',
    function:
      'Contributes attachment and support at the thoracoabdominal boundary.',
    distinction:
      'Rib length and regional relationships vary. This selection does not map the pleural reflection, kidney border or a safe needle path.',
    references: [ribs, facets],
  },
  {
    fmaIds: ['FMA7486'],
    anatomy:
      'The broad upper sternum bears the jugular notch and clavicular notches. It meets both clavicles, the first costal cartilages and the sternal body.',
    function:
      'Links the anterior thoracic framework to the shoulder girdles and supports muscle attachments.',
    distinction:
      'The manubrium is one part of the sternum, not the whole breastbone. Its joint cartilage and exact attachment areas are not separate validated components.',
    references: [sternum],
  },
  {
    fmaIds: ['FMA7487'],
    anatomy:
      'The long middle sternum lies between manubrium and xiphoid. Rib cartilages 3–7 meet its sides; the second reaches the upper manubriosternal junction.',
    function:
      'Provides central anterior chest support, protection and muscle attachment.',
    distinction:
      'The source separates three sternal entries for selection. This does not establish freely mobile joints, a universal fusion age or a sternotomy plane.',
    references: [sternum, angle],
  },
  {
    fmaIds: ['FMA7488'],
    anatomy:
      'The xiphoid is the inferior sternal component. Its shape and degree of ossification vary considerably.',
    function:
      'Provides attachment at the junction of the diaphragm and anterior abdominal-wall framework.',
    distinction:
      'This source labels it as bone, not an age-resolved cartilage-to-bone model. Its appearance is not a fixed-age marker, fracture diagnosis or recommended compression target.',
    references: [sternum],
  },
];
const byFma = new Map(
  thoracicBoneLessons.flatMap((l) =>
    l.fmaIds.map(
      (id, i) =>
        [
          id,
          {
            lesson: l,
            side:
              l.fmaIds.length === 1 ? 'midline' : i === 0 ? 'right' : 'left',
          },
        ] as const,
    ),
  ),
);
export function thoracicBoneLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'skeleton' ||
    s.category !== 'bone' ||
    s.region !== 'thorax' ||
    !s.regions.includes('thorax') ||
    (tab !== 'anatomy' && tab !== 'function')
  )
    return undefined;
  const match = byFma.get(s.fmaId);
  if (!match || s.laterality !== match.side) return undefined;
  const l = match.lesson;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Structure & relationships' : 'Role & limits'} · draft`,
    body: l[tab],
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            boneLimit,
            `Source identity: ${s.fmaId} · ${s.sources.length} source component. Boundaries and attachments require independent review.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, physiological rib motion, breathing mechanics or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
