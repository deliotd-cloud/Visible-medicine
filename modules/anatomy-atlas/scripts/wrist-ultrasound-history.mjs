// Exact test-only editorial replay; never learner content or approvals.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/wrist-ultrasound-pins.json' with {type:'json'};
import transition from '../content/wrist-ultrasound-transition.json' with {type:'json'};
import {hash,snapshot} from './wrist-ultrasound-transition.mjs';
import {beforeCarpalBoneQuiz} from './carpal-bone-quiz-history.mjs';
export function beforeWristUltrasound(api,display){
 api=beforeCarpalBoneQuiz(api,display);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'ultrasound')===undefined))return api;
 assert.equal(hash(pins),'4e447dda0e16ed3a9255c701240b1b65de5678493969ddc6d833142ad40dc426');
 assert.equal(hash(transition),'fd92d24fac819eb5237d2155acd39c6f4570fc738c9558920c3f55b0b5505cd4');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,8);assert.equal(transition.entries.length,8);
 const previous=new Map();let old=0,current=0;
 for(const e of pins.entries){
  assert.deepEqual(e.topics,['ultrasound']);const row=rows.get(e.identity.id+'|ultrasound');assert(row);assert.equal(row.previousHash,hash(e.previous.ultrasound));
  const now=api.bodyLesson(e.identity,'ultrasound');if(isDeepStrictEqual(now,e.previous.ultrasound))old++;
  else{assert.equal(hash(now),row.currentHash,'Unrecorded wrist ultrasound change');current++;}
  previous.set(e.identity.id,e);
 }
 assert(old===8||current===8,'Mixed wrist ultrasound history');if(old===8)return api;
 if(display)assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash,'Unrecorded complete teaching snapshot');
 const matches=(s,t)=>t==='ultrasound'&&isDeepStrictEqual(s,previous.get(s.id)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id).previous.ultrasound):api.bodyLesson(s,t);
 const restored={...api,bodyLesson,wristUltrasoundLesson(s,t){return matches(s,t)?undefined:api.wristUltrasoundLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 if(display)assert.equal(hash(snapshot(restored,display)),pins.previousAllLessonsAndRecipesHash,'Wrist ultrasound baseline mismatch');
 return restored;
}
