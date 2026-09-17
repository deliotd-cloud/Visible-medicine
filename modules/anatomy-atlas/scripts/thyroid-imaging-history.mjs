// Offline historical comparisons only. Never changes clinical review decisions.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/thyroid-imaging-pins.json' with {type:'json'};
import after from '../content/thyroid-imaging.transition.json' with {type:'json'};
export function authoringBeforeThyroidImaging({api,catalog},{deferWholeSnapshot=false}={}){
 assert.equal(hash(pins),'3f03d95adeb7a1c8defdd138837fdcea750742dc6cde23c96f69b804f83a6759');
 assert.equal(hash(after),'edba16dcc4f4dd14daf34b91bc9e96d1f2e63ed86f73f81aa1436031b8915bd8');
 assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const display=api.bodyDisplayCatalog(catalog),prior=new Map();
 for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(display[key],pins[key]);
 for(const b of pins.bundles)assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);
 let oldCount=0,newCount=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.equal(after.entries[i].id,e.identity.id);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(lesson,e.previous[t]))oldCount++;else{assert.equal(hash(lesson),after.entries[i].sections[t],'Unrecorded thyroid imaging change');newCount++;}prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});}
 }
 assert(oldCount===prior.size||newCount===prior.size,'Mixed thyroid imaging history state');if(oldCount===prior.size)return api;
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'thyroid imaging baseline mismatch');return historical;
}
