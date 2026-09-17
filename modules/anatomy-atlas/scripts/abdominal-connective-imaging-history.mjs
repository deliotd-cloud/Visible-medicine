// Offline editorial reconstruction only, never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/abdominal-connective-imaging-pins.json' with {type:'json'};
import transition from '../content/abdominal-connective-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeAbdominalConnectiveImaging(api){
 assert.equal(hash(pins),'e2e2fe457b0ca4d0c4255d0d4ac9da1b5143dc9430a9f6bb3b466c8c35a96c3c');
 assert.equal(hash(transition),'636bbd153923ce9724be2ff3f1fb0edad1fca07dec00fc75584d3e2b9c334ff9');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);
  assert.deepEqual(Object.keys(transition.entries[i].sections),e.topics);
  for(const t of e.topics){
   const lesson=api.bodyLesson(e.identity,t);assert.equal(e.previous[t].readiness,'pending');
   if(isDeepStrictEqual(lesson,e.previous[t]))old++;
   else{assert.equal(hash(lesson),transition.entries[i].sections[t],'Unrecorded abdominal-connective teaching');current++;}
   prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});
  }
 }
 assert.equal(prior.size,4);assert(old===4||current===4,'Mixed abdominal-connective teaching history');if(old===4)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
