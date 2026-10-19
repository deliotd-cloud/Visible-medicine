import pins from '../content/shoulder-arm-muscle-imaging-pins.json' with { type: 'json' };
import motorPins from '../content/upper-limb-motor-pins.json' with { type: 'json' };
import { shoulderMuscleXrayReferences as references, shoulderMuscleXrayShared as shared, shoulderMuscleXrayTopics as topics } from '../content/shoulder-muscle-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

export { shoulderMuscleXrayReferences } from '../content/shoulder-muscle-xray';

type Group = keyof typeof topics;
type Side = 'right' | 'left';
type Expected = { group: Group; side: Side; id: string; file: string };

// Independent identity expectations across the two existing retained pin sets.
const expected: Record<string, Expected> = {
  FMA34680: { group: 'deltoid-clavicular', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:clavicular-part-of-right-deltoid', file: 'FJ1468' },
  FMA34681: { group: 'deltoid-clavicular', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:clavicular-part-of-left-deltoid', file: 'FJ1468M' },
  FMA34682: { group: 'deltoid-acromial', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:acromial-part-of-right-deltoid', file: 'FJ1467' },
  FMA34683: { group: 'deltoid-acromial', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:acromial-part-of-left-deltoid', file: 'FJ1467M' },
  FMA34684: { group: 'deltoid-spinal', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:spinal-part-of-right-deltoid', file: 'FJ1513' },
  FMA34685: { group: 'deltoid-spinal', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:spinal-part-of-left-deltoid', file: 'FJ1513M' },
  FMA37684: { group: 'biceps-short-head', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:short-head-of-right-biceps-brachii', file: 'FJ1512' },
  FMA37685: { group: 'biceps-short-head', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:short-head-of-left-biceps-brachii', file: 'FJ1512M' },
  FMA37686: { group: 'biceps-long-head', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:long-head-of-right-biceps-brachii', file: 'FJ1478' },
  FMA37687: { group: 'biceps-long-head', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:long-head-of-left-biceps-brachii', file: 'FJ1478M' },
  FMA37695: { group: 'triceps-medial-head', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:medial-head-of-right-triceps-brachii', file: 'FJ1480' },
  FMA37696: { group: 'triceps-medial-head', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:medial-head-of-left-triceps-brachii', file: 'FJ1480M' },
  FMA37697: { group: 'triceps-lateral-head', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:lateral-head-of-right-triceps-brachii', file: 'FJ1477' },
  FMA37698: { group: 'triceps-lateral-head', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:lateral-head-of-left-triceps-brachii', file: 'FJ1477M' },
  FMA37699: { group: 'triceps-long-head', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:long-head-of-right-triceps-brachii', file: 'FJ1479' },
  FMA37700: { group: 'triceps-long-head', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:long-head-of-left-triceps-brachii', file: 'FJ1479M' },
};

const fourRight = new Set(['FMA34680', 'FMA34682', 'FMA34684', 'FMA37686']);
const candidates = [
  ...pins.entries.map(entry => ({ identity: entry.identity, group: entry.group })),
  ...motorPins.entries.filter(identity => fourRight.has(identity.fmaId))
    .map(identity => ({ identity, group: expected[identity.fmaId].group })),
];
const bound = new Map(candidates.flatMap(entry => {
  const i = entry.identity;
  const e = expected[i.fmaId];
  if (!e || entry.group !== e.group || i.id !== e.id || i.laterality !== e.side ||
      i.region !== 'shoulder-arm' || i.system !== 'muscles' || i.category !== 'muscle' ||
      i.bundle !== 'shoulder-arm-muscles-dissection' || i.nodeName !== i.fmaId || i.sourceTree !== 'isa' ||
      i.sources.length !== 1 || i.sources[0].file !== e.file ||
      i.validation.status !== 'unvalidated' || i.validation.anatomicalReview !== false) return [];
  return [[i.id, { signature: sourceCanonical(i), group: e.group }] as const];
}));

/** Exact retained source identity only; no name/FMA-only selection or inferred mirroring. */
export function shoulderMuscleXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bound.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.group];
  const family = topic.family;
  const citations = family === 'deltoid'
    ? [references.anatomy, references.deltoidVariant, references.shoulderGuideline]
    : family === 'biceps'
      ? [references.anatomy, references.shoulderGuideline]
      : [references.anatomy, references.tricepsCases, references.tricepsCohort];
  return {
    readiness: 'draft',
    title: `${s.name} · X-ray orientation · draft`,
    body: topic.body,
    bullets: [shared.limitation, shared[family]],
    citations,
    note: 'Anatomy/radiology review pending for this source revision. No radiograph, patient scan or spatial registration is supplied. Confirm side and projection on the separate acquired study. This is teaching orientation, not a diagnosis or treatment protocol. Case, Atlas and paid-lecture access remain independent.',
  };
}
