// Offline historical comparison only; not a runtime teaching or review API.
import assert from 'node:assert/strict';
import {authoringBeforeThyroidImaging} from './thyroid-imaging-history.mjs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/neck-teaching-pins.json' with {type:'json'};
import after from '../content/neck-teaching.transition.json' with {type:'json'};
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const snapshot=(api,c)=>({body:c.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
export function authoringBeforeNeckTeaching({api,catalog},{deferWholeSnapshot=false}={}){
 api=authoringBeforeThyroidImaging({api,catalog},{deferWholeSnapshot:true});
 assert.equal(hash(pins),'4c33e515e1accdc900a435d3f8975db82c810951cf109436065b9f186374896a');
 assert.equal(hash(after),'d57d1c630ae57b203515062c78e67b4576d1cdf87d7e5e08b394fed5f2c6da9f');
 assert.equal(after.parentCommit,pins.sourceCommit);assert.equal(after.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const display=api.bodyDisplayCatalog(catalog),prior=new Map();
 for(const key of ['sourceVersion','license','coordinateSystem'])assert.deepEqual(display[key],pins[key]);
 for(const b of pins.bundles)assert.deepEqual(display.bundles.find(v=>v.id===b.id),b);
 let oldCount=0,newCount=0;
 for(const [i,e] of pins.entries.entries()){
  assert.equal(display.structures.filter(s=>s.id===e.identity.id).length,1);assert.deepEqual(display.structures.find(s=>s.id===e.identity.id),e.identity);assert.equal(after.entries[i].id,e.identity.id);
  for(const t of e.topics){const lesson=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(lesson,e.previous[t]))oldCount++;else{assert.equal(hash(lesson),after.entries[i].sections[t],'Unrecorded neck teaching change');newCount++;}prior.set(e.identity.id+'|'+t,{identity:e.identity,lesson:e.previous[t]});}
 }
 assert(oldCount===prior.size||newCount===prior.size,'Mixed neck teaching history state');if(oldCount===prior.size)return api;
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(api,display)),after.currentAllLessonsAndRecipesHash,'Current full teaching/recipe snapshot changed');
 const bodyLesson=(s,t)=>{const e=prior.get(s.id+'|'+t);return e&&isDeepStrictEqual(s,e.identity)?structuredClone(e.lesson):api.bodyLesson(s,t);};
 const historical={...api,bodyLesson,bodyContent(s,t){const {readiness:_readiness,...content}=bodyLesson(s,t);return content;}};
 if(!deferWholeSnapshot)assert.equal(hash(snapshot(historical,display)),pins.previousAllLessonsAndRecipesHash,'neck teaching baseline mismatch');return historical;
}
