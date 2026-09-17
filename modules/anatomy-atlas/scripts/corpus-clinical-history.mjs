// Offline historical comparison only; never imported by viewer/review APIs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {authoringBeforeLaryngealMuscleTeaching} from './laryngeal-muscle-teaching-history.mjs';
import pins from '../content/corpus-clinical-pins.json' with {type:'json'};
import after from '../content/corpus-clinical.transition.json' with {type:'json'};

export const corpusClinicalHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});

/** Remove only the newest corpus-spongiosum clinical and fallback-copy edits. */
export function authoringBeforeCorpusClinical({api,catalog},{deferWholeSnapshot=false}={}){
  api=authoringBeforeLaryngealMuscleTeaching({api,catalog},{deferWholeSnapshot:true});
  const hash=corpusClinicalHash;
  assert.equal(hash(pins),'1a371a56b2c6b619c12977cdb374fbbe66bf252346c2e75c93bb9fb174b883d1');
  assert.equal(hash(after),'67507c9c7f9d97f3e09b4c43784a4b6cf5a3a018cf46269940e9a9ceed99a263');
  assert.equal(pins.sourceCommit,'c1fa092997ba87e71f082af393aa8944e4e9afdb');assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  let beforeCount=0,afterCount=0;
  for(const [index,entry] of pins.entries.entries()){
    assert.equal(display.structures.filter(s=>s.id===entry.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity);assert.equal(after.entries[index].id,entry.identity.id);
    for(const topic of entry.topics){const current=api.bodyLesson(entry.identity,topic),previous=entry.previous[topic];if(isDeepStrictEqual(current,previous))beforeCount++;else{assert.equal(hash(current),after.entries[index].sections[topic],'Unrecorded corpus clinical change');afterCount++;}prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:previous});}
  }
  assert(beforeCount===prior.size||afterCount===prior.size,'Mixed corpus clinical history state');if(beforeCount===prior.size)return api;
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry||!isDeepStrictEqual(s,entry.identity))return api.bodyLesson(s,t);return structuredClone(entry.lesson);};
  const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'Corpus clinical adapter did not reconstruct exact baseline');return historical;
}
