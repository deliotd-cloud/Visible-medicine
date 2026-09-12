// Offline exact history only, never a runtime approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/deferent-duct-study-transition.json' with { type: 'json' };
import { preArmVascularProfiles } from './arm-vascular-study-history.mjs';
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preDeferentDuctProfiles(profiles) {
  profiles = preArmVascularProfiles(profiles);
  assert.equal(hash(record), '14d5396f9f5912ee19187a8cf7fc9b25f3fb39a75c3fe0a749361b16b76746e0');
  if (hash(profiles) !== record.after) return profiles;
  const previous = structuredClone(profiles);
  for (const p of record.patches) {
    const ids = p.added.map((s) => s.id);
    assert.deepEqual(previous[p.region].focuses.filter((s) => ids.includes(s.id)), p.added);
    assert.deepEqual(previous[p.region].references, p.referencesAfter);
    previous[p.region].focuses = previous[p.region].focuses.filter((s) => !ids.includes(s.id));
    previous[p.region].references = structuredClone(p.referencesBefore);
  }
  assert.equal(hash(previous), record.before);
  return previous;
}
