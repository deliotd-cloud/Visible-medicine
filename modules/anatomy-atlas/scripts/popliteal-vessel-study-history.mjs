// Exact offline reversal only; never a runtime or clinical approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/popliteal-vessel-study.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const hasPoplitealVesselProfiles=profiles=>record.regions.some(region=>profiles[region].focuses.some(f=>f.id===record.id));
export function prePoplitealVesselProfiles(profiles){
 assert.equal(hash(record),'92b4aa63f8f6ebe2ed538cff582fd0e16bcc45cd5e4372c16acdff323f5da3fc');
 if(hash(profiles)===record.beforeHash)return structuredClone(profiles);
 assert.equal(hash(profiles),record.afterHash,'Unrecorded popliteal vessel study edit');
 const previous=structuredClone(profiles);
 for(const patch of record.patches){
  const profile=previous[patch.region];
  assert.deepEqual(profile.focuses.filter(f=>f.id===record.id),patch.additions);
  assert.deepEqual(profile.references,patch.referencesAfter);
  profile.focuses=profile.focuses.filter(f=>f.id!==record.id);
  profile.references=structuredClone(patch.referencesBefore);
 }
 assert.equal(hash(previous),record.beforeHash,'Every prior profile is preserved exactly');
 return previous;
}
