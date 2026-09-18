// Offline editorial reconstruction only, never a runtime or approval migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {beforeCubitalStudies} from './cubital-study-history.mjs';
import {beforePalmarArterialImaging} from './palmar-arterial-imaging-history.mjs';
import pins from '../content/regional-branch-imaging-pins.json' with {type:'json'};
import transition from '../content/regional-branch-imaging.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeRegionalBranchImaging(api){
 api=beforePalmarArterialImaging(api);
 api=beforeCubitalStudies(api);
 assert.equal(hash(pins),'afd513145094b736a2203aad49efbe16a56cc66808b9292a36aceb79b4b17dcb');
 assert.equal(hash(transition),'80142843caa8d2a671dbc7695035d7e9fca16f28fbd9f8b70a569ae7f6b45ee3');
 assert.equal(transition.parentCommit,pins.sourceCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const prior=new Map();let old=0,current=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(transition.entries[i].id,e.identity.id);
  assert.deepEqual(Object.keys(transition.entries[i].sections),e.topics);
  for(const t of e.topics){
   const lesson=api.bodyLesson(e.identity,t);assert.equal(e.previous[t].readiness,'pending');
   if(isDeepStrictEqual(lesson,e.previous[t]))old++;
   else{assert.equal(hash(lesson),transition.entries[i].sections[t],'Unrecorded regional-branch teaching');current++;}
   prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});
  }
 }
 assert.equal(prior.size,8);assert(old===8||current===8,'Mixed regional-branch teaching history');if(old===8)return api;
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 return {...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
}
