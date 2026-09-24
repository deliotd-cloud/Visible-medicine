// Offline reconstruction of the exact later Thorax recipe addition.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const thoraxRespiratoryProfilesHash =
  'e036bb888c17565f87c7601d41877a4e1334ce7dfc11230ad6c5d6ea7bf21533';
export const preThoraxRespiratoryProfilesHash =
  '2cf821c31a5bdf75a44a171e73721d6e803e2a3ef5c386754640dc0198891881';

export function preThoraxRespiratoryProfiles(profiles) {
  assert.equal(hash(profiles), thoraxRespiratoryProfilesHash, 'Unrecorded current recipe edit');
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
    '81d8a90fa658f4efe3ebe97228555b214033b9d7aec178ee33c434f53f04b70e',
    'Exact respiratory study addition',
  );
  prior.thorax.focuses = prior.thorax.focuses.filter((focus) => !ids.includes(focus.id));
  prior.thorax.references = prior.thorax.references.slice(0, -2);
  assert.equal(hash(prior), preThoraxRespiratoryProfilesHash, 'Every earlier recipe retained');
  return prior;
}
