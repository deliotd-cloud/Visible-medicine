// Offline regression only: no clinical content, source pin or review migration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contentContext} from './content-contract-tools.mjs';
import {beforeRespiratoryCoreDepth} from './respiratory-core-depth-history.mjs';
import {authoringBeforeThoracoabdominalOrganImaging} from './thoracoabdominal-organ-imaging-history.mjs';
import {authoringBeforeMainBronchusExternalUltrasound} from './main-bronchus-external-ultrasound-history.mjs';
import {authoringBeforeCentralVesselImaging} from './central-vessel-imaging-history.mjs';
import pins from '../content/thoracoabdominal-organ-imaging-pins.json' with {type:'json'};
import respiratory from '../content/respiratory-core-depth-pins.json' with {type:'json'};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(hash(pins),'9d46c99c354a9188aab72a21a5d011f95c638cdb86f41457e9068e58c0cdd252');
const context=await contentContext();
const prior=authoringBeforeThoracoabdominalOrganImaging(context);
const base=authoringBeforeCentralVesselImaging(authoringBeforeMainBronchusExternalUltrasound(context));
const display=base.bodyDisplayCatalog(context.catalog);
const slots=new Map(pins.entries.flatMap(e=>e.topics.map(t=>[e.identity.id+'|'+t,e])));
let changed=0,unrelatedExact=0;
for(const s of display.structures)for(const tab of context.api.contentTabs){
 const e=slots.get(s.id+'|'+tab);
 if(e){assert.deepEqual(prior.bodyLesson(s,tab),e.previous[tab]);assert.notDeepEqual(prior.bodyLesson(s,tab),base.bodyLesson(s,tab));changed++;}
 else{assert.deepEqual(prior.bodyLesson(s,tab),base.bodyLesson(s,tab));unrelatedExact++;}
}
assert.equal(changed,42);assert.equal(unrelatedExact,9876);
for(const e of pins.entries)assert.deepEqual(prior.bodyLesson(e.identity,'anatomy'),e.anatomy);
for(const e of respiratory.entries)for(const tab of Object.keys(e.previous))
 assert.deepEqual(prior.bodyLesson(e.identity,tab),base.bodyLesson(e.identity,tab),'Existing history projection must not change');
const comparison=beforeRespiratoryCoreDepth(context.api,context.catalog);
const displayComparison=beforeRespiratoryCoreDepth(context.api,context.api.bodyDisplayCatalog(context.catalog));
for(const e of pins.entries)assert.deepEqual(displayComparison.bodyLesson(e.identity,'anatomy'),comparison.bodyLesson(e.identity,'anatomy'));
assert.throws(()=>beforeRespiratoryCoreDepth({...context.api,bodyLesson:undefined},context.catalog),/missing bodyLesson/);
assert.notEqual(comparison,context.api,'Current pin check must start in the exact authored epoch');
assert.equal(beforeRespiratoryCoreDepth(comparison,context.catalog),comparison);
assert.throws(()=>assert.notEqual(beforeRespiratoryCoreDepth(comparison,context.catalog),comparison,'Current pin check requires exact authored respiratory depth, not stale replay'),/stale replay/);
const first=respiratory.entries[0],id=first.identity.id;
const override=bodyLesson=>({...context.api,bodyLesson,bodyContent(s,t){const{readiness:_,...shown}=bodyLesson(s,t);return shown;}});
assert.throws(()=>beforeRespiratoryCoreDepth(override((s,t)=>s.id===id&&t==='anatomy'?first.previous.anatomy:context.api.bodyLesson(s,t)),context.catalog),/mixed teaching state/);
assert.throws(()=>beforeRespiratoryCoreDepth(override((s,t)=>{const l=context.api.bodyLesson(s,t);return s.id===id&&t==='anatomy'?{...l,body:'foreign'}:l;}),context.catalog),/foreign teaching/);
assert.throws(()=>beforeRespiratoryCoreDepth({...context.api,respiratoryCoreDepthLesson:42},context.catalog),/invalid draft helper/);
assert.throws(()=>beforeRespiratoryCoreDepth({...context.api,respiratoryCoreDepthLesson(){return {readiness:'draft',body:'foreign'};}},context.catalog),/foreign draft helper/);
assert.throws(()=>beforeRespiratoryCoreDepth({...context.api,bodyContent(s,t){const l=context.api.bodyContent(s,t);return s.id===id&&t==='anatomy'?{...l,body:'foreign'}:l;}},context.catalog),/foreign body content/);
for(const mutate of [s=>s.sources[0].sha256='foreign',s=>s.bounds.min[0]+=.01,s=>s.id+='foreign']){
 const damaged=structuredClone(context.api.bodyDisplayCatalog(context.catalog));mutate(damaged.structures.find(s=>s.id===id));
 assert.throws(()=>beforeRespiratoryCoreDepth({...context.api,bodyDisplayCatalog:()=>damaged},context.catalog),/foreign source identity|missing or duplicate source identity/);
}
const foreign=structuredClone(first.identity);foreign.sources[0].sha256='foreign';
assert.throws(()=>comparison.bodyLesson(foreign,'anatomy'),/exact source identity/);
console.log(JSON.stringify({originalImagingRestored:changed,unrelatedBaseTopicsExact:unrelatedExact,rawAndDisplayCatalogAccepted:true,currentAndPriorEpochsDistinguished:true,negativeCases:11,originalPinsRetained:true,clinicalContentChanged:false}));
