import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {prePesAnserineProfiles} from './pes-anserine-study-history.mjs';
import record from '../content/pes-anserine-study.transition.json' with {type:'json'};
import {prePoplitealVesselProfiles} from './popliteal-vessel-study-history.mjs';
const {api}=await contentContext(),profiles=prePoplitealVesselProfiles(api.dissectionProfiles);
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const before=prePesAnserineProfiles(profiles);
assert.equal(hash(before),record.beforeHash);
assert.deepEqual(prePesAnserineProfiles(before),before);
assert.notEqual(prePesAnserineProfiles(before),before);
const mutations=[
 p=>p['whole-body'].focuses.find(f=>f.id===record.ids[0]).title+='x',
 p=>p['whole-body'].focuses=p['whole-body'].focuses.filter(f=>f.id!==record.ids[1]),
 p=>p['whole-body'].references[record.reference.index]='foreign',
 p=>p.thigh.orientation+='x',
 p=>p['whole-body'].focuses.reverse(),
 p=>p['whole-body'].focuses.find(f=>f.id===record.ids[0]).requiredSourceBindings[0].sources[0].sha256='foreign',
];
for(const change of mutations){const p=structuredClone(profiles);change(p);assert.throws(()=>prePesAnserineProfiles(p),/Unrecorded/);}
assert.equal(hash(profiles),record.afterHash);
console.log(JSON.stringify({passed:true,rejectedChanges:mutations.length,priorRecipesPreserved:true}));
