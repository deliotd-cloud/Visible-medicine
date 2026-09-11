// Offline exact history only, never a runtime approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/genicular-study-transition.json' with { type: 'json' };
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preGenicularStudyProfiles(profiles) {
  assert.equal(hash(record), '6a2fa4b7f7889a203c8bd46c9ca8572ded68a8419208117c22fe6b5ec7e4a60e');
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
