import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {prePoplitealVesselProfiles} from './popliteal-vessel-study-history.mjs';
import record from '../content/popliteal-vessel-study.transition.json' with {type:'json'};
const {api}=await contentContext(),profiles=api.dissectionProfiles;
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const previous=prePoplitealVesselProfiles(profiles);
assert.equal(hash(previous),record.beforeHash);
assert.deepEqual(prePoplitealVesselProfiles(previous),previous);
assert.notEqual(prePoplitealVesselProfiles(previous),previous);
const mutations=[
 p=>p.leg.focuses.find(f=>f.id===record.id).title+='x',
 p=>p['whole-body'].focuses=p['whole-body'].focuses.filter(f=>f.id!==record.id),
 p=>p.leg.references.push('foreign'),
 p=>p.thigh.orientation+='x',
 p=>p.leg.focuses.reverse(),
 p=>p.leg.focuses.find(f=>f.id===record.id).requiredSourceBindings[0].sources[0].sha256='foreign',
];
for(const mutate of mutations){const changed=structuredClone(profiles);mutate(changed);assert.throws(()=>prePoplitealVesselProfiles(changed),/Unrecorded/);}
assert.equal(hash(profiles),record.afterHash);
console.log(JSON.stringify({passed:true,rejectedChanges:mutations.length,priorProfilesPreserved:true}));
