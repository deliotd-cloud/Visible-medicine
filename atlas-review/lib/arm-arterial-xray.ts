import shoulderPins from '../content/shoulder-arm-artery-quiz-pins.json' with { type: 'json' };
import elbowPins from '../content/elbow-arterial-ct-pins.json' with { type: 'json' };
import { armArterialXrayTopics } from '../content/arm-arterial-xray';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import type { ContentTab } from '../app/anatomy-data';
import type { ContentLesson } from './content-types';

type Group = keyof typeof armArterialXrayTopics;
const expected = [
  ['FMA22655', 'right', 'right-axillary-artery', 'axillary', 'shoulder-arm-vessels-recovery', 'FJ2268'],
  ['FMA22656', 'left', 'left-axillary-artery', 'axillary', 'shoulder-arm-vessels-recovery', 'FJ2216'],
  ['FMA22691', 'right', 'right-brachial-artery', 'brachial', 'shoulder-arm-vessels-recovery', 'FJ2271'],
  ['FMA22692', 'left', 'left-brachial-artery', 'brachial', 'shoulder-arm-vessels-recovery', 'FJ2219'],
  ['FMA22696', 'right', 'right-deep-brachial-artery', 'deepBrachial', 'shoulder-arm-vessels-recovery', 'FJ2277'],
  ['FMA22697', 'left', 'left-deep-brachial-artery', 'deepBrachial', 'shoulder-arm-vessels-recovery', 'FJ2225'],
  ['FMA22707', 'right', 'right-superior-ulnar-collateral-artery', 'superiorUlnarCollateral', 'elbow-arteries', 'FJ2373'],
  ['FMA22708', 'left', 'left-superior-ulnar-collateral-artery', 'superiorUlnarCollateral', 'elbow-arteries', 'FJ2374'],
  ['FMA22712', 'right', 'right-inferior-ulnar-collateral-artery', 'inferiorUlnarCollateral', 'elbow-arteries', 'FJ2267'],
  ['FMA22713', 'left', 'left-inferior-ulnar-collateral-artery', 'inferiorUlnarCollateral', 'elbow-arteries', 'FJ2215'],
  ['FMA23126', 'right', 'radial-collateral-branch-of-right-deep-brachial-artery', 'radialCollateral', 'elbow-arteries', 'FJ2262'],
  ['FMA23127', 'left', 'radial-collateral-branch-of-left-deep-brachial-artery', 'radialCollateral', 'elbow-arteries', 'FJ2261'],
  ['FMA23124', 'right', 'middle-collateral-branch-of-right-deep-brachial-artery', 'middleCollateral', 'elbow-arteries', 'FJ2362'],
  ['FMA23125', 'left', 'middle-collateral-branch-of-left-deep-brachial-artery', 'middleCollateral', 'elbow-arteries', 'FJ2331'],
] as const satisfies readonly (readonly [string, 'right' | 'left', string, Group, string, string])[];

const pinned = [...shoulderPins.entries, ...elbowPins.entries];
const bindings = new Map<string, { signature: string; side: string; group: Group }>();
for (const [fma, side, suffix, group, bundle, file] of expected) {
  const id = `vm:anatomy:body:shoulder-arm:${side}:vessel:${suffix}`;
  const matches = pinned.filter(entry => entry.identity.id === id || entry.identity.fmaId === fma);
  if (matches.length !== 1) throw Error(`Unexpected duplicate or missing arm arterial identity: ${id}`);
  const s = matches[0].identity;
  if (s.id !== id || s.fmaId !== fma || s.laterality !== side || s.region !== 'shoulder-arm' ||
    s.system !== 'vessels' || s.category !== 'vessel' || s.bundle !== bundle ||
    s.nodeName !== fma || s.sourceTree !== 'isa' || s.sources.length !== 1 ||
    s.sources[0].file !== file || s.validation.status !== 'unvalidated' ||
    s.validation.anatomicalReview !== false) {
    throw Error(`Unexpected arm arterial source identity: ${id}`);
  }
  bindings.set(id, { signature: sourceCanonical(s), side, group });
}
if (bindings.size !== expected.length) throw Error('Arm arterial identity collision');

/** Exact-source educational draft only; no image, lumen or patient transform is supplied. */
export function armArterialXrayLesson(s: BodyStructure, tab: ContentTab): ContentLesson | undefined {
  if (tab !== 'xray') return undefined;
  const binding = bindings.get(s.id);
  if (!binding || sourceCanonical(s) !== binding.signature) return undefined;
  const topic = armArterialXrayTopics[binding.group];
  return {
    readiness: 'draft', title: `${s.name} · ${topic.title} · draft`, body: topic.body,
    bullets: [
      'Contrast X-ray angiography, including digital subtraction (DSA), differs from routine unenhanced plain radiography, which does not depict a normal branch lumen. Catheter arteriography and historical intravenous DSA are different acquisition contexts; CTA, MRA and ultrasound are separate examinations.',
      `The ${binding.side} source label is not an acquired side marker. Verify the examination side and projection independently; reassembling or resetting the reference model is not patient image registration.`,
      ...topic.bullets,
      'Cited acquisitions and injected anatomy are not a normal-population branch detection rate, donor measurement or current procedure protocol.',
      'These source surfaces supply no acquired angiogram, connected lumen, patency, flow, perfusion, procedure route, nerve geometry or patient-space registration.',
    ],
    citations: [...topic.citations],
    note: 'Original source-bound educational draft for revision-bound radiologist review; no clinical approval is implied. Atlas, imaging-case and paid-lecture access remain independent.',
  };
}
