// Exact offline editorial reconstruction; never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/metatarsal-surface-imaging-pins.json' with {type:'json'};
import transition from '../content/metatarsal-surface-imaging-transition.json' with {type:'json'};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeMetatarsalSurfaceImaging(api){
 assert.equal(hash(pins),'926096f3aff48e09de89f4d9498bf569661eabea621ea462ed17401116eb311c');
 assert.equal(hash(transition),'eadae51f978008dd30fc7a78ee9df234285b38544c343deae5de46a035cd3524');
 assert.equal(transition.parentCommit,pins.sourceCommit);assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [index,entry] of pins.entries.entries()){
  assert.equal(transition.entries[index].id,entry.identity.id);assert.deepEqual(Object.keys(transition.entries[index].sections),entry.topics);
  for(const topic of entry.topics){
   const lesson=api.bodyLesson(entry.identity,topic);
   if(isDeepStrictEqual(lesson,entry.previous[topic]))old++;
   else{assert.equal(hash(lesson),transition.entries[index].sections[topic],'Unrecorded metatarsal-surface teaching');current++;}
   prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:entry.previous[topic]});
  }
 }
 assert(old===20||current===20,'Mixed metatarsal-surface teaching history');if(old===20)return api;
 const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);return entry&&isDeepStrictEqual(s,entry.identity)?structuredClone(entry.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
