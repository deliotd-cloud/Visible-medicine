import girdlePins from '../content/shoulder-girdle-artery-quiz-pins.json' with { type: 'json' };
import systemicPins from '../content/systemic-venous-pins.json' with { type: 'json' };
import supraPins from '../content/suprascapular-vessel-ultrasound-pins.json' with { type: 'json' };
import upperPins from '../content/upper-venous-clinical-pins.json' with { type: 'json' };
import { shoulderGirdleXrayReferences, shoulderGirdleXrayTopics } from '../content/shoulder-girdle-xray';
import { shoulderVenousXrayReferences, shoulderVenousXrayTopics } from '../content/shoulder-venous-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

const topics = { ...shoulderGirdleXrayTopics, ...shoulderVenousXrayTopics };
type Group = keyof typeof topics;
type Source = 'girdle' | 'systemic' | 'supra' | 'upper';
const expected = [
  ['FMA3992', 'right', 'right-thyrocervical-trunk', 'thyrocervical', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2307'],
  ['FMA4084', 'left', 'left-thyrocervical-trunk', 'thyrocervical', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2255'],
  ['FMA5039', 'right', 'right-costocervical-trunk', 'costocervical', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2276'],
  ['FMA4086', 'left', 'left-costocervical-trunk', 'costocervical', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2224'],
  ['FMA4057', 'right', 'right-dorsal-scapular-artery', 'dorsalScapular', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2284'],
  ['FMA10552', 'left', 'left-dorsal-scapular-artery', 'dorsalScapular', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2232'],
  ['FMA10698', 'right', 'right-suprascapular-artery', 'suprascapular', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2303'],
  ['FMA10681', 'left', 'left-suprascapular-artery', 'suprascapular', 'girdle', 'shoulder-arm-vessels-inventory', 'FJ2251'],
  ['FMA13330', 'right', 'right-axillary-vein', 'axillary', 'systemic', 'shoulder-arm-vessels-inventory', 'FJ2269'],
  ['FMA13331', 'left', 'left-axillary-vein', 'axillary', 'systemic', 'shoulder-arm-vessels-inventory', 'FJ2217'],
  ['FMA50859', 'right', 'right-suprascapular-vein', 'suprascapularVein', 'supra', 'shoulder-arm-vessels-inventory', 'FJ2302'],
  ['FMA50860', 'left', 'left-suprascapular-vein', 'suprascapularVein', 'supra', 'shoulder-arm-vessels-inventory', 'FJ2250'],
  ['FMA22935', 'right', 'right-medial-brachial-vein', 'medialBrachial', 'upper', 'brachial-veins', 'FJ2341'],
  ['FMA22936', 'left', 'left-medial-brachial-vein', 'medialBrachial', 'upper', 'brachial-veins', 'FJ2313'],
] as const satisfies readonly (readonly [string, 'right' | 'left', string, Group, Source, string, string])[];
const sources = {
  girdle: girdlePins.entries.map(e => ({ identity: e.identity, group: e.group })),
  systemic: systemicPins.entries.map(identity => ({ identity, group: 'axillary' })),
  supra: supraPins.entries.map(e => ({ identity: e.identity, group: e.family })),
  upper: upperPins.entries.map(e => ({ identity: e.identity, group: e.family })),
};
const bindings = new Map<string, { signature: string; side: 'right' | 'left'; group: Group; arterial: boolean }>();
for (const [fma, side, suffix, group, source, bundle, file] of expected) {
  const id = `vm:anatomy:body:shoulder-arm:${side}:vessel:${suffix}`;
  const matches = sources[source].filter(e => e.identity.id === id || e.identity.fmaId === fma);
  if (matches.length !== 1) throw Error(`Missing or duplicate shoulder vessel X-ray source: ${id}`);
  const { identity: s, group: sourceGroup } = matches[0];
  if (s.id !== id || s.fmaId !== fma || s.laterality !== side || s.region !== 'shoulder-arm' ||
      s.system !== 'vessels' || s.category !== 'vessel' || s.bundle !== bundle || s.nodeName !== fma ||
      s.sourceTree !== 'isa' || s.sources.length !== 1 || s.sources[0].file !== file ||
      !/^[a-f0-9]{64}$/.test(s.sources[0].sha256) || s.validation.status !== 'unvalidated' ||
      s.validation.anatomicalReview !== false ||
      sourceGroup !== (source === 'supra' ? 'vein' : source === 'upper' ? 'brachial' : group)) {
    throw Error(`Changed shoulder vessel X-ray source identity: ${id}`);
  }
  bindings.set(id, { signature: sourceCanonical(s), side, group, arterial: source === 'girdle' });
}
if (bindings.size !== 14) throw Error('Shoulder vessel X-ray identity collision');

/** Full retained source identity only: never a name, proximity or patient-image match. */
export function shoulderVesselXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = topics[binding.group];
  const references: Readonly<Record<string, string>> = binding.arterial ? shoulderGirdleXrayReferences : shoulderVenousXrayReferences;
  return {
    readiness: 'draft', title: `${s.name} · contrast ${binding.arterial ? 'arterial' : 'venous'} X-ray orientation · draft`,
    body: topic.body,
    bullets: [
      binding.arterial
        ? 'Unenhanced plain radiography does not outline a normal branch lumen. Contrast arteriography, including DSA, differs from CTA/MRA and injected cadaver radiography.'
        : 'Unenhanced plain radiography does not outline a normal venous lumen. Contrast venography, CTV/MRV and ultrasound are different examinations; arterial filling is not a venous map.',
      topic.study,
      'Projected overlap cannot establish a connected lumen, patency, flow, drainage or supply territory, procedural route or patient-space registration.',
      `The ${binding.side} atlas label is not an acquired side marker; check examination side and projection independently.`,
    ],
    citations: topic.citations.map(key => references[key]),
    note: 'Original source-bound educational draft for radiologist sign-off on this exact revision. No clinical approval is implied. Atlas, case and paid-lecture access remain independent.',
  };
}
