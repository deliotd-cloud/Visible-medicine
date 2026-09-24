// Offline exact transition reconstruction; runtime profiles are never rewritten.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const studyId = 'forearm-superficial-veins';
const currentHash = 'd5211963440f98d0e51b24884642e3d0c27848d1fba7d68f5360f1a1eae250e0';
const priorHash = 'a0f0ce94880dbb1ce5285da9f51aef4d8b73a3477a3423a1f065a57b03c3a7fd';

export function preForearmSuperficialVeinProfiles(profiles) {
  if (!profiles.forearm.focuses.some(focus => focus.id === studyId)) return profiles;
  assert.equal(hash(profiles), currentHash, 'Unrecorded current recipe edit');
  const prior = structuredClone(profiles);
  const added = {
    focuses: prior.forearm.focuses.filter(focus => focus.id === studyId),
    references: prior.forearm.references.slice(-2),
  };
  assert.equal(added.focuses.length, 1);
  assert.equal(hash(added), 'a0ea2bc349549dce3ef609f3257a7a2c6873c85c8de0e8f60b6c7c9ec93ac19e', 'Exact forearm study addition');
  prior.forearm.focuses = prior.forearm.focuses.filter(focus => focus.id !== studyId);
  prior.forearm.references = prior.forearm.references.slice(0, -2);
  assert.equal(hash(prior), priorHash, 'All previous recipes retained');
  return prior;
}
