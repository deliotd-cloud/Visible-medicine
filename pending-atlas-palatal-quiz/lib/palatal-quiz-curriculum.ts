import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type PalatalFamily = 'levator' | 'tensor';
type Binding = { id: string; fmaId: string; side: 'left' | 'right'; file: string; sha256: string; family: PalatalFamily };

// Retained BodyParts3D source records at bd5465ee3b94c66c3d5701e7749099d07e8f40d3.
const bindings: readonly Binding[] = [
  { id: 'vm:anatomy:body:head-neck:left:muscle:left-levator-veli-palatini', fmaId: 'FMA46729', side: 'left', file: 'FJ2741', sha256: 'a7d1e90a0757aa53530521cd25ee855da0cc1e774dbe2c6bcaf372ab9e654259', family: 'levator' },
  { id: 'vm:anatomy:body:head-neck:right:muscle:right-levator-veli-palatini', fmaId: 'FMA46728', side: 'right', file: 'FJ2753', sha256: '84b856010832db82451e940a172f175d3a753c08e7284663bd40de6ef427fbcc', family: 'levator' },
  { id: 'vm:anatomy:body:head-neck:left:muscle:left-tensor-veli-palatini', fmaId: 'FMA46732', side: 'left', file: 'FJ2748', sha256: 'd6bca501cda0201b5221acbee58f2a58eff4784886825f72a0c40b1e1f7cbf97', family: 'tensor' },
  { id: 'vm:anatomy:body:head-neck:right:muscle:right-tensor-veli-palatini', fmaId: 'FMA46731', side: 'right', file: 'FJ2760', sha256: 'ceddb3e852a795354bf31e6151dd9d2feaacb9f4612e3f0376d980dc063fc33a', family: 'tensor' },
];

const source = 'https://anatomy.ttuhscep.edu/schemes/swallowing_tables.html';
const questions = {
  tensor: {
    body: 'Which nerve division provides the usual motor supply to tensor veli palatini?',
    choices: ['Mandibular division of the trigeminal nerve (V3)', 'Vagus nerve (X) via the pharyngeal plexus', 'Glossopharyngeal nerve (IX)', 'Facial nerve (VII)'],
    correctAnswer: 'Mandibular division of the trigeminal nerve (V3)',
    explanation: 'Tensor veli palatini is the palatal muscle supplied through V3. In usual anatomy it tenses the soft palate and assists auditory-tube opening.',
    citations: [source],
  },
  levator: {
    body: 'Which action and motor supply belong to levator veli palatini in usual anatomy?',
    choices: ['Elevates the soft palate; vagus nerve (X) via the pharyngeal plexus', 'Tenses the soft palate; mandibular division of the trigeminal nerve (V3)', 'Depresses the tongue; hypoglossal nerve (XII)', 'Closes the eyelids; facial nerve (VII)'],
    correctAnswer: 'Elevates the soft palate; vagus nerve (X) via the pharyngeal plexus',
    explanation: 'Levator veli palatini elevates the soft palate and receives vagal motor supply through the pharyngeal plexus. This contrasts with the V3-supplied tensor.',
    citations: [source],
  },
} as const;

/** Two original formative question families, each confined to exact left/right source records. */
export function palatalQuizLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'quiz') return undefined;
  const bound = bindings.find(b => b.id === s.id);
  if (!bound || s.fmaId !== bound.fmaId || s.laterality !== bound.side ||
      s.sourceName !== `${bound.side} ${bound.family} veli palatini` ||
      s.name !== `${bound.side === 'left' ? 'Left' : 'Right'} ${bound.family} veli palatini` ||
      s.system !== 'muscles' || s.category !== 'muscle' || s.region !== 'head-neck' ||
      s.regions.length !== 1 || s.regions[0] !== 'head-neck' ||
      s.bundle !== 'head-neck-muscles' || s.sourceTree !== 'isa' ||
      s.nodeName !== bound.fmaId || s.sources.length !== 1 ||
      s.sources[0].file !== bound.file || s.sources[0].sha256 !== bound.sha256 ||
      s.validation?.status !== 'unvalidated' || s.validation?.anatomicalReview !== false) return undefined;
  const q = questions[bound.family];
  return {
    readiness: 'draft',
    title: `${s.name} · Palatal muscle quick check · draft`,
    body: q.body,
    bullets: [...q.choices],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    citations: [...q.citations],
    note: 'Original source-backed formative question; revision-bound radiologist review pending. Usual anatomy does not validate complete muscle boundaries, attachments, nerve course, swallowing seal, auditory-tube opening, or patient-specific function in this static surface. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
