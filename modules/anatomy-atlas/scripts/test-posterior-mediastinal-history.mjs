import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { dissectionProfiles } from '../app/dissection-data.ts';
import {prePesAnserineProfiles} from './pes-anserine-study-history.mjs';
import {
  prePosteriorMediastinalProfiles,
  prePosteriorMediastinalProfilesHash,
} from './posterior-mediastinal-study-history.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const id = 'posterior-mediastinal-conduits';
const original = JSON.stringify(dissectionProfiles);
const previous = prePosteriorMediastinalProfiles(dissectionProfiles);
assert.equal(hash(previous), prePosteriorMediastinalProfilesHash);
for (const region of ['thorax', 'whole-body'])
  assert(!previous[region].focuses.some((focus) => focus.id === id));
assert.equal(JSON.stringify(dissectionProfiles), original, 'Replay leaves runtime recipes unchanged');
assert.deepEqual(prePosteriorMediastinalProfiles(previous), previous, 'Exact prior input is idempotent');
assert.notStrictEqual(prePosteriorMediastinalProfiles(previous), previous, 'Idempotent replay returns a clone');

for (const mutate of [
  (profile) => { profile.thorax.focuses.find((focus) => focus.id === id).title += ' altered'; },
  (profile) => { profile['whole-body'].focuses.find((focus) => focus.id === id).requiredSourceBindings[2].sources[0].sha256 = '0'.repeat(64); },
  (profile) => { profile.thorax.focuses[0].description += ' altered'; },
  (profile) => { profile['whole-body'].references.push('https://example.invalid/unreviewed'); },
  (profile) => { profile.thorax.focuses.push(structuredClone(profile.thorax.focuses.find((focus) => focus.id === id))); },
  (profile) => { profile['whole-body'].focuses = profile['whole-body'].focuses.filter((focus) => focus.id !== id); },
]) {
  const changed = prePesAnserineProfiles(dissectionProfiles);
  mutate(changed);
  const snapshot = JSON.stringify(changed);
  assert.throws(() => prePosteriorMediastinalProfiles(changed), /Unrecorded posterior-mediastinal recipe edit/);
  assert.equal(JSON.stringify(changed), snapshot, 'Rejected input is unchanged');
}
assert.equal(JSON.stringify(dissectionProfiles), original, 'Runtime recipes remain unchanged after negative cases');
console.log(JSON.stringify({ passed: true, priorHash: prePosteriorMediastinalProfilesHash, rejectedChanges: 6, runtimeUnchanged: true }));
