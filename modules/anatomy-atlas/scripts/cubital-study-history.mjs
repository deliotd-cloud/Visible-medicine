// Exact offline recipe reconstruction; never runtime state or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/cubital-study-transition.json' with {type:'json'};
import {prePortalHepaticProfiles} from './portal-hepatic-study-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preCubitalProfiles(profiles){
 profiles=prePortalHepaticProfiles(profiles);
 assert.equal(hash(record),'81c3d5b56128840a173dce7c6b335e47a0456b91ec40dcec58fd44c08e8a5b14');
 const ids=record.patches[0].added.map(s=>s.id);
 if(!Object.values(profiles).some(p=>p.focuses.some(f=>ids.includes(f.id))))return profiles;
 assert.equal(hash(profiles),record.after,'Unrecorded cubital recipe changes');
 const prior=structuredClone(profiles);
 for(const p of record.patches){
  assert.deepEqual(prior[p.region].focuses.filter(f=>ids.includes(f.id)),p.added);
  assert.deepEqual(prior[p.region].references,p.referencesAfter);
  prior[p.region].focuses=prior[p.region].focuses.filter(f=>!ids.includes(f.id));
  prior[p.region].references=structuredClone(p.referencesBefore);
 }
 assert.equal(hash(prior),record.before,'Every previous recipe retained');return prior;
}
export function beforeCubitalStudies(api){
 const profiles=preCubitalProfiles(api.dissectionProfiles);
 return profiles===api.dissectionProfiles?api:{...api,dissectionProfiles:profiles};
}
