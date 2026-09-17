// Offline historical comparison only; never imported by viewer/review APIs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/deep-venous-clinical-pins.json' with {type:'json'};
import after from '../content/deep-venous-clinical.transition.json' with {type:'json'};

export const deepVenousClinicalHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});

/** Remove only the newest six-source Clinical/Pathology edits. */
export function authoringBeforeDeepVenousClinical({api,catalog},{deferWholeSnapshot=false}={}){
  const hash=deepVenousClinicalHash;
  assert.equal(hash(pins),'5a997240d78cedaaba69b47115cba04e30c7daf372041d2f233609f647682aa4');
  assert.equal(hash(after),'81e26d74a2e5b95bd82ef3ada29c9bcbe65106144bc8bc32ecce56590babb62e');
  assert.equal(pins.sourceCommit,'98ce21947d5987ba73e7c1fc21c1cf72fa5de669');
  assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  let beforeCount=0,afterCount=0;
  for(const [index,entry] of pins.entries.entries()){
    assert.equal(display.structures.filter(s=>s.id===entry.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity);assert.equal(after.entries[index].id,entry.identity.id);assert.equal(after.entries[index].family,entry.family);
    for(const topic of entry.topics){const current=api.bodyLesson(entry.identity,topic),previous=entry.previous[topic];if(isDeepStrictEqual(current,previous))beforeCount++;else{assert.equal(hash(current),after.entries[index].sections[topic],'Unrecorded deep-venous clinical change');afterCount++;}prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:previous});}
  }
  assert(beforeCount===prior.size||afterCount===prior.size,'Mixed deep-venous clinical history state');if(beforeCount===prior.size)return api;
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry||!isDeepStrictEqual(s,entry.identity))return api.bodyLesson(s,t);return structuredClone(entry.lesson);};
  const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'Deep-venous clinical adapter did not reconstruct exact baseline');return historical;
}
