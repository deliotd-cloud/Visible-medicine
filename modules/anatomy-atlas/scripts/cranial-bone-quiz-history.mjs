// Exact test-only editorial replay; not learner content or an approval API.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/cranial-bone-quiz-pins.json' with {type:'json'};
import transition from '../content/cranial-bone-quiz-transition.json' with {type:'json'};
import {hash,snapshot} from './cranial-bone-quiz-transition.mjs';
export function beforeCranialBoneQuiz(api,display){
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'f7df7164f4ab0a662fa77027ca8825a8c8193fb46d07ae6f1e559c5d02d5cc56');
 assert.equal(hash(transition),'eed6d2d3ecbb5723e5221f775ef96e9c1d537748a375bccf52086a75052b9932');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,8);assert.equal(transition.entries.length,8);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  assert.deepEqual(e.topics,['quiz']);const row=rows.get(e.identity.id+'|quiz');assert(row);assert.equal(row.previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),row.currentHash,'Unrecorded cranial bone quiz change');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===8||current===8,'Mixed cranial bone quiz history');if(old===8)return api;
 if(display)assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash,'Unrecorded complete teaching snapshot');
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 const restored={...api,bodyLesson,cranialBoneQuizLesson(s,t){return matches(s,t)?undefined:api.cranialBoneQuizLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 if(display)assert.equal(hash(snapshot(restored,display)),pins.previousAllLessonsAndRecipesHash,'Cranial bone quiz baseline mismatch');
 return restored;
}
