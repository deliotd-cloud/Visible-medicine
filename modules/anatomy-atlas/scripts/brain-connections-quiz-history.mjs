// Test-only exact editorial replay; never grants source or clinical approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {beforeFootSesamoidTeaching} from './foot-sesamoid-teaching-history.mjs';
import pins from '../content/brain-connections-quiz-pins.json' with {type:'json'};
import transition from '../content/brain-connections-quiz-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function beforeBrainConnectionsQuiz(api){
 api=beforeFootSesamoidTeaching(api);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'57e9fee36987b78f394d064b8320a62d0b37d95a60fb75e0e76ac1a4a08d0c04');
 assert.equal(hash(transition),'47dfd3def40bc16eab52da4443268cb3c0b76c29d97fdd7a81034536b3d629e6');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 assert.equal(transition.entries.length,8);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  const records=transition.entries.filter(r=>r.id===e.identity.id&&r.tab==='quiz');
  assert.equal(records.length,1);assert.equal(records[0].previousHash,hash(e.previous.quiz));
  const now=api.bodyLesson(e.identity,'quiz');
  if(isDeepStrictEqual(now,e.previous.quiz))old++;
  else{assert.equal(hash(now),records[0].currentHash,'Unrecorded brain connections quiz');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===8||current===8,'Mixed brain connections quiz history');if(old===8)return api;
 const matches=(s,t)=>t==='quiz'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.quiz):api.bodyLesson(s,t);
 return {...api,bodyLesson,
  brainConnectionsQuizLesson(s,t){return matches(s,t)?undefined:api.brainConnectionsQuizLesson?.(s,t);},
  bodyContent(s,t){const {readiness:_readiness,...shown}=bodyLesson(s,t);return shown;},
 };
}
