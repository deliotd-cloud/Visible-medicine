// Offline historical comparison only; never imported by viewer/review APIs.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/genicular-clinical-pins.json' with {type:'json'};
import after from '../content/genicular-clinical.transition.json' with {type:'json'};

export const genicularClinicalHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshot=(api,display)=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
/** Remove only the newest genicular Clinical/Pathology drafts and imaging-copy edits. */
export function authoringBeforeGenicularClinical({api,catalog},{deferWholeSnapshot=false}={}){
  const hash=genicularClinicalHash;assert.equal(hash(pins),'fc4c3f1e0d6fe05502fc54f6e1b041c512187fb40e7c743edddfd6127906071a');assert.equal(hash(after),'00c588678ac0103f4320a4ecadf93a49b08e51edc29ba90f07cf816ddd8f940d');assert.equal(pins.sourceCommit,'52aa75e8711d4663dcd854dd429bbdb65199f981');assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
  const display=api.bodyDisplayCatalog(catalog),prior=new Map();assert.equal(display.sourceVersion,pins.sourceVersion);assert.equal(display.license,pins.license);assert.deepEqual(display.coordinateSystem,pins.coordinateSystem);for(const bundle of pins.bundles)assert.deepEqual(display.bundles.find(candidate=>candidate.id===bundle.id),bundle);
  let beforeCount=0,afterCount=0;for(const [index,entry] of pins.entries.entries()){assert.equal(display.structures.filter(s=>s.id===entry.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===entry.identity.id),entry.identity);assert.equal(after.entries[index].id,entry.identity.id);assert.equal(after.entries[index].family,entry.family);for(const topic of entry.topics){const current=api.bodyLesson(entry.identity,topic),previous=entry.previous[topic];if(isDeepStrictEqual(current,previous))beforeCount++;else{assert.equal(hash(current),after.entries[index].sections[topic],'Unrecorded genicular clinical change');afterCount++;}prior.set(entry.identity.id+'|'+topic,{identity:entry.identity,lesson:previous});}}
  assert(beforeCount===prior.size||afterCount===prior.size,'Mixed genicular clinical history state');if(beforeCount===prior.size)return api;if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
  const bodyLesson=(s,t)=>{const entry=prior.get(s.id+'|'+t);if(!entry||!isDeepStrictEqual(s,entry.identity))return api.bodyLesson(s,t);return structuredClone(entry.lesson);};const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'Genicular clinical adapter did not reconstruct exact baseline');return historical;
}
