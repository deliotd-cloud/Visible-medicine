// Exact offline transition only; never runtime or clinical approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/portal-hepatic-study-transition.json' with {type:'json'};
import {preAnteriorCardiacVeinProfiles} from './anterior-cardiac-vein-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function prePortalHepaticProfiles(profiles){
 profiles=preAnteriorCardiacVeinProfiles(profiles);
 assert.equal(hash(record),'491ad7b4e5a710f13385d0b6bfe710cdc4b68c646c34a09f60acb5c86ffceee0');
 const ids=record.patches[0].added.map(s=>s.id);
 if(!Object.values(profiles).some(p=>p.focuses.some(f=>ids.includes(f.id))))return profiles;
 assert.equal(hash(profiles),record.after,'Unrecorded portal/hepatic recipe changes');
 const prior=structuredClone(profiles);
 for(const p of record.patches){
  assert.deepEqual(prior[p.region].focuses.filter(f=>ids.includes(f.id)),p.added);
  assert.deepEqual(prior[p.region].references,p.referencesAfter);
  prior[p.region].focuses=prior[p.region].focuses.filter(f=>!ids.includes(f.id));
  prior[p.region].references=structuredClone(p.referencesBefore);
 }
 assert.equal(hash(prior),record.before);return prior;
}
