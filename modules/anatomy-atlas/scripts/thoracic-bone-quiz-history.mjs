// Exact test-only editorial replay; never learner content or approvals.
import assert from 'node:assert/strict';
import {beforeThoracicBoneEpoch} from './late-teaching-epoch-history.mjs';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/thoracic-bone-quiz-pins.json' with {type:'json'};
import transition from '../content/thoracic-bone-quiz-transition.json' with {type:'json'};
import {hash,snapshot} from './thoracic-bone-quiz-transition.mjs';
export function beforeThoracicBoneQuiz(api,display){
 api=beforeThoracicBoneEpoch(api,display);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'17aff08d0f326b93bea58fa6fbdc2657502e0e5a99e5addde5afe5946e7819eb');
 assert.equal(hash(transition),'709d98adc3eda7ebaaf19de5da4a42774655688ec08360db98118dae1d064b37');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,27);assert.equal(transition.entries.length,27);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  assert.deepEqual(e.topics,['quiz']);const row=rows.get(e.identity.id+'|quiz');assert(row);assert.equal(row.previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),row.currentHash,'Unrecorded thoracic quiz change');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===27||current===27,'Mixed thoracic quiz history');
 if(old===27){
  if(display)assert.equal(hash(snapshot(api,display)),pins.previousAllLessonsAndRecipesHash,'Unrecorded complete prior teaching snapshot');
  return api;
 }
 if(display)assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash,'Unrecorded complete teaching snapshot');
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 const restored={...api,bodyLesson,thoracicBoneQuizLesson(s,t){return matches(s,t)?undefined:api.thoracicBoneQuizLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 if(display)assert.equal(hash(snapshot(restored,display)),pins.previousAllLessonsAndRecipesHash,'Thoracic quiz baseline mismatch');
 return restored;
}
