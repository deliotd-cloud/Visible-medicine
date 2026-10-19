import shoulderPins from '../content/shoulder-arm-artery-quiz-pins.json' with { type: 'json' };
import subscapularPins from '../content/shoulder-arterial-imaging-pins.json' with { type: 'json' };
import thoracoacromialPins from '../content/thoracoacromial-quiz-pins.json' with { type: 'json' };
import { axillaryBranchXrayReferences as references, axillaryBranchXrayTopics as topics } from '../content/axillary-branch-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof topics;
type Source = 'shoulder' | 'subscapular' | 'thoracoacromial';
const expected = [
  ['FMA22682', 'right', 'right-anterior-circumflex-humeral-artery', 'anteriorCircumflexHumeral', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2264']],
  ['FMA22683', 'left', 'left-anterior-circumflex-humeral-artery', 'anteriorCircumflexHumeral', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2212']],
  ['FMA22685', 'right', 'right-posterior-circumflex-humeral-artery', 'posteriorCircumflexHumeral', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2291', 'FJ2292']],
  ['FMA22687', 'left', 'left-posterior-circumflex-humeral-artery', 'posteriorCircumflexHumeral', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2239', 'FJ2240']],
  ['FMA23180', 'right', 'right-circumflex-scapular-artery', 'circumflexScapular', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2273']],
  ['FMA23181', 'left', 'left-circumflex-scapular-artery', 'circumflexScapular', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2221']],
  ['FMA66321', 'right', 'right-thoracodorsal-artery', 'thoracodorsal', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2305']],
  ['FMA66322', 'left', 'left-thoracodorsal-artery', 'thoracodorsal', 'shoulder', 'shoulder-arm-vessels-recovery', ['FJ2253']],
  ['FMA22678', 'right', 'right-subscapular-artery', 'subscapular', 'subscapular', 'subscapular-arteries', ['FJ2298']],
  ['FMA22679', 'left', 'left-subscapular-artery', 'subscapular', 'subscapular', 'subscapular-arteries', ['FJ2246']],
  ['FMA66563', 'right', 'trunk-of-right-thoraco-acromial-artery', 'trunk', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2304']],
  ['FMA66564', 'left', 'trunk-of-left-thoraco-acromial-artery', 'trunk', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2252']],
  ['FMA23063', 'right', 'pectoral-branch-of-right-thoraco-acromial-artery', 'pectoral', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2361']],
  ['FMA23064', 'left', 'pectoral-branch-of-left-thoraco-acromial-artery', 'pectoral', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2330']],
  ['FMA23068', 'right', 'acromial-branch-of-right-thoraco-acromial-artery', 'acromial', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2263']],
  ['FMA23069', 'left', 'acromial-branch-of-left-thoraco-acromial-artery', 'acromial', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2211']],
  ['FMA23072', 'right', 'deltoid-branch-of-right-thoraco-acromial-artery', 'deltoid', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2282']],
  ['FMA23073', 'left', 'deltoid-branch-of-left-thoraco-acromial-artery', 'deltoid', 'thoracoacromial', 'shoulder-arm-vessels-inventory', ['FJ2230']],
] as const satisfies readonly (readonly [string, 'right' | 'left', string, Group, Source, string, readonly string[]])[];

const sources = { shoulder: shoulderPins.entries, subscapular: subscapularPins.entries, thoracoacromial: thoracoacromialPins.entries };
const bindings = new Map<string, { signature: string; side: 'right' | 'left'; group: Group }>();
for (const [fma, side, suffix, group, source, bundle, files] of expected) {
  const id = `vm:anatomy:body:shoulder-arm:${side}:vessel:${suffix}`;
  // Search only the designated source file: duplicate selections in another pin list grant no additional binding.
  const matches = sources[source].filter(entry => entry.identity.id === id || entry.identity.fmaId === fma);
  if (matches.length !== 1) throw Error(`Missing or duplicate axillary branch source: ${id}`);
  const entry = matches[0];
  const s = entry.identity;
  const sourceGroup = 'family' in entry ? entry.family : entry.group;
  if (s.id !== id || s.fmaId !== fma || s.laterality !== side || s.region !== 'shoulder-arm' ||
      s.system !== 'vessels' || s.category !== 'vessel' || s.bundle !== bundle ||
      s.nodeName !== fma || s.sourceTree !== 'isa' || s.sources.length !== files.length ||
      s.sources.some((item, index) => item.file !== files[index]) ||
      s.validation.status !== 'unvalidated' || s.validation.anatomicalReview !== false ||
      sourceGroup !== (source === 'subscapular' ? 'subscapular' : group)) {
    throw Error(`Changed axillary branch source identity: ${id}`);
  }
  bindings.set(id, { signature: sourceCanonical(s), side, group });
}
if (bindings.size !== expected.length) throw Error('Axillary branch identity collision');

/** Exact retained source identity only; no name, mirror, model proximity or patient-image match. */
export function axillaryBranchXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.group];
  return {
    readiness: 'draft',
    title: `${s.name} · contrast X-ray orientation · draft`,
    body: topic.body,
    bullets: [
      'Routine unenhanced plain radiography does not show a normal branch lumen. Contrast DSA, CTA, MRA and injected cadaver radiographs have different acquisition contexts.',
      topic.study,
      'A projected crossing cannot establish connected lumen, patency, flow, vascular territory, nerve geometry, procedure route or patient-space registration.',
      `The ${binding.side} source label is not an acquired side marker; verify the examination side and projection separately.`,
    ],
    citations: topic.citations.map(key => references[key]),
    note: 'Original source-bound educational draft for radiologist sign-off on this exact revision; no clinical approval is implied. Atlas, case and paid-lecture access remain independent.',
  };
}
