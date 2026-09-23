// Offline editorial reconstruction only, never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/forearm-venous-imaging-pins.json' with {type:'json'};
import transition from '../content/forearm-venous-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeForearmVenousImaging(api){
 assert.equal(hash(pins),'f8ff39da623aefce5324490765dca69a33ff4f823ad032ae62037f68acd8c919');
 assert.equal(hash(transition),'b37725ae62b4a66e05a18b14c05c8677a63850a2745130543d737b3593d380a6');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);
  assert.deepEqual(Object.keys(transition.entries[i].sections),e.topics);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);assert.equal(e.previous[t].readiness,'pending');
   if(isDeepStrictEqual(lesson,e.previous[t]))old++;
   else{assert.equal(hash(lesson),transition.entries[i].sections[t],'Unrecorded forearm-venous teaching');current++;}
   prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});
  }
 }
 assert.equal(prior.size,4);assert(old===4||current===4,'Mixed forearm-venous teaching history');if(old===4)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
