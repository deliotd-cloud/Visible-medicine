// Offline historical comparisons only; never changes clinical review decisions.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/major-bone-imaging-pins.json' with {type:'json'};
import after from '../content/major-bone-imaging.transition.json' with {type:'json'};
import {authoringBeforeConnectiveImaging} from './connective-imaging-history.mjs';
export function authoringBeforeMajorBoneImaging({api,catalog},{deferWholeSnapshot=false}={}){
 api=authoringBeforeConnectiveImaging({api,catalog},{deferWholeSnapshot:true});
 assert.equal(hash(pins),'680ee6a38b743979f94da78b9d65d7fc9f271366b06a1ec34032168c1a6a40d3');
 assert.equal(hash(after),'073cc2147c8447a0f9c9450b46bb5cae69f1b4c8ff49e52eabcbce96f475c00a');
 assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const display=api.bodyDisplayCatalog(catalog),prior=new Map();
 for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(display[key],pins[key]);
 for(const b of pins.bundles)assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);
 let oldCount=0,newCount=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.equal(after.entries[i].id,e.identity.id);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(lesson,e.previous[t]))oldCount++;else{assert.equal(hash(lesson),after.entries[i].sections[t],'Unrecorded major bone imaging change');newCount++;}prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});}
 }
 assert(oldCount===prior.size||newCount===prior.size,'Mixed major bone imaging history state');if(oldCount===prior.size){if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),pins.previousAllLessonsAndRecipesHash,'Prior full teaching/recipe snapshot changed');return api;}
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'major bone imaging baseline mismatch');return historical;
}
