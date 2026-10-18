import forearmImaging from '../content/forearm-arterial-imaging-pins.json' with { type: 'json' };
import forearmCt from '../content/forearm-arterial-ct-pins.json' with { type: 'json' };
import elbowCt from '../content/elbow-arterial-ct-pins.json' with { type: 'json' };
import { forearmBranchXrayTopics } from '../content/forearm-branch-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof forearmBranchXrayTopics;
const expected = [
  ['FMA22812', 'right', 'anterior-interosseous', 'forearm-vessels-recovery', 'FJ2266'],
  ['FMA22813', 'left', 'anterior-interosseous', 'forearm-vessels-recovery', 'FJ2214'],
  ['FMA22807', 'right', 'common-interosseous', 'forearm-vessels-forearm-vascular', 'FJ2275'],
  ['FMA22808', 'left', 'common-interosseous', 'forearm-vessels-forearm-vascular', 'FJ2223'],
  ['FMA268667', 'right', 'recurrent-interosseous', 'forearm-vessels-forearm-vascular', 'FJ2297'],
  ['FMA268669', 'left', 'recurrent-interosseous', 'forearm-vessels-forearm-vascular', 'FJ2245'],
  ['FMA22764', 'right', 'radial-recurrent', 'elbow-arteries', 'FJ2295'],
  ['FMA22766', 'left', 'radial-recurrent', 'elbow-arteries', 'FJ2243'],
  ['FMA22801', 'right', 'anterior-ulnar-recurrent', 'elbow-arteries', 'FJ2311'],
  ['FMA22802', 'left', 'anterior-ulnar-recurrent', 'elbow-arteries', 'FJ2259'],
  ['FMA22804', 'right', 'posterior-ulnar-recurrent', 'elbow-arteries', 'FJ2293'],
  ['FMA22805', 'left', 'posterior-ulnar-recurrent', 'elbow-arteries', 'FJ2241'],
] as const;

const pinned = [...forearmImaging.entries, ...forearmCt.entries, ...elbowCt.entries];
const bindings = new Map<string, { signature: string; side: string; group: Group }>();
for (const [fma, side, group, bundle, file] of expected) {
  const id = `vm:anatomy:body:forearm:${side}:vessel:${side}-${group}-artery`;
  const matches = pinned.filter(entry => entry.identity.id === id || entry.identity.fmaId === fma);
  if (matches.length !== 1) throw Error(`Unexpected duplicate or missing forearm branch identity: ${id}`);
  const s = matches[0].identity;
  if (s.id !== id || s.fmaId !== fma || s.laterality !== side || s.region !== 'forearm' ||
    s.system !== 'vessels' || s.category !== 'vessel' || s.bundle !== bundle ||
    s.nodeName !== fma || s.sourceTree !== 'isa' || s.sources.length !== 1 ||
    s.sources[0].file !== file || s.validation.status !== 'unvalidated' ||
    s.validation.anatomicalReview !== false) {
    throw Error(`Unexpected forearm branch source identity: ${id}`);
  }
  bindings.set(id, { signature: sourceCanonical(s), side, group });
}
if (bindings.size !== expected.length) throw Error('Forearm branch identity collision');

/** Exact-source educational draft only; no image, lumen or patient transform is supplied. */
export function forearmBranchXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = forearmBranchXrayTopics[binding.group];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      'Contrast catheter angiography with digital subtraction (DSA) may outline an acquired arterial column; a routine unenhanced plain radiograph does not show a normal branch lumen. CTA, MRA and ultrasound are separate examinations.',
      `The ${binding.side} source label is not an acquired side marker. Verify the examination side and projection independently; reset explode to zero only for reference orientation, not image registration.`,
      ...topic.bullets,
      'Selected studies are anatomical or angiographic context, not a branch detection rate or a diagnostic threshold for this donor.',
      'These source surfaces supply no acquired angiogram, continuous lumen, patency, flow, perfusion, verified parent connection, procedure route or patient-space registration.',
    ],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft for revision-bound radiologist review. No clinical approval is implied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
