// Offline evidence reconstruction only; never changes runtime or stored approvals.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import record from '../content/hand-intrinsic-study-transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preHandIntrinsicProfiles(profiles){
 assert.equal(hash(record),'08c491d7222d62486bc072fba6e775048052891b20921041a930eae7204c67d5');
 const ids=record.added.map(f=>f.id);
 if(!Object.values(profiles).some(p=>p.focuses.some(f=>ids.includes(f.id))))return profiles;
 assert.equal(hash(profiles),record.after,'Unrecorded hand-intrinsic recipe change');
 assert.deepEqual(profiles.hand.focuses.filter(f=>ids.includes(f.id)),record.added);
 const prior=structuredClone(profiles);prior.hand.focuses=prior.hand.focuses.filter(f=>!ids.includes(f.id));
 assert.equal(hash(prior),record.before,'Previous recipes must remain exact');return prior;
}
export function beforeHandIntrinsicStudies(api){
 const profiles=preHandIntrinsicProfiles(api.dissectionProfiles);
 return profiles===api.dissectionProfiles?api:{...api,dissectionProfiles:profiles};
}
