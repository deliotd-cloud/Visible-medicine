// Offline editorial reconstruction only, never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/lower-venous-imaging-pins.json' with {type:'json'};
import transition from '../content/lower-venous-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeLowerVenousImaging(api){
 assert.equal(hash(pins),'eb63c410158296d32ef2958585d98f843ad02a9e658c6439e6d22bac3fdbafc7');
 assert.equal(hash(transition),'c685c25d29e8c6a4aff343e3c338ba7f6667f7eec1f985ca0da6c5e42a59521f');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);
  assert.deepEqual(Object.keys(transition.entries[i].sections),e.topics);
  for(const t of e.topics){
   const lesson=api.bodyLesson(e.identity,t);assert.equal(e.previous[t].readiness,'pending');
   if(isDeepStrictEqual(lesson,e.previous[t]))old++;
   else{assert.equal(hash(lesson),transition.entries[i].sections[t],'Unrecorded lower-venous teaching');current++;}
   prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});
  }
 }
 assert.equal(prior.size,42);assert(old===42||current===42,'Mixed lower-venous teaching history');if(old===42)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
