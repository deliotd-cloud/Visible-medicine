// Offline historical comparisons only; never changes clinical review decisions.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/cranial-boundary-clinical-pins.json' with {type:'json'};
import after from '../content/cranial-boundary-clinical.transition.json' with {type:'json'};
export function authoringBeforeCranialBoundaryClinical({api,catalog},{deferWholeSnapshot=false}={}){
 assert.equal(hash(pins),'17c346a550a98c169becc90dfccbb407578ca854e23e8c09931b518f7daf7925');
 assert.equal(hash(after),'1174caef7325ebe20b930e11f807dfce3c933355f2f47372576d03dd76b18d98');
 assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const display=api.bodyDisplayCatalog(catalog),prior=new Map();
 for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(display[key],pins[key]);
 for(const b of pins.bundles)assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);
 let oldCount=0,newCount=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.equal(after.entries[i].id,e.identity.id);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(lesson,e.previous[t]))oldCount++;else{assert.equal(hash(lesson),after.entries[i].sections[t],'Unrecorded cranial boundary change');newCount++;}prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});}
 }
 assert(oldCount===prior.size||newCount===prior.size,'Mixed cranial boundary history state');if(oldCount===prior.size)return api;
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'cranial boundary baseline mismatch');return historical;
}
