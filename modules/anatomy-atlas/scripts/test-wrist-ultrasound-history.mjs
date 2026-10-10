import assert from 'node:assert/strict';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeWristUltrasound} from './wrist-ultrasound-history.mjs';
import {hash,snapshot} from './wrist-ultrasound-transition.mjs';
import pins from '../content/wrist-ultrasound-pins.json' with {type:'json'};
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog),parent=await exactSourceHistoryApi(pins.parentCommit);
const restored=beforeWristUltrasound(api,display);
assert.deepEqual(snapshot(restored,display),snapshot(parent,display));assert.equal(beforeWristUltrasound(restored,display),restored);
const first=pins.entries[0];let rejected=0;
for(const mode of ['mixed','foreign']){
 assert.throws(()=>beforeWristUltrasound({...api,bodyLesson(s,t){const current=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='ultrasound'?mode==='mixed'?first.previous.ultrasound:{...current,body:'Foreign draft'}:current;}},display),/Mixed|Unrecorded/);rejected++;
}
const other=display.structures.find(s=>!pins.entries.some(e=>e.identity.id===s.id));assert(other);
assert.throws(()=>beforeWristUltrasound({...api,bodyLesson(s,t){const current=api.bodyLesson(s,t);return s.id===other.id&&t==='anatomy'?{...current,body:'Foreign anatomy'}:current;}},display),/Unrecorded/);rejected++;
for(const e of pins.entries){
 assert.equal(restored.wristUltrasoundLesson(e.identity,'ultrasound'),undefined);
 const lesson=restored.bodyLesson(e.identity,'ultrasound');lesson.body+=' mutation';assert.deepEqual(restored.bodyLesson(e.identity,'ultrasound'),e.previous.ultrasound);
}
console.log(JSON.stringify({restoredTopicPlacements:9936,rejectedHistoryStates:rejected,previousSnapshotHash:hash(snapshot(restored,display)),clinicalApproval:false}));
