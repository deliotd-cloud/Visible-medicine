// Exact offline history only; never runtime source or clinical approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/limb-vascular-recipe-transition.json' with { type: 'json' };
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preLimbVascularRecipeProfiles(profiles) {
  assert.equal(
    hash(record),
    '678518559f057fe60a31f211def5dc0f828faab038f7c82de485ae13a7810315',
  );
  if (hash(profiles) !== record.after) return profiles; // Earlier callers still enforce their own exact snapshot.
  const previous = structuredClone(profiles);
  for (const p of record.patches) {
    const ids = p.added.map((s) => s.id);
    assert.deepEqual(
      previous[p.region].focuses.filter((s) => ids.includes(s.id)),
      p.added,
    );
    assert.deepEqual(previous[p.region].references, p.referencesAfter);
    previous[p.region].focuses = previous[p.region].focuses.filter(
      (s) => !ids.includes(s.id),
    );
    previous[p.region].references = structuredClone(p.referencesBefore);
  }
  assert.equal(hash(previous), record.before, 'Every earlier recipe retained');
  return previous;
}
