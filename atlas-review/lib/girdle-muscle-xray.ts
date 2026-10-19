import pins from '../content/shoulder-arm-muscle-imaging-pins.json' with { type: 'json' };
import { girdleMuscleXrayReferences as references, girdleMuscleXrayShared as shared, girdleMuscleXrayTopics as topics } from '../content/girdle-muscle-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

export { girdleMuscleXrayReferences } from '../content/girdle-muscle-xray';

type Group = keyof typeof topics;
type Side = 'right' | 'left';
type Expected = { group: Group; side: Side; id: string; file: string; bundle: string };

// Independently checked against the sixteen retained source-pin records.
const expected: Record<string, Expected> = {
  FMA37705: { group: 'anconeus', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-anconeus', file: 'FJ1485', bundle: 'shoulder-arm-muscles' },
  FMA37706: { group: 'anconeus', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-anconeus', file: 'FJ1485M', bundle: 'shoulder-arm-muscles' },
  FMA37668: { group: 'brachialis', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-brachialis', file: 'FJ1486', bundle: 'shoulder-arm-muscles' },
  FMA37669: { group: 'brachialis', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-brachialis', file: 'FJ1486M', bundle: 'shoulder-arm-muscles' },
  FMA37665: { group: 'coracobrachialis', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-coracobrachialis', file: 'FJ1488', bundle: 'shoulder-arm-muscles' },
  FMA37666: { group: 'coracobrachialis', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-coracobrachialis', file: 'FJ1488M', bundle: 'shoulder-arm-muscles' },
  FMA32540: { group: 'levator-scapulae', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-levator-scapulae', file: 'FJ1532', bundle: 'shoulder-arm-muscles' },
  FMA32541: { group: 'levator-scapulae', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-levator-scapulae', file: 'FJ1532M', bundle: 'shoulder-arm-muscles' },
  FMA13381: { group: 'rhomboid-major', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-rhomboid-major', file: 'FJ1536', bundle: 'shoulder-arm-muscles' },
  FMA13382: { group: 'rhomboid-major', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-rhomboid-major', file: 'FJ1536M', bundle: 'shoulder-arm-muscles' },
  FMA13383: { group: 'rhomboid-minor', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-rhomboid-minor', file: 'FJ1537', bundle: 'shoulder-arm-muscles' },
  FMA13384: { group: 'rhomboid-minor', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-rhomboid-minor', file: 'FJ1537M', bundle: 'shoulder-arm-muscles' },
  FMA13398: { group: 'serratus-anterior', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-serratus-anterior', file: 'FJ1459', bundle: 'shoulder-arm-muscles' },
  FMA13399: { group: 'serratus-anterior', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-serratus-anterior', file: 'FJ1459M', bundle: 'shoulder-arm-muscles' },
  FMA32551: { group: 'teres-major', side: 'right', id: 'vm:anatomy:body:shoulder-arm:right:muscle:right-teres-major', file: 'FJ1507', bundle: 'shoulder-arm-muscles' },
  FMA32552: { group: 'teres-major', side: 'left', id: 'vm:anatomy:body:shoulder-arm:left:muscle:left-teres-major', file: 'FJ1507M', bundle: 'shoulder-arm-muscles' },
};

const bound = new Map(pins.entries.flatMap(entry => {
  const i = entry.identity;
  const e = expected[i.fmaId];
  if (!e || entry.group !== e.group || i.id !== e.id || i.laterality !== e.side ||
      i.region !== 'shoulder-arm' || i.system !== 'muscles' || i.category !== 'muscle' ||
      i.bundle !== e.bundle || i.nodeName !== i.fmaId || i.sourceTree !== 'isa' ||
      i.sources.length !== 1 || i.sources[0].file !== e.file ||
      i.validation.status !== 'unvalidated' || i.validation.anatomicalReview !== false) return [];
  return [[i.id, { signature: sourceCanonical(i), group: e.group }] as const];
}));

/** Exact retained source identity only; no name-based match, new pin or inferred mirror. */
export function girdleMuscleXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bound.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.group];
  const family = topic.family;
  const citations = family === 'elbow'
    ? [references.anatomy, references.brachialisCase, references.elbowGuideline, references.elbowGuidelineAbstract]
    : family === 'scapula'
      ? [references.anatomy, references.scapularCohort]
      : family === 'teres'
        ? [references.anatomy, references.teresCase]
        : [references.anatomy, references.shoulderGuideline];
  return {
    readiness: 'draft',
    title: `${s.name} · X-ray orientation · draft`,
    body: topic.body,
    bullets: [shared.limitation, shared[family]],
    citations,
    note: 'Anatomy/radiology review pending for this exact source revision. No radiograph, patient scan or spatial registration is supplied. Confirm side and projection on the separate acquired study. This is teaching orientation, not a diagnosis or treatment protocol. Case, Atlas and paid-lecture access remain independent.',
  };
}
