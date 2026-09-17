// Offline historical comparisons only; never changes clinical review decisions.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {hash,snapshot} from './pin-pica-clinical.mjs';
import pins from '../content/corpus-imaging-pins.json' with {type:'json'};
import after from '../content/corpus-imaging.transition.json' with {type:'json'};
import clinicalPins from '../content/corpus-clinical-pins.json' with {type:'json'};
import {authoringBeforeMajorBoneImaging} from './major-bone-imaging-history.mjs';
export function authoringBeforeCorpusImaging({api,catalog},{deferWholeSnapshot=false}={}){
 api=authoringBeforeMajorBoneImaging({api,catalog},{deferWholeSnapshot:true});
 assert.equal(hash(pins),'bcc4aeb265a7d0d192c0bfa0c641133de46d0294d90a2e30f22187de682dc5c8');
 assert.equal(hash(after),'7d4e94f6a20a77a2ae414ecfc4314f5a5a7d1b50a28324b6f481da90762e3475');
 assert.equal(hash(clinicalPins),'1a371a56b2c6b619c12977cdb374fbbe66bf252346c2e75c93bb9fb174b883d1');
 assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const display=api.bodyDisplayCatalog(catalog),prior=new Map();
 for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(display[key],pins[key]);
 for(const b of pins.bundles)assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);
 let oldCount=0,newCount=0,predecessorCount=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.equal(after.entries[i].id,e.identity.id);
  const predecessor=clinicalPins.entries.find(p=>p.identity.id===e.identity.id);
  assert(predecessor);assert.deepEqual(predecessor.identity,e.identity);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(lesson,e.previous[t]))oldCount++;else if(isDeepStrictEqual(lesson,predecessor.previous[t]))predecessorCount++;else{assert.equal(hash(lesson),after.entries[i].sections[t],'Unrecorded corpus imaging change');newCount++;}prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});}
 }
 assert(oldCount===prior.size||newCount===prior.size||predecessorCount===prior.size,'Mixed corpus imaging history state');
 // Older history branches re-enter this chain after the clinical adapter has
 // restored its exact six-lesson baseline. Permit only that pinned pair, only
 // under the outer adapter's full-snapshot validation, never generic pending.
 if(predecessorCount===prior.size){assert(deferWholeSnapshot,'Corpus imaging predecessor requires deferred history validation');return api;}
 if(oldCount===prior.size){
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),pins.previousAllLessonsAndRecipesHash,'Prior full teaching/recipe snapshot changed');
  return api;
 }
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'corpus imaging baseline mismatch');return historical;
}
