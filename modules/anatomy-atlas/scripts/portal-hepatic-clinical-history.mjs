// Offline historical comparison only; never imported by viewer/review APIs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/portal-hepatic-clinical-pins.json' with {type:'json'};
import after from '../content/portal-hepatic-clinical.transition.json' with {type:'json'};

export const portalHepaticClinicalHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});

/** Remove only the newest eight-source portal/hepatic Clinical/Pathology edits. */
export function authoringBeforePortalHepaticClinical({api,catalog},{deferWholeSnapshot=false}={}){
  const hash=portalHepaticClinicalHash;
  assert.equal(hash(pins),'dca558a370b2765260781d02819375f72ad42628d97372ec5d4704f12c777284');
  assert.equal(hash(after),'3f355dbba7d7f7d72aeed59a03f181aded6e3df0cd74ae601c3797781ce53de6');
  assert.equal(pins.sourceCommit,'b1240f9c9a47ab641ffe0f5297cf99a59c84f7af');
  assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);
  for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  let beforeCount=0,afterCount=0;
  for(const [index,entry] of pins.entries.entries()){
    assert.equal(display.structures.filter(s=>s.id===entry.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity);assert.equal(after.entries[index].id,entry.identity.id);assert.equal(after.entries[index].family,entry.family);
    for(const topic of entry.topics){const current=api.bodyLesson(entry.identity,topic),previous=entry.previous[topic];if(isDeepStrictEqual(current,previous))beforeCount++;else{assert.equal(hash(current),after.entries[index].sections[topic],'Unrecorded portal/hepatic clinical change');afterCount++;}prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:previous});}
  }
  assert(beforeCount===prior.size||afterCount===prior.size,'Mixed portal/hepatic clinical history state');if(beforeCount===prior.size)return api;
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry||!isDeepStrictEqual(s,entry.identity))return api.bodyLesson(s,t);return structuredClone(entry.lesson);};
  const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
  if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'Portal/hepatic clinical adapter did not reconstruct exact baseline');return historical;
}
