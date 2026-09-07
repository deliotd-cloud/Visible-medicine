import type { ContentTab } from '../app/anatomy-data';
import type { BodyStructure } from '../app/body-types';
import type { ContentLesson } from './content-types';

export const pelvicCurriculumIds = [
  'FMA46444',
  'FMA46443',
  'FMA19728',
] as const;
const source = 'https://lifesciencedb.jp/bp3d/?lng=en';
const references = [
  'https://www.ncbi.nlm.nih.gov/books/NBK482258/',
  'https://www.kenhub.com/en/library/anatomy/coccygeus-muscle',
  'https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html',
];

/** Exact source categories, not name matching or a claim of complete pelvic anatomy. */
export function pelvicMuscleLesson(
  s: BodyStructure,
  tab: ContentTab,
): ContentLesson | undefined {
  if (
    (tab !== 'anatomy' && tab !== 'function') ||
    s.system !== 'muscles' ||
    !s.regions.includes('pelvis') ||
    !pelvicCurriculumIds.some((id) => id === s.fmaId)
  )
    return undefined;
  const note = [
    'Draft teaching; independent anatomical and clinical review pending.',
    'Source file counts do not establish separate heads, muscle layers or functional independence.',
    s.coverageNote,
  ]
    .filter(Boolean)
    .join(' ');
  if (s.fmaId === 'FMA19728') {
    const pending = tab === 'function';
    return {
      readiness: pending ? 'pending' : 'draft',
      title: `${s.name} · ${pending ? 'Function pending' : 'Source category · draft'}`,
      body: pending
        ? 'A specific muscle action and motor supply are withheld until this broad source category and its component surfaces have been adjudicated.'
        : 'This is a source category, not a separately identified superficial transverse perineal muscle or a complete superficial perineal pouch.',
      bullets: [
        'The four admitted files (FJ1450, FJ1450M, FJ2543, FJ2548) also map to external anal sphincter (FMA21930) in the BodyParts3D v4 IS-A index and PART-OF index.',
        'That shared mapping is source evidence, not confirmation of four muscles or individually identified sphincter layers. No relabelling or new mesh is inferred.',
        'Stable identity: FMA19728. The legacy atlas ID contains thigh; its current regional membership remains pelvis.',
      ],
      note,
      citations: [source],
    };
  }
  return {
    readiness: 'draft',
    title: `${s.name} · ${tab === 'anatomy' ? 'Attachments' : 'Action & motor supply'} · draft`,
    body:
      tab === 'anatomy'
        ? 'Coccygeus forms part of the posterior pelvic diaphragm beside the sacrospinous ligament. These are typical anatomical relationships, not measured attachment footprints on the selected surface.'
        : 'Helps support the pelvic contents and can draw the coccyx forwards. This surface model does not simulate pelvic-floor contraction or continence.',
    bullets:
      tab === 'anatomy'
        ? [
            'Lateral attachment: ischial spine.',
            'Medial attachment: lateral borders of the coccyx and lower sacrum.',
            `Source identity: ${s.fmaId} · ${s.sources.length} source component${s.sources.length === 1 ? '' : 's'}.`,
          ]
        : [
            'Motor supply: branches of lower sacral anterior rami. Their courses are not rendered by this muscle entry.',
            'Root-level descriptions differ between the cited references (S4–S5 versus S3–S4); precise segmental wording requires specialist review and is not an exam answer here.',
          ],
    note,
    citations: [...references],
  };
}
