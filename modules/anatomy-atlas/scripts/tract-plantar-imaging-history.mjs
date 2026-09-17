// Offline editorial reconstruction only, never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/tract-plantar-imaging-pins.json' with {type:'json'};
import transition from '../content/tract-plantar-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeTractPlantarImaging(api){
 assert.equal(hash(pins),'941a68a2cc698be73085d5942a04021dec6a7849373ad27111b6528cbc9ce45f');
 assert.equal(hash(transition),'7f72be23a8f5c2300e08e44696dd8d6bb9e8d5eab3192cc0f28cc3e99b611017');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);
  assert.deepEqual(Object.keys(transition.entries[i].sections),e.topics);
  for(const t of e.topics){
   const lesson=api.bodyLesson(e.identity,t);assert.equal(e.previous[t].readiness,'pending');
   if(isDeepStrictEqual(lesson,e.previous[t]))old++;
   else{assert.equal(hash(lesson),transition.entries[i].sections[t],'Unrecorded tract-plantar teaching');current++;}
   prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});
  }
 }
 assert.equal(prior.size,6);assert(old===6||current===6,'Mixed tract-plantar teaching history');if(old===6)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
