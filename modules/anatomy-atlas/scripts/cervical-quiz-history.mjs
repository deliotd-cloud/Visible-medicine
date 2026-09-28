// Test-only exact editorial replay; never grants source or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/cervical-quiz-pins.json' with {type:'json'};
import transition from '../content/cervical-quiz-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeCervicalQuiz(api){
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'b931deadc7e703bb738f8283ca9241ce30bb31d8943a512acf93fd5173bea18b');
 assert.equal(hash(transition),'c493592ec5618a38ac6a32a85934a9b2c362f2d4393db81a6050c05cbdfd91d8');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.equal(transition.entries.length,5);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  const records=transition.entries.filter(r=>r.id===e.identity.id&&r.tab==='quiz');
  assert.equal(records.length,1);assert.equal(records[0].previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');
  if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),records[0].currentHash,'Unrecorded cervical quiz');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===5||current===5,'Mixed cervical quiz history');if(old===5)return api;
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 return {...api,bodyLesson,
  cervicalQuizLesson(s,t){return matches(s,t)?undefined:api.cervicalQuizLesson?.(s,t);},
  bodyContent(s,t){const {readiness:_readiness,...shown}=bodyLesson(s,t);return shown;},
 };
}
