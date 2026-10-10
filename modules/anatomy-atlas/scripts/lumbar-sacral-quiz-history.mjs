// Exact test-only editorial replay; not learner content or an approval API.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/lumbar-sacral-quiz-pins.json' with {type:'json'};
import transition from '../content/lumbar-sacral-quiz-transition.json' with {type:'json'};
import {hash,snapshot} from './lumbar-sacral-quiz-transition.mjs';
import {beforeWristUltrasound} from './wrist-ultrasound-history.mjs';
export function beforeLumbarSacralQuiz(api,display){
 api=beforeWristUltrasound(api);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'889a3feaf6c308149c6bb74d333599447f5299be88bbf3bfd57ca051b37449aa');
 assert.equal(hash(transition),'53a4cdcc43101488e99b29e9c1f2efaa5addfee20fd0b05dbd43d8498769ee1a');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,6);assert.equal(transition.entries.length,6);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  assert.deepEqual(e.topics,['quiz']);const row=rows.get(e.identity.id+'|quiz');assert(row);assert.equal(row.previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),row.currentHash,'Unrecorded lumbar and sacral quiz change');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===6||current===6,'Mixed lumbar and sacral quiz history');if(old===6)return api;
 if(display)assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash,'Unrecorded complete teaching snapshot');
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 const restored={...api,bodyLesson,lumbarSacralQuizLesson(s,t){return matches(s,t)?undefined:api.lumbarSacralQuizLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 if(display)assert.equal(hash(snapshot(restored,display)),pins.previousAllLessonsAndRecipesHash,'Cranial bone quiz baseline mismatch');
 return restored;
}
