// Exact offline reconstruction of the single central-airway focus before its
// source-bound, side-aware replacement. Never changes runtime recipes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { preMediastinalOrganProfiles } from './mediastinal-organ-study-history.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const beforeHash = 'd5211963440f98d0e51b24884642e3d0c27848d1fba7d68f5360f1a1eae250e0';
const afterHash = '5234ceb0e33ef2eb3548cc603623c114facb83c8ee91b80c2c926fc4e3acb868';
const focusHash = 'b37a30952716ab89fbc047d51676b01698203a79df1fb334e5fa6dcb10991f9f';
const oldFocusHash = '6b1c730b24c410cc42b2343a86084d72a493aa86e7f374d3f6eb02642681abda';
const oldFocus = {
  id: 'central-airways',
  title: 'Central airway source segments',
  rule: { systems: ['organs'], pattern: 'trachea|main bronchus' },
  view: 'anterior',
};

export function preCentralAirwayProfiles(profiles) {
  if (profiles.thorax.focuses.some((focus) => focus.id === 'mediastinal-conduits-thymus'))
    profiles = preMediastinalOrganProfiles(profiles);
  // The pelvic focus is newer than this checkpoint. Reverse its exact two
  // recipes and orientation copy for every caller of this historical helper.
  if (hash(profiles) === '1a6c020cad6f3bb3e50f4e1d014a191273d9b66d3eaf6503211f0f2df3ba4c8f') {
    const previous = structuredClone(profiles);
    const focusId = 'pelvis-visceral-subset';
    for (const region of ['pelvis', 'whole-body']) {
      const added = previous[region].focuses.filter((focus) => focus.id === focusId);
      assert.equal(added.length, 1, 'Exactly one pelvic-visceral focus per region');
      assert.equal(hash(added[0]), '3e3c42c93458c5d88f7e3174aa6f1ee4715a8c487a63f69fe6dea70c1f9dab3e', 'Exact pelvic-visceral focus');
      previous[region].focuses = previous[region].focuses.filter((focus) => focus.id !== focusId);
    }
    assert.equal(previous.pelvis.orientation,
      'Posterior stages expose the gluteal layers. The muscle window is sparse; the separate pelvic-organ window and focused studies show selected supplied organs, not a complete pelvic-organ set.',
      'Exact pelvic orientation update');
    previous.pelvis.orientation =
      'Posterior stages expose the gluteal layers. The organ window shows only the supplied bladder, not a complete pelvic-organ set.';
    assert.equal(hash(previous), afterHash, 'Every earlier recipe retained');
    profiles = previous;
  }
  const matches = profiles.thorax.focuses
    .map((focus, index) => ({ focus, index }))
    .filter(({ focus }) => focus.id === oldFocus.id);
  assert.equal(matches.length, 1, 'One central-airway focus');
  // Older independently guarded historical snapshots already have this exact
  // focus, even when their full-profile digests predate later study additions.
  if (hash(matches[0].focus) === oldFocusHash) return profiles;
  assert.equal(hash(profiles), afterHash, 'Unrecorded central-airway recipe edit');
  const previous = structuredClone(profiles);
  assert.equal(hash(matches[0].focus), focusHash, 'Exact source-bound focus revision');
  previous.thorax.focuses[matches[0].index] = oldFocus;
  assert.equal(hash(previous), beforeHash, 'All earlier recipes retained');
  return previous;
}
