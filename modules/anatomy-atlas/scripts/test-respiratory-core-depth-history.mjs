import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {beforeRespiratoryCoreDepth as history} from './respiratory-core-depth-history.mjs';
import pins from '../content/respiratory-core-depth-pins.json' with {type:'json'};
import transition from '../content/respiratory-core-depth.transition.json' with {type:'json'};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const{api,catalog}=await contentContext(),display=api.bodyDisplayCatalog(catalog);
const snapshot=value=>({body:display.structures.map(s=>({id:s.id,sections:Object.fromEntries(api.contentTabs.map(t=>[t,value.bodyLesson(s,t)]))})),shoulder:value.structures,recipes:value.dissectionProfiles});
assert.equal(hash(snapshot(api)),transition.currentAllLessonsAndRecipesHash);
const before=history(api);assert.equal(hash(snapshot(before)),pins.previousAllLessonsAndRecipesHash);assert.equal(history(before),before);
for(const{identity,previous}of pins.entries)for(const tab of Object.keys(previous)){
 assert.deepEqual(before.bodyLesson(identity,tab),previous[tab]);
 const copy=before.bodyLesson(identity,tab);copy.body+=' foreign';if(copy.bullets)copy.bullets.reverse();assert.deepEqual(before.bodyLesson(identity,tab),previous[tab]);
 const foreign=structuredClone(identity);foreign.sources[0].sha256='foreign';assert.throws(()=>before.bodyLesson(foreign,tab),/exact source identity/);
}
const first=pins.entries[0];
const mixed={...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='anatomy'?structuredClone(first.previous.anatomy):api.bodyLesson(s,t);}};
mixed.bodyContent=(s,t)=>{const{readiness:_,...shown}=mixed.bodyLesson(s,t);return shown;};
assert.throws(()=>history(mixed),/mixed teaching state/);
assert.throws(()=>history({...api,bodyLesson(s,t){const v=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='anatomy'?{...v,body:'foreign'}:v;}}),/foreign teaching/);
assert.throws(()=>history({...api,respiratoryCoreDepthLesson(){return {readiness:'draft',body:'foreign helper'};}}),/foreign draft helper/);
assert.throws(()=>history({...api,respiratoryCoreDepthLesson:42}),/invalid draft helper/);
assert.throws(()=>history({...api,bodyContent(s,t){const v=api.bodyContent(s,t);return s.id===first.identity.id&&t==='anatomy'?{...v,body:'foreign display'}:v;}}),/foreign body content/);
assert.equal(hash(snapshot(api)),transition.currentAllLessonsAndRecipesHash);
console.log(JSON.stringify({restoredTopics:8,completeBaselineSnapshotExact:true,mixedForeignAndHelperRefused:true,liveTeachingUnchanged:true}));
