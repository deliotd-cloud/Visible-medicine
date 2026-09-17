// Offline historical comparison only; never imported by viewer/review APIs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/core-organ-function-pins.json' with {type:'json'};
import after from '../content/core-organ-function.transition.json' with {type:'json'};
import {authoringBeforeMajorOrganFunction} from './major-organ-function-history.mjs';

export const coreOrganFunctionHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});

/** Remove only the newest four Function edits before any older history gate runs. */
export function authoringBeforeCoreOrganFunction({api,catalog}, {deferWholeSnapshot=false}={}) {
  api=authoringBeforeMajorOrganFunction({api,catalog},{deferWholeSnapshot:true});
  const hash=coreOrganFunctionHash;
  assert.equal(hash(pins),'66564d9164195b95f4f9e7f867b4e57e85b9bc6cd8561928e2814470100efdac');
  assert.equal(hash(after),'f37f48023a4d24f81f53aa3f5abaa8ac0059b0f29984d15a5641a6da0b0fed76');
  assert.equal(pins.sourceCommit,'ba49021ee7969d861ea01df4cbce6e650a6f05e6');
  assert.equal(after.parentCommit,pins.sourceCommit);
  assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();
  assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);
  assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  let beforeCount=0,afterCount=0;
  for(const [index,entry] of pins.entries.entries()){
    assert.equal(display.structures.filter(s=>s.id===entry.identity.id).length,1);
    assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity);
    assert.equal(after.entries[index].id,entry.identity.id);
    for(const topic of entry.topics){
      const current=api.bodyLesson(entry.identity,topic),previous=entry.previous[topic];
      if(isDeepStrictEqual(current,previous))beforeCount++;
      else {assert.equal(hash(current),after.entries[index].sections[topic],'Unrecorded core-organ Function change');afterCount++;}
      prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:previous});
    }
  }
  assert(beforeCount===prior.size||afterCount===prior.size,'Mixed core-organ Function history state');
  if(beforeCount===prior.size)return api;
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry||!isDeepStrictEqual(s,entry.identity))return api.bodyLesson(s,t);return structuredClone(entry.lesson);};
  const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'Core-organ Function adapter did not reconstruct the exact baseline');
  return historical;
}
