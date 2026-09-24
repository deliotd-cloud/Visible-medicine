// Offline editorial reconstruction only, never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {beforeIliacArterialImaging} from './iliac-arterial-imaging-history.mjs';
import pins from '../content/forearm-arterial-imaging-pins.json' with {type:'json'};
import transition from '../content/forearm-arterial-imaging.transition.json' with {type:'json'};
import ctPins from '../content/forearm-arterial-ct-pins.json' with {type:'json'};
import ctTransition from '../content/forearm-arterial-ct.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeForearmArterialCt(api){
 assert.equal(hash(ctPins),'344ebcbb226e8099e9f594d3f18c9221fe9a2aa5f0572017f4666cc4f0d1832e');
 assert.equal(hash(ctTransition),'2b03ed1c01f59e596901119dca672fb9098bc1eba2c966c273657a856b18c53c');
 assert.equal(ctTransition.parentCommit,ctPins.sourceCommit);
 assert.equal(ctTransition.previousAllLessonsAndRecipesHash,ctPins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [i,e] of ctPins.entries.entries()){
  assert.equal(ctTransition.entries[i].id,e.identity.id);
  assert.deepEqual(Object.keys(ctTransition.entries[i].sections),e.topics);
  const lesson=api.bodyLesson(e.identity,'ct');assert.equal(e.previous.ct.readiness,'pending');
  if(isDeepStrictEqual(lesson,e.previous.ct))old++;
  else{assert.equal(hash(lesson),ctTransition.entries[i].sections.ct,'Unrecorded forearm-arterial CT teaching');current++;}
  prior.set(e.identity.id+'|ct',{identity:e.identity,lesson:e.previous.ct});
 }
 assert.equal(prior.size,4);assert(old===4||current===4,'Mixed forearm-arterial CT teaching history');if(old===4)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
export function beforeForearmArterialImaging(api){
 api=beforeForearmArterialCt(api);
 api=beforeIliacArterialImaging(api);
 assert.equal(hash(pins),'4b8b7d0a331b5698e12a39fe86d10d0bd2fc2c38a0ca079278df88f7699828ba');
 assert.equal(hash(transition),'9d6fa0b2b1e63f55b16812ce57625e00fe547873e93bb7f87ff5318e73f102d5');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);
  assert.deepEqual(Object.keys(transition.entries[i].sections),e.topics);
  for(const t of e.topics){
   const lesson=api.bodyLesson(e.identity,t);assert.equal(e.previous[t].readiness,'pending');
   if(isDeepStrictEqual(lesson,e.previous[t]))old++;
   else{assert.equal(hash(lesson),transition.entries[i].sections[t],'Unrecorded forearm-arterial teaching');current++;}
   prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});
  }
 }
 assert.equal(prior.size,16);assert(old===16||current===16,'Mixed forearm-arterial teaching history');if(old===16)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
