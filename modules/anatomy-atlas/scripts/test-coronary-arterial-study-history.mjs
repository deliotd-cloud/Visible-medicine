import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import transition from '../content/coronary-arterial-study.transition.json' with { type: 'json' };
import { preCoronaryArterialStudyProfiles } from './coronary-arterial-study-history.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const currentSnapshot = JSON.stringify(dissectionProfiles);
const previous = preCoronaryArterialStudyProfiles(dissectionProfiles);
assert.equal(hash(dissectionProfiles), transition.afterHash, 'Full current profile digest');
assert.equal(hash(previous), transition.beforeHash, 'Exact baseline profile digest');
assert.notStrictEqual(previous, dissectionProfiles, 'Reconstruction is detached');
assert.deepEqual(preCoronaryArterialStudyProfiles(previous), previous, 'Exact baseline is a no-op');
assert.notStrictEqual(preCoronaryArterialStudyProfiles(previous), previous, 'No-op is detached');
for (const patch of transition.patches) {
  assert.equal(previous[patch.region].focuses.some((focus) => focus.id === patch.added.id), false);
  assert.deepEqual(previous[patch.region].references.slice(patch.referenceIndex), []);
}
let rejected = 0;
for (const mutate of [
  (profiles) => { profiles.thorax.focuses.find((focus) => focus.id === transition.patches[0].added.id).title += ' forged'; },
  (profiles) => { profiles['whole-body'].focuses.find((focus) => focus.id === transition.patches[1].added.id).inspect += ' forged'; },
  (profiles) => { profiles.thorax.focuses.find((focus) => focus.id === transition.patches[0].added.id).requiredSources[0].sources[0].sha256 = '0'.repeat(64); },
  (profiles) => { profiles.thigh.orientation += ' unrelated'; },
  (profiles) => { profiles.thorax.focuses.reverse(); },
  (profiles) => { profiles['whole-body'].focuses.push(structuredClone(transition.patches[1].added)); },
  (profiles) => { profiles.thorax.references[transition.patches[0].referenceIndex] = 'https://example.invalid/forged'; },
]) {
  const changed = structuredClone(dissectionProfiles);
  mutate(changed);
  const snapshot = JSON.stringify(changed);
  assert.throws(() => preCoronaryArterialStudyProfiles(changed), /Unrecorded coronary arterial recipe edit/);
  assert.equal(JSON.stringify(changed), snapshot, 'Rejected input is unchanged');
  rejected++;
}
assert.equal(JSON.stringify(dissectionProfiles), currentSnapshot, 'Runtime profile stays unchanged');
console.log(JSON.stringify({ passed: true, previousHash: transition.beforeHash,
  rejectedChanges: rejected, runtimeUnchanged: true }));
