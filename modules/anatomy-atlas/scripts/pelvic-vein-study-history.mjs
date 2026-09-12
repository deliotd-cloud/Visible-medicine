// Exact offline reconstruction for historical tests, never an approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/pelvic-vein-study-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function prePelvicVeinProfiles(profiles) {
  assert.equal(hash(record),'213d4e58b5cd4293025a7757dbed4336276bcb9b750b4d8955f6679fce231f8f');
  if(hash(profiles)!==record.after)return profiles;
  const previous=structuredClone(profiles);
  for(const patch of record.patches){
    const ids=patch.added.map(s=>s.id);
    assert.deepEqual(previous[patch.region].focuses.filter(s=>ids.includes(s.id)),patch.added);
    assert.deepEqual(previous[patch.region].references,patch.referencesAfter);
    previous[patch.region].focuses=previous[patch.region].focuses.filter(s=>!ids.includes(s.id));
    previous[patch.region].references=structuredClone(patch.referencesBefore);
  }
  assert.equal(hash(previous),record.before,'All earlier studies retained');
  return previous;
}
