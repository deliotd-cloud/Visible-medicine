// Exact test-only editorial replay; never a learner or clinical approval API.
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import pins from '../content/tentorium-imaging-pins.json' with {type:'json'};
import transition from '../content/tentorium-imaging-transition.json' with {type:'json'};
import {hash,snapshot} from './pin-tentorium-imaging.mjs';
export function beforeTentoriumImaging(api,display){
 if(typeof api.bodyLesson!=='function')return api;
 if(typeof api.bodyDisplayCatalog!=='function'&&pins.entries.every(e=>e.topics.every(t=>api.bodyLesson(e.identity,t)===undefined)))return api;
 assert.equal(hash(pins),'47d878a56e0e7643ca3f45ce6ce2e1d67f4554b275604d401f670ba777a248ff');
 assert.equal(hash(transition),'e625cfceb507042600f1111b34ab9f5faba10b612e203c89ef50f940cd2a804e');
 assert.equal(transition.pinsHash,hash(pins));assert.equal(transition.parentCommit,pins.parentCommit);
 assert.equal(transition.previousAllLessonsAndRecipesHash,pins.previousAllLessonsAndRecipesHash);
 const rows=new Map(transition.entries.map(r=>[r.id+'|'+r.tab,r]));assert.equal(rows.size,2);assert.equal(transition.entries.length,2);
 let old=0,current=0;const previous=new Map();
 for(const e of pins.entries)for(const t of e.topics){
  const key=e.identity.id+'|'+t,row=rows.get(key);assert(row);assert.equal(row.previousHash,hash(e.previous[t]));
  const now=api.bodyLesson(e.identity,t);if(isDeepStrictEqual(now,e.previous[t]))old++;
  else{assert.equal(hash(now),row.currentHash,'Unrecorded tentorium imaging change');current++;}
  previous.set(key,{identity:e.identity,lesson:e.previous[t]});
 }
 assert(old===2||current===2,'Mixed tentorium imaging history');if(old===2)return api;
 if(display)assert.equal(hash(snapshot(api,display)),transition.currentAllLessonsAndRecipesHash,'Unrecorded complete teaching snapshot');
 const matches=(s,t)=>isDeepStrictEqual(s,previous.get(s.id+'|'+t)?.identity);
 const bodyLesson=(s,t)=>matches(s,t)?structuredClone(previous.get(s.id+'|'+t).lesson):api.bodyLesson(s,t);
 const restored={...api,bodyLesson,tentoriumImagingLesson(s,t){return matches(s,t)?undefined:api.tentoriumImagingLesson?.(s,t);},bodyContent(s,t){const {readiness:_r,...shown}=bodyLesson(s,t);return shown;}};
 if(display)assert.equal(hash(snapshot(restored,display)),pins.previousAllLessonsAndRecipesHash,'Tentorium baseline mismatch');
 return restored;
}
