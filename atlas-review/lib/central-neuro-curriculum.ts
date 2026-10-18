import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface CentralNeuroLesson {
  fmaId: string;
  region: 'head-neck' | 'spine';
  category: 'organ' | 'space';
  anatomy: string;
  function: string;
  functionReadiness: 'draft' | 'pending';
  distinction: string;
  references: readonly string[];
}
// Original source-aware teaching; no new anatomy, tractography or scan content.
export const centralNeuroLessons: readonly CentralNeuroLesson[] = [
  {
    fmaId: 'FMA61970',
    region: 'head-neck',
    category: 'organ',
    anatomy:
      'The source-labelled commissure of the fornix is represented separately from the two fornix surfaces. Human histological work describes subtle commissural fibres beneath the splenium; their separation from adjacent callosal fibres is difficult.',
    function:
      'A settled structure-specific functional lesson remains pending. Human forniceal commissural connectivity and its precise functional contribution remain disputed; this surface does not establish a simple hippocampus-to-hippocampus pathway or a defined memory function.',
    functionReadiness: 'pending',
    distinction:
      'Do not transfer nonhuman-primate tracer findings, a proposed memory association or a tractography reconstruction directly onto this source mesh. Its identity and extent need specialist adjudication.',
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC9314404/'],
  },
  {
    fmaId: 'FMA62072',
    region: 'head-neck',
    category: 'organ',
    anatomy:
      'A separately selectable source-labelled commissural surface; its constituent pathways have not been segmented. The posterior commissure lies in the dorsal rostral-midbrain/pretectal region and is distinct from its neighbouring nuclei.',
    function:
      'Contains crossing connections involved in pupillary light responses and vertical gaze control. It is one part of distributed brainstem circuitry, not a complete reflex or eye-movement centre by itself.',
    functionReadiness: 'draft',
    distinction:
      'Commissural fibres and the nucleus of the posterior commissure are not interchangeable labels. Selecting this surface does not validate each connection, identify a lesion or simulate a pupillary response.',
    references: [
      'https://www.ncbi.nlm.nih.gov/books/NBK441892/',
      'https://neuro-ophthalmology.stanford.edu/2020/02/neuro-ophthalmology-illustrated-chapter-13-diplopia-11-vertical-eye-movements/',
    ],
  },
  {
    fmaId: 'FMA78497',
    region: 'spine',
    category: 'space',
    anatomy:
      'The central canal is the small ependymal-lined lumen described within the central spinal-cord region. In adult humans, a continuous open lumen is often absent; the reference surface is not evidence of patency at every level.',
    function:
      'Where patent, the canal contains cerebrospinal fluid. Do not interpret this space as a nerve tract or assume it is a continuous major CSF-flow route in an adult.',
    functionReadiness: 'draft',
    distinction:
      'Central canal representation only, not the surrounding cord, axons or spinal nerves. No fluid dynamics, lumen measurements, syrinx diagnosis or regenerative-cell function is established by this model.',
    references: ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4614133/'],
  },
];
const byFma = new Map(centralNeuroLessons.map((l) => [l.fmaId, l]));
export function centralNeuroLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (s.system !== 'nerves' || (tab !== 'anatomy' && tab !== 'function'))
    return undefined;
  const l = byFma.get(s.fmaId);
  if (!l || s.category !== l.category || !s.regions.includes(l.region))
    return undefined;
  const readiness = tab === 'function' ? l.functionReadiness : 'draft';
  return {
    readiness,
    title: `${s.name} · ${readiness === 'pending' ? 'Function unresolved' : tab === 'anatomy' ? 'Structure & limits' : 'Role & limits'} · ${readiness}`,
    body: tab === 'anatomy' ? l.anatomy : l.function,
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            `Source identity: ${s.fmaId} · ${s.sources.length} source component. These boundaries are not independently validated.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Explode/cut views are not tissue interiors, neural activity or acquired imaging.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
