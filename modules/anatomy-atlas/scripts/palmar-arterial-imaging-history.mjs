// Exact offline editorial reconstruction; never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/palmar-arterial-imaging-pins.json' with {type:'json'};
import transition from '../content/palmar-arterial-imaging-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforePalmarArterialImaging(api){
 assert.equal(hash(pins),'dd76c97a4730bf481d6e9f9b3b70cff270616622638587e04610720782a81439');assert.equal(hash(transition),'9631318ed39e90d3632946642de742f72c044eb4b4ab471cc23457a1553ddb47');
 assert.equal(transition.parentCommit,pins.sourceCommit);assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [index,entry] of pins.entries.entries()){
  assert.equal(transition.entries[index].id,entry.identity.id);assert.deepEqual(Object.keys(transition.entries[index].sections),entry.topics);
  for(const topic of entry.topics){
   const lesson=api.bodyLesson(entry.identity,topic);
   if(isDeepStrictEqual(lesson,entry.previous[topic]))old++;
   else{assert.equal(hash(lesson),transition.entries[index].sections[topic],'Unrecorded palmar-arterial teaching');current++;}
   prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:entry.previous[topic]});
  }
 }
 assert(old===24||current===24,'Mixed palmar-arterial teaching history');if(old===24)return api;
 const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);return entry&&isDeepStrictEqual(s,entry.identity)?structuredClone(entry.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
