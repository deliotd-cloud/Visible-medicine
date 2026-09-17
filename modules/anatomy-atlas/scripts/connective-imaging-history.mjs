// Offline historical comparisons only; never changes clinical review decisions.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/connective-imaging-pins.json' with {type:'json'};
import after from '../content/connective-imaging.transition.json' with {type:'json'};
import {preShortCiliaryAuthoring} from './short-ciliary-history.mjs';
export function authoringBeforeConnectiveImaging({api,catalog},{deferWholeSnapshot=false}={}){
 api=preShortCiliaryAuthoring(api,catalog);
 assert.equal(hash(pins),'65a5da7d1e1169ebc017e44fd5546f583d6698b35438421ddce1c5cf60548665');
 assert.equal(hash(after),'6744477577b004662be55935f25a36d6fd67ad36f4117c0fc84b9c8a5284c07d');
 assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const display=api.bodyDisplayCatalog(catalog),prior=new Map();
 for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(display[key],pins[key]);
 for(const b of pins.bundles)assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);
 let oldCount=0,newCount=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.equal(after.entries[i].id,e.identity.id);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(lesson,e.previous[t]))oldCount++;else{assert.equal(hash(lesson),after.entries[i].sections[t],'Unrecorded connective imaging change');newCount++;}prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});}
 }
 assert(oldCount===prior.size||newCount===prior.size,'Mixed connective imaging history state');if(oldCount===prior.size){if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),pins.previousAllLessonsAndRecipesHash,'Prior full teaching/recipe snapshot changed');return api;}
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'connective imaging baseline mismatch');return historical;
}
