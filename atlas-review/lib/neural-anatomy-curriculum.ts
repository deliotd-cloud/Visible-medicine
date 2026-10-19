import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

interface NeuralAnatomyLesson {
  fmaId: string;
  side: 'right' | 'left' | 'midline';
  category: 'nerve' | 'organ';
  anatomy: string;
  correctedFunction?: string;
  distinction: string;
  references: readonly string[];
}
const nerveTable =
  'https://anatomy.ttuhscep.edu/anatomytables/nerves_head_neck.html';
const sensoryRoot =
  'https://anatomy.ttuhscep.edu/modules/head_autonomics_module/autonomics_05.html';
function pair(
  ids: readonly [string, string],
  category: 'nerve' | 'organ',
  anatomy: string,
  distinction: string,
  references: readonly string[],
  correctedFunction?: string,
): NeuralAnatomyLesson[] {
  return ids.map((fmaId, i) => ({
    fmaId,
    side: i === 0 ? 'right' : 'left',
    category,
    anatomy,
    distinction,
    references,
    correctedFunction,
  }));
}
// Exact source identities; similar spelling never determines nerve function.
export const neuralAnatomyLessons: readonly NeuralAnatomyLesson[] = [
  ...pair(
    ['FMA52698', 'FMA52699'],
    'nerve',
    'A nasociliary branch of CN V1 running toward the medial corner of the eye beneath the superior-oblique trochlea.',
    'Infratrochlear is sensory, not the trochlear motor nerve (CN IV). Its small branches and skin territory are not separately reconstructed.',
    ['https://www.ncbi.nlm.nih.gov/books/NBK551696/'],
    'Carries sensation from medial eyelid and conjunctival tissues and adjacent upper nasal skin. It does not supply the superior oblique muscle.',
  ),
  ...pair(
    ['FMA52643', 'FMA52644'],
    'nerve',
    'A frontal-nerve branch of CN V1 passing above the superior-oblique trochlea toward the medial forehead.',
    'Supratrochlear is a sensory V1 branch, not CN IV or a motor branch to frontalis. Branching and terminal territories vary.',
    [nerveTable],
    'Carries sensation from the medial forehead, medial upper eyelid and associated conjunctiva; it does not drive eye movement.',
  ),
  ...pair(
    ['FMA52673', 'FMA52674'],
    'nerve',
    'The source-labelled communicating branch links the nasociliary nerve with the ciliary ganglion and corresponds to its sensory root.',
    'The sensory root is not the ganglion or its parasympathetic motor root. The selected segment does not establish all short ciliary nerves or continuous axons.',
    [sensoryRoot, nerveTable],
    'Conveys ocular sensory fibres between the ciliary-ganglion region and CN V1. These fibres pass through the ganglion without synapsing, unlike its parasympathetic relay.',
  ),
  ...pair(
    ['FMA50881', 'FMA50882'],
    'nerve',
    'CN IV emerges from the dorsal midbrain, curves around it and follows the cavernous-sinus lateral wall toward the superior orbital fissure.',
    'The nuclear fibres cross before emergence. The side of this selected peripheral source segment does not independently identify its nucleus or validate the complete intracranial route.',
    [
      'https://www.ncbi.nlm.nih.gov/books/NBK406/',
      'https://www.ncbi.nlm.nih.gov/books/NBK537244/',
    ],
  ),
  ...pair(
    ['FMA53549', 'FMA53550'],
    'organ',
    'A small autonomic ganglion near the orbital apex, lateral to the optic nerve, with sensory, sympathetic and parasympathetic connections.',
    'The ganglion contains the parasympathetic relay; sensory and sympathetic fibres traverse it without synapsing. Individual cell bodies and all connecting roots are not resolved.',
    [nerveTable, sensoryRoot],
  ),
  {
    fmaId: 'FMA50801',
    side: 'midline',
    category: 'organ',
    anatomy:
      'The brain occupies the cranial cavity; its major divisions include cerebral hemispheres, cerebellum and brainstem. The brainstem comprises midbrain, pons and medulla.',
    distinction:
      'This selection groups 59 PART-OF source files, not 59 validated functional regions. The recorded midline identity is an aggregate label, not proof of bilateral symmetry, complete nuclei or tractography.',
    references: ['https://www.ncbi.nlm.nih.gov/books/NBK551718/'],
  },
];
const byFma = new Map(neuralAnatomyLessons.map((l) => [l.fmaId, l]));
export function neuralAnatomyLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    s.system !== 'nerves' ||
    s.region !== 'head-neck' ||
    !s.regions.includes('head-neck')
  )
    return undefined;
  const l = byFma.get(s.fmaId);
  if (
    !l ||
    s.category !== l.category ||
    s.laterality !== l.side ||
    (tab !== 'anatomy' && (tab !== 'function' || !l.correctedFunction))
  )
    return undefined;
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Course & identity' : 'Sensory role'} · draft`,
    body: tab === 'anatomy' ? l.anatomy : l.correctedFunction!,
    bullets: [
      l.distinction,
      ...(tab === 'anatomy'
        ? [
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}. Component counts are not branch counts; absent anatomy is not reconstructed.`,
          ]
        : []),
    ],
    note: [
      'Independent anatomical and clinical review pending. Exploded or clipped surfaces are not physiological nerve motion, nerve-block guidance, acquired imaging or a validated lesion map.',
      s.coverageNote,
    ]
      .filter(Boolean)
      .join(' '),
    citations: [...l.references],
  };
}
