// Exact offline reconstruction for historical tests, never an approval migration.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/inferior-epigastric-study-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preInferiorEpigastricProfiles(profiles) {
  assert.equal(hash(record),'c21566bc033cf08c1dc7d8fae22b57a529551445384280d7a9023c9231108f03');
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
