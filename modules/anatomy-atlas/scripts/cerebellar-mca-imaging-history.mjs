// Exact test-only editorial replay; not learner content or an approval API.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/cerebellar-mca-imaging-pins.json' with {type:'json'};
import transition from '../content/cerebellar-mca-imaging-transition.json' with {type:'json'};
import {hash,snapshot} from './pin-cerebellar-mca-imaging.mjs';
export function beforeCerebellarMcaImaging(api,display){
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>e.topics.every(t=>api.bodyLesson(e.identity,t)===undefined)))return api;
 assert.equal(hash(pins),'829a111dcd6bb74dfcffe9fb1da5119c7988d002b84f3896b944022443235386');
 assert.equal(hash(transition),'54aaf459003143bf0f1e1e31a36bf8978e6322b3789656617a7abe534a54d82d');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,10);assert.equal(transition.entries.length,10);
 let old=0,current=0;const previous=new Map();
 for(const e of pins.entries)for(const t of e.topics){
  const key=e.identity.id+'|'+t,row=rows.get(key);assert(row);assert.equal(row.previousHash,hash(e.previous[t]));
  const now=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(now,e.previous[t]))old++;
  else{assert.equal(hash(now),row.currentHash,'Unrecorded cerebellar/MCA imaging change');current++;}
  previous.set(key,{identity:e.identity,lesson:e.previous[t]});
 }
 assert(old===10||current===10,'Mixed cerebellar/MCA imaging history');if(old===10)return api;
 if(display)assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash,'Unrecorded complete teaching snapshot');
 const matches=(s,t)=>isDeepStrictEqual(s,previous.get(s.id+'|'+t)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id+'|'+t).lesson):api.bodyLesson(s,t);
 const restored={...api,bodyLesson,cerebellarMcaImagingLesson(s,t){return matches(s,t)?undefined:api.cerebellarMcaImagingLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 if(display)assert.equal(hash(snapshot(restored,display)),pins.previousAllLessonsAndRecipesHash,'Cerebellar/MCA baseline mismatch');
 return restored;
}
