// Test-only exact editorial replay; never grants source or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/abdominal-organ-quiz-pins.json' with {type:'json'};
import transition from '../content/abdominal-organ-quiz-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeAbdominalOrganQuiz(api){
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'a14e02a7320d41488326a3ff2acab3892cf010d9fb545083eed2e233812f912c');
 assert.equal(hash(transition),'2297267988739e802b49e3362df5e2febafb7694c95fd3bbcb609516e453e2ee');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.equal(transition.entries.length,6);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  const records=transition.entries.filter(r=>r.id===e.identity.id&&r.tab==='quiz');
  assert.equal(records.length,1);assert.equal(records[0].previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');
  if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),records[0].currentHash,'Unrecorded abdominal organ quiz');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===6||current===6,'Mixed abdominal organ quiz history');if(old===6)return api;
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 return {...api,bodyLesson,
  abdominalOrganQuizLesson(s,t){return matches(s,t)?undefined:api.abdominalOrganQuizLesson?.(s,t);},
  bodyContent(s,t){const {readiness:_readiness,...shown}=bodyLesson(s,t);return shown;},
 };
}
