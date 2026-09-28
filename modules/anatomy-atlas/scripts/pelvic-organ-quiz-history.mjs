// Test-only exact editorial replay; never grants source or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {shoulderBeforeSoftTissueXray} from './shoulder-soft-tissue-xray-history.mjs';
import pins from '../content/pelvic-organ-quiz-pins.json' with {type:'json'};
import transition from '../content/pelvic-organ-quiz-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforePelvicOrganQuiz(api){
 if (api.structures) api = {...api, structures: shoulderBeforeSoftTissueXray(api.structures)};
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'953dec1a76e482cc5f6638d982ad5b091bfe436354a8172e1797ab0697d404fe');
 assert.equal(hash(transition),'17549e569b70db0741d321b60180b49a1e41ddd61d8b1e5d2ad7193eeb36abf3');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.equal(transition.entries.length,8);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  const records=transition.entries.filter(r=>r.id===e.identity.id&&r.tab==='quiz');
  assert.equal(records.length,1);assert.equal(records[0].previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');
  if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),records[0].currentHash,'Unrecorded pelvic organ quiz');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===8||current===8,'Mixed pelvic organ quiz history');if(old===8)return api;
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 return {...api,bodyLesson,
  pelvicOrganQuizLesson(s,t){return matches(s,t)?undefined:api.pelvicOrganQuizLesson?.(s,t);},
  bodyContent(s,t){const {readiness:_readiness,...shown}=bodyLesson(s,t);return shown;},
 };
}
