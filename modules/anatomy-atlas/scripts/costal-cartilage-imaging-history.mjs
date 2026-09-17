// Offline historical comparisons only; never changes clinical review decisions.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/costal-cartilage-imaging-pins.json' with {type:'json'};
import after from '../content/costal-cartilage-imaging.transition.json' with {type:'json'};
export function authoringBeforeCostalCartilageImaging({api,catalog},{deferWholeSnapshot=false}={}){
 assert.equal(hash(pins),'20fc459efdfdf66d0d4965c270b042b65b8c84683df1da71a5c0dc1ab2b4f0fb');
 assert.equal(hash(after),'3b6a569265570f4e1dc9d7cfc483ae2c6e092d0b5da89dce370c62276ebd924c');
 assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const display=api.bodyDisplayCatalog(catalog),prior=new Map();
 for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(display[key],pins[key]);
 for(const b of pins.bundles)assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);
 let oldCount=0,newCount=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.equal(after.entries[i].id,e.identity.id);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(lesson,e.previous[t]))oldCount++;else{assert.equal(hash(lesson),after.entries[i].sections[t],'Unrecorded costal cartilage change');newCount++;}prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});}
 }
 assert(oldCount===prior.size||newCount===prior.size,'Mixed costal cartilage history state');if(oldCount===prior.size)return api;
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'costal cartilage baseline mismatch');return historical;
}
