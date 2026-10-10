// Exact test-only editorial replay; never learner content or approvals.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/carpal-bone-quiz-pins.json' with {type:'json'};
import transition from '../content/carpal-bone-quiz-transition.json' with {type:'json'};
import {hash,snapshot} from './carpal-bone-quiz-transition.mjs';
import {beforeThoracicBoneQuiz} from './thoracic-bone-quiz-history.mjs';
import {beforeThoracicBoneEpoch} from './late-teaching-epoch-history.mjs';
import {beforeCubitalVenousUltrasound} from './cubital-venous-ultrasound-history.mjs';
export function beforeCarpalBoneQuiz(input,display){
 assert.equal(hash(pins),'78a9ccce84a5c6c10fca40d6448943b3a0338a5e7cb63e4e77bd578e6cf03d70');
 assert.equal(hash(transition),'80f8f7a56371e2af64f9afcbab3b9b204e0257a28df12616f65b60ef684838e5');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 input=beforeThoracicBoneEpoch(input,display);
 if(display&&typeof input.bodyLesson==='function'&&hash(snapshot(input,display))===pins.previousAllLessonsAndRecipesHash){
  // Cubital US was already authored at this epoch. Verify its frozen record
  // and any exported helper without changing the exact carpal parent state.
  beforeCubitalVenousUltrasound(input,display);
  return input;
 }
 const api=beforeThoracicBoneQuiz(input,display);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,16);assert.equal(transition.entries.length,16);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  assert.deepEqual(e.topics,['quiz']);const row=rows.get(e.identity.id+'|quiz');assert(row);assert.equal(row.previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),row.currentHash,'Unrecorded carpal quiz change');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===16||current===16,'Mixed carpal quiz history');
 if(old===16){
  if(display)assert.equal(hash(snapshot(api,display)),pins.previousAllLessonsAndRecipesHash,'Unrecorded complete prior carpal teaching snapshot');
  return api;
 }
 if(display)assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash,'Unrecorded complete teaching snapshot');
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 const restored={...api,bodyLesson,carpalBoneQuizLesson(s,t){return matches(s,t)?undefined:api.carpalBoneQuizLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 if(display)assert.equal(hash(snapshot(restored,display)),pins.previousAllLessonsAndRecipesHash,'Carpal quiz baseline mismatch');
 return restored;
}
