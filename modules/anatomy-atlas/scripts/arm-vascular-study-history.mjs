// Exact offline recipe history, never a runtime or approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/arm-vascular-study-transition.json' with { type: 'json' };
import { preInferiorEpigastricProfiles } from './inferior-epigastric-study-history.mjs';
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preArmVascularProfiles(profiles) {
  profiles = preInferiorEpigastricProfiles(profiles);
  assert.equal(
    hash(record),
    '776fe8893c6c1edbb81934e5be0c5557c30ff8a13b63d36113e379c5d1c84661',
  );
  if (hash(profiles) !== record.after) return profiles;
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
  assert.equal(
    hash(previous),
    record.before,
    'All prior recipes retained exactly',
  );
  return previous;
}
