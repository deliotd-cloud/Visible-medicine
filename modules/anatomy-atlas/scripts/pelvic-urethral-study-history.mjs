// Offline comparison only; no runtime, approval or imaging-state migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const pelvicUrethralRecipeBaseline = 'dd8a2f264c93de2e79256b26fd38f52aeefb7ebae96ca47e88010a3c4b9f901d';
export const pelvicUrethralRecipeRevision = '051a7432fd2dfede46e64a46ff2d211bd3a6942513c6e8c24666532d46f9fa25';
const additionHash = 'a45ff43bccd5eb33023aead4837d0428f8ebd1698b43103474b695b85f45a084';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const id = 'pelvis-urethral-context';
export function prePelvicUrethralProfiles(profiles, {allowOlder = false} = {}) {
  if (hash(profiles) === pelvicUrethralRecipeBaseline) return profiles;
  // Older snapshots pass through unchanged; their own immutable hash must still
  // be checked by the caller. Absence of this focus never proves validity.
  if (allowOlder && !Object.values(profiles).some(p => p.focuses.some(f => f.id === id)))
    return profiles;
  assert.equal(hash(profiles), pelvicUrethralRecipeRevision, 'Unrecorded pelvic urethral recipe change');
  const previous = structuredClone(profiles), additions = [];
  for (const region of ['pelvis', 'whole-body']) {
    const added = previous[region].focuses.filter(f => f.id === id);
    assert.equal(added.length, 1);
    additions.push({region, added});
    previous[region].focuses = previous[region].focuses.filter(f => f.id !== id);
  }
  assert.equal(hash(additions), additionHash, 'Exact pelvic focus additions');
  assert.equal(hash(previous), pelvicUrethralRecipeBaseline, 'All previous recipes retained');
  return previous;
}
