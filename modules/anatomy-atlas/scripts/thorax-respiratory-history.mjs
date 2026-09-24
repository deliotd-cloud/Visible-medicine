// Offline reconstruction of the exact later Thorax recipe addition.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const thoraxRespiratoryProfilesHash =
  'a0f0ce94880dbb1ce5285da9f51aef4d8b73a3477a3423a1f065a57b03c3a7fd';
export const preThoraxRespiratoryProfilesHash =
  '2cf821c31a5bdf75a44a171e73721d6e803e2a3ef5c386754640dc0198891881';
// The curriculum replay may already be at the independently pinned knee-study
// checkpoint, before this Thorax addition existed.
const preRespiratoryCheckpointHash =
  'dc6ea9198a24ac28e02df8729d9d06543eada6786a6ebd2d6b139f626043a4be';

export function preThoraxRespiratoryProfiles(profiles) {
  const currentHash = hash(profiles);
  if (currentHash === preRespiratoryCheckpointHash) return structuredClone(profiles);
  assert.equal(currentHash, thoraxRespiratoryProfilesHash, 'Unrecorded current recipe edit');
  const prior = structuredClone(profiles);
  const ids = [
    'respiratory-wall-overview',
    'respiratory-intercostal-comparison',
    'respiratory-diaphragm',
  ];
  assert.equal(
    hash({
      focuses: prior.thorax.focuses.filter((focus) => ids.includes(focus.id)),
      references: prior.thorax.references.slice(-2),
    }),
    'a0cc38fbc54b71bca98e757f4edcf64f1ad834ce838c26b9189a2b8be31901cf',
    'Exact respiratory study addition',
  );
  prior.thorax.focuses = prior.thorax.focuses.filter((focus) => !ids.includes(focus.id));
  prior.thorax.references = prior.thorax.references.slice(0, -2);
  assert.equal(hash(prior), preThoraxRespiratoryProfilesHash, 'Every earlier recipe retained');
  return prior;
}
