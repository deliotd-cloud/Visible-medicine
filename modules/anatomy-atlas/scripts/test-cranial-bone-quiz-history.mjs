import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeCranialBoneQuiz} from './cranial-bone-quiz-history.mjs';
import {hash,snapshot} from './cranial-bone-quiz-transition.mjs';
const pins=JSON.parse(await readFile('content/cranial-bone-quiz-pins.json'));
const {api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog),parent=await exactSourceHistoryApi(pins.parentCommit);
const restored=beforeCranialBoneQuiz(api,display);
assert.deepEqual(snapshot(restored,display),snapshot(parent,display));assert.equal(beforeCranialBoneQuiz(restored,display),restored);
const first=pins.entries[0];let rejected=0;
for(const mode of ['mixed','foreign']){
 assert.throws(()=>beforeCranialBoneQuiz({...api,bodyLesson(s,t){const current=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='quiz'?mode==='mixed'?first.previous.quiz:{...current,body:'Unreviewed foreign question'}:current;}},display),/Mixed|Unrecorded/);rejected++;
}
const other=display.structures.find(s=>!pins.entries.some(e=>e.identity.id===s.id));assert(other);
assert.throws(()=>beforeCranialBoneQuiz({...api,bodyLesson(s,t){const current=api.bodyLesson(s,t);return s.id===other.id&&t==='anatomy'?{...current,body:'Foreign unrelated anatomy'}:current;}},display),/Unrecorded/);rejected++;
for(const e of pins.entries){
 assert.equal(restored.cranialBoneQuizLesson(e.identity,'quiz'),undefined);
 const lesson=restored.bodyLesson(e.identity,'quiz');lesson.body+=' mutation';assert.deepEqual(restored.bodyLesson(e.identity,'quiz'),e.previous.quiz);
}
// Pin the delivered cranial-quiz milestone; subsequent tour pins have their own exact transition test.
const before=JSON.parse((await import('node:child_process')).execFileSync('git',['show','a10f1fd19c7dcf27470943f4775cb509f7da811f:content/body-review-display-pins.json'],{encoding:'utf8'}));
const original=JSON.parse((await import('node:child_process')).execFileSync('git',['show',pins.parentCommit+':content/body-review-display-pins.json'],{encoding:'utf8'}));
assert.deepEqual(Object.fromEntries(Object.entries(before).filter(([k])=>k!=='pins')),Object.fromEntries(Object.entries(original).filter(([k])=>k!=='pins')));
assert.equal(before.pins.length,original.pins.length);const saved=new Map(original.pins.map(p=>[p.structureId,p.sha256]));
assert.deepEqual(before.pins.filter(p=>p.sha256!==saved.get(p.structureId)).map(p=>p.structureId).sort(),pins.entries.map(e=>e.identity.id).sort());
console.log(JSON.stringify({restoredTopicPlacements:9936,changedReviewPins:8,rejectedHistoryStates:rejected,previousSnapshotHash:hash(snapshot(restored,display)),clinicalApproval:false}));
