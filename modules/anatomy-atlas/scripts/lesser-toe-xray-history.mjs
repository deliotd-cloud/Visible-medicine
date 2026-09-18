// Exact offline editorial reconstruction; never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/lesser-toe-xray-pins.json' with {type:'json'};
import transition from '../content/lesser-toe-xray-transition.json' with {type:'json'};
import {beforeDistalPalmarMri} from './distal-palmar-mri-history.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function beforeLesserToeXray(api){
 api=beforeDistalPalmarMri(api);
 assert.equal(hash(pins),'5bb38162ef509d8ea378c664c50733eda4c0867791e06e9b9dafd2306dba8d60');
 assert.equal(hash(transition),'9c972d47abf24aa2772514b0bbf545c78dff52b1f52e246a201e45861325199f');
 assert.equal(transition.parentCommit,pins.sourceCommit);assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [index,entry] of pins.entries.entries()){
  assert.equal(transition.entries[index].id,entry.identity.id);assert.deepEqual(Object.keys(transition.entries[index].sections),entry.topics);
  for(const topic of entry.topics){
   const lesson=api.bodyLesson(entry.identity,topic);
   if(isDeepStrictEqual(lesson,entry.previous[topic]))old++;
   else{assert.equal(hash(lesson),transition.entries[index].sections[topic],'Unrecorded lesser-toe X-ray teaching');current++;}
   prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:entry.previous[topic]});
  }
 }
 assert(old===24||current===24,'Mixed lesser-toe X-ray teaching history');if(old===24)return api;
 const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);return entry&&isDeepStrictEqual(s,entry.identity)?structuredClone(entry.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
