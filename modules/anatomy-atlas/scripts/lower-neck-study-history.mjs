// Offline reconstruction only, never modifies runtime anatomy or stored approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/lower-neck-study-transition.json' with {type:'json'};
import { preThoraxRespiratoryProfiles, thoraxRespiratoryProfilesHash } from './thorax-respiratory-history.mjs';
import { preForearmSuperficialVeinProfiles } from './forearm-superficial-vein-study-history.mjs';
import { preCentralAirwayProfiles } from './central-airway-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preLowerNeckProfiles(profiles){
 assert.equal(hash(record),'0a2efb94a26640e754261b5f85249a3b8da89b80e83ddd476f8058c4022ed05e');
 profiles=preForearmSuperficialVeinProfiles(preCentralAirwayProfiles(profiles));
 if(hash(profiles)===thoraxRespiratoryProfilesHash)profiles=preThoraxRespiratoryProfiles(profiles);
 const id='lower-neck-vessels-scalenes';
 if(!Object.values(profiles).some(p=>p.focuses.some(f=>f.id===id)))return profiles;
 assert.equal(hash(profiles),record.after,'Unrecorded lower-neck recipe change');
 const prior=structuredClone(profiles);
 for(const region of ['head-neck','whole-body']){
  assert.deepEqual(prior[region].focuses.filter(f=>f.id===id),record.added[region]);
  prior[region].focuses=prior[region].focuses.filter(f=>f.id!==id);
 }
 assert.equal(hash(prior),record.before,'Previous recipes must remain exact');return prior;
}
export function beforeLowerNeckStudy(api){
 const profiles=preLowerNeckProfiles(api.dissectionProfiles);
 return profiles===api.dissectionProfiles?api:{...api,dissectionProfiles:profiles};
}
