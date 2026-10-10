// Exact offline transition reversal; never changes live recipes or approval state.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/coronary-arterial-study.transition.json' with { type: 'json' };

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const recordHash = '5044216ee125ace84361a335cbce531ad98bc93c18082afa7de5c70425383f6a';
const sourceCommit = '12570b5245dc6a253cbdd73ec4e044c58b81a927';
const id = 'coronary-arterial-surfaces';

export function preCoronaryArterialStudyProfiles(profiles) {
  assert.equal(hash(record), recordHash, 'Coronary transition record changed');
  assert.equal(record.sourceCommit, sourceCommit);
  const actual = hash(profiles);
  if (actual === record.beforeHash) return structuredClone(profiles);
  assert.equal(actual, record.afterHash, 'Unrecorded coronary arterial recipe edit');
  const previous = structuredClone(profiles);
  assert.deepEqual(record.patches.map((patch) => patch.region), ['thorax', 'whole-body']);
  for (const patch of record.patches) {
    const profile = previous[patch.region];
    assert.equal(profile.focuses.filter((focus) => focus.id === id).length, 1,
      `One ${patch.region} coronary focus`);
    assert.deepEqual(profile.focuses[patch.index], patch.added,
      `Exact ${patch.region} coronary focus and position`);
    assert.equal(patch.added.id, id);
    assert.deepEqual(profile.references.slice(patch.referenceIndex), patch.referencesAdded,
      `Exact ${patch.region} added references`);
    profile.focuses.splice(patch.index, 1);
    profile.references.splice(patch.referenceIndex, patch.referencesAdded.length);
  }
  assert.equal(hash(previous), record.beforeHash,
    'Every prior recipe, reference and position remains exact');
  return previous;
}
