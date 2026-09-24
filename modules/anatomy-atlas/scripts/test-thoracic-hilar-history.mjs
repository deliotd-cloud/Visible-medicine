import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {dissectionProfiles} from '../app/dissection-data.ts';
import {preThoracicHilarProfiles,preHilarProfilesHash} from './thoracic-hilar-study-history.mjs';
import {prePosteriorMediastinalProfiles} from './posterior-mediastinal-study-history.mjs';
const original=JSON.stringify(dissectionProfiles);
const hilarEra=prePosteriorMediastinalProfiles(dissectionProfiles);
const previous=preThoracicHilarProfiles(dissectionProfiles);
assert.equal(createHash('sha256').update(JSON.stringify(previous)).digest('hex'),preHilarProfilesHash);
assert.equal(JSON.stringify(dissectionProfiles),original,'Replay never changes runtime recipes');
assert.deepEqual(preThoracicHilarProfiles(hilarEra),previous,'Current input chains through posterior reversal');
assert.deepEqual(preThoracicHilarProfiles(previous),previous);
for(const mutate of [
 p=>p.thorax.focuses.find(f=>f.id==='right-pulmonary-hilum').title+=' altered',
 p=>p['whole-body'].focuses.find(f=>f.id==='left-pulmonary-hilum').requiredSourceBindings.pop(),
 p=>p.thorax.focuses[0].description+=' altered',
 p=>p['whole-body'].references.push('https://example.invalid/unreviewed'),
 p=>p.thorax.focuses.push(structuredClone(p.thorax.focuses.find(f=>f.id==='left-pulmonary-hilum'))),
]){
 const changed=structuredClone(hilarEra);mutate(changed);
 assert.throws(()=>preThoracicHilarProfiles(changed),/Unrecorded pulmonary-hilar recipe edit/);
}
console.log(JSON.stringify({passed:true,priorHash:preHilarProfilesHash,rejectedChanges:5,runtimeUnchanged:true}));
