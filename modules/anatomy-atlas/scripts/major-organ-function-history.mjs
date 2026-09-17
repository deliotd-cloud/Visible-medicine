// Offline historical comparison only; never imported by viewer/review APIs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/major-organ-function-pins.json' with {type:'json'};
import after from '../content/major-organ-function.transition.json' with {type:'json'};
import {authoringBeforeCorpusClinical} from './corpus-clinical-history.mjs';

export const majorOrganFunctionHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});

/** Remove only the newest thirteen Function edits before older history gates run. */
export function authoringBeforeMajorOrganFunction({api,catalog},{deferWholeSnapshot=false}={}) {
  api=authoringBeforeCorpusClinical({api,catalog},{deferWholeSnapshot:true});
  const hash=majorOrganFunctionHash;
  assert.equal(hash(pins),'655f7f276e3a5dac43811378ffc8036380ac91420a54d01c78c5fa2b26ee208a');
  assert.equal(hash(after),'3635c886868ee3eeeea1d7f4f167737cb03cbeb2a16c4884b2afbe6a25546726');
  assert.equal(pins.sourceCommit,'f5e08f2f4bc465fb90d0a51d19f0ccc6e31b81b9');assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  let beforeCount=0,afterCount=0;
  for(const [index,entry] of pins.entries.entries()){
    assert.equal(display.structures.filter(s=>s.id===entry.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity);assert.equal(after.entries[index].id,entry.identity.id);
    for(const topic of entry.topics){const current=api.bodyLesson(entry.identity,topic),previous=entry.previous[topic];if(isDeepStrictEqual(current,previous))beforeCount++;else{assert.equal(hash(current),after.entries[index].sections[topic],'Unrecorded major-organ Function change');afterCount++;}prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:previous});}
  }
  assert(beforeCount===prior.size||afterCount===prior.size,'Mixed major-organ Function history state');if(beforeCount===prior.size)return api;
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry||!isDeepStrictEqual(s,entry.identity))return api.bodyLesson(s,t);return structuredClone(entry.lesson);};
  const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'Major-organ Function adapter did not reconstruct exact baseline');return historical;
}
