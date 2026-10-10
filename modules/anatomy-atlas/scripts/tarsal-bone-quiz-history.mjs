// Exact test-only editorial replay. Never shipped or used to transfer approval.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import pins from '../content/tarsal-bone-quiz-pins.json' with {type:'json'};
import transition from '../content/tarsal-bone-quiz-transition.json' with {type:'json'};
import {beforeHandArterialCt} from './hand-arterial-ct-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeTarsalBoneQuiz(api){
 api=beforeHandArterialCt(api);
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>api.bodyLesson(e.identity,'quiz')===undefined))return api;
 assert.equal(hash(pins),'73a6cc4e9f002faa2ad14704e67a22b7912514eb13e1dac08d0b7dc599192ce4');
 assert.equal(hash(transition),'80c1b0b8d77ba9eb99e4eeeb2c873a8757b982b61c3b78952d4c0259f89b56c9');
 assert.equal(transition.parentCommit,pins.parentCommit);assert.equal(transition.pinsHash,hash(pins));
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,14);assert.equal(transition.entries.length,14);
 let old=0,current=0;
 for(const e of pins.entries){assert.deepEqual(e.topics,['quiz']);const row=rows.get(e.identity.id+'|quiz');assert(row);assert.equal(row.previousHash,hash(e.previous.quiz));const now=hash(api.bodyLesson(e.identity,'quiz'));if(now===row.previousHash)old++;else{assert.equal(now,row.currentHash,'Unrecorded tarsal quiz');current++;}}
 assert(old===14||current===14,'Mixed tarsal quiz history');if(old===14)return api;
 const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));
 const bodyLesson=(s,tab)=>{const e=entries.get(s.id);if(!e||tab!=='quiz')return api.bodyLesson(s,tab);assert.equal(JSON.stringify(s),JSON.stringify(e.identity),'Foreign tarsal source cannot replay');return structuredClone(e.previous.quiz);};
 return {...api,bodyLesson,bodyContent(s,tab){const {readiness:_r,...content}=bodyLesson(s,tab);return content;}};
}
