import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeThoracicBoneQuiz} from './thoracic-bone-quiz-history.mjs';
import {hash,snapshot} from './thoracic-bone-quiz-transition.mjs';
const pins=JSON.parse(await readFile('content/thoracic-bone-quiz-pins.json'));
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog),parent=await exactSourceHistoryApi(pins.parentCommit);
const restored=beforeThoracicBoneQuiz(api,display);
assert.deepEqual(snapshot(restored,display),snapshot(parent,display));assert.equal(beforeThoracicBoneQuiz(restored,display),restored);
const first=pins.entries[0];let rejected=0;
for(const mode of ['mixed','foreign']){
 assert.throws(()=>beforeThoracicBoneQuiz({...api,bodyLesson(s,t){const current=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='quiz'?mode==='mixed'?first.previous.quiz:{...current,body:'Unreviewed foreign question'}:current;}},display),/Mixed|Unrecorded/);rejected++;
}
const other=display.structures.find(s=>!pins.entries.some(e=>e.identity.id===s.id));assert(other);
assert.throws(()=>beforeThoracicBoneQuiz({...api,bodyLesson(s,t){const current=api.bodyLesson(s,t);return s.id===other.id&&t==='anatomy'?{...current,body:'Foreign unrelated anatomy'}:current;}},display),/Unrecorded/);rejected++;
for(const e of pins.entries){
 assert.equal(restored.thoracicBoneQuizLesson(e.identity,'quiz'),undefined);
 const lesson=restored.bodyLesson(e.identity,'quiz');lesson.body+=' mutation';assert.deepEqual(restored.bodyLesson(e.identity,'quiz'),e.previous.quiz);
 const foreign={...e.identity,name:e.identity.name+' foreign'};
 assert.deepEqual(restored.bodyLesson(foreign,'quiz'),api.bodyLesson(foreign,'quiz'));
}
console.log(JSON.stringify({restoredTopicPlacements:9936,rejectedHistoryStates:rejected,previousSnapshotHash:hash(snapshot(restored,display)),clinicalApproval:false}));
