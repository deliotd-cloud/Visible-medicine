import assert from 'node:assert/strict';
import pins from '../content/hyoid-epiglottis-ultrasound-pins.json' with {type:'json'};
import transition from '../content/hyoid-epiglottis-ultrasound.transition.json' with {type:'json'};
import {contentContext} from './content-contract-tools.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';
import {beforeHyoidEpiglottisUltrasound,authoringBeforeHyoidEpiglottisUltrasound as history} from './hyoid-epiglottis-ultrasound-history.mjs';
const {api,catalog}=await contentContext(),prior=history({api,catalog});
const apiOnly=beforeHyoidEpiglottisUltrasound(api);
assert.deepEqual(apiOnly.bodyLesson(pins.entries[0].identity,'ultrasound'),prior.bodyLesson(pins.entries[0].identity,'ultrasound'));
assert.equal(beforeHyoidEpiglottisUltrasound(apiOnly),apiOnly);
for(const e of pins.entries){
 assert.deepEqual(prior.bodyLesson(e.identity,'ultrasound'),e.previous);const lesson=prior.bodyLesson(e.identity,'ultrasound');lesson.body+=' foreign';assert.deepEqual(prior.bodyLesson(e.identity,'ultrasound'),e.previous);
 assert.deepEqual(apiOnly.bodyLesson(e.identity,'ultrasound'),e.previous);
 assert.deepEqual(apiOnly.bodyContent(e.identity,'ultrasound'),prior.bodyContent(e.identity,'ultrasound'));
 assert.deepEqual(prior.bodyLesson(e.identity,'ct'),api.bodyLesson(e.identity,'ct'));
 for(const mutate of [
  s=>{s.sources[0].sha256='foreign';},
  ...(e.identity.sources.length>1?[s=>{s.sources.reverse();}]:[]),
  s=>{s.sources.push({file:'foreign',sha256:'foreign'});},
  s=>{s.sources.pop();},
  s=>{s.bounds.min[0]+=1;},
 ]){
  const foreign=structuredClone(e.identity);mutate(foreign);
  assert.throws(()=>prior.bodyLesson(foreign,'ultrasound'),/exact source identity/);
  assert.throws(()=>apiOnly.bodyLesson(foreign,'ultrasound'),/exact source identity/);
 }
}
assert.equal(history({api:prior,catalog}),prior);
const first=pins.entries[0],partial={...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='ultrasound'?structuredClone(first.previous):api.bodyLesson(s,t);}};
partial.bodyContent=(s,t)=>{const {readiness,...shown}=partial.bodyLesson(s,t);return shown;};
assert.throws(()=>history({api:partial,catalog}),/Mixed ultrasound history/);
assert.throws(()=>beforeHyoidEpiglottisUltrasound(partial),/Mixed ultrasound history/);
assert.throws(()=>history({api:{...api,hyoidEpiglottisUltrasoundLesson(){return{readiness:'draft',body:'foreign'};}},catalog}),/Unrecorded ultrasound draft/);
assert.throws(()=>beforeHyoidEpiglottisUltrasound({...api,hyoidEpiglottisUltrasoundLesson(){return{readiness:'draft',body:'foreign'};}}),/Unrecorded ultrasound draft/);
assert.throws(()=>beforeHyoidEpiglottisUltrasound({...api,hyoidEpiglottisUltrasoundLesson:undefined}),/Missing ultrasound draft helper/);
assert.throws(()=>beforeHyoidEpiglottisUltrasound({...api,bodyLesson(s,t){const value=api.bodyLesson(s,t);return s.id===first.identity.id&&t==='ultrasound'?{...value,body:'foreign'}:value;}}),/Unrecorded ultrasound history/);
assert.throws(()=>beforeHyoidEpiglottisUltrasound({...api,bodyContent(s,t){const value=api.bodyContent(s,t);return s.id===first.identity.id&&t==='ultrasound'?{...value,body:'foreign'}:value;}}),/Unrecorded ultrasound body content/);
const foreignCatalog=structuredClone(catalog);foreignCatalog.structures.find(s=>s.id===first.identity.id).sources[0].sha256='foreign';assert.throws(()=>history({api,catalog:foreignCatalog}),/Unrecorded ultrasound source identity/);
const unrelated=catalog.structures.find(s=>!pins.entries.some(e=>e.identity.id===s.id));
const foreignOther={...api,bodyLesson(s,t){const lesson=api.bodyLesson(s,t);return s.id===unrelated.id&&t==='ultrasound'?{...lesson,body:'Unrelated lesson retained'}:lesson;}};
assert.equal(beforeHyoidEpiglottisUltrasound(foreignOther).bodyLesson(unrelated,'ultrasound').body,'Unrelated lesson retained');
const historical=await exactSourceHistoryApi(pins.baseline,'display-review');
assert.equal(typeof historical.hyoidEpiglottisUltrasoundLesson,'undefined');
for(const e of pins.entries)assert.deepEqual(historical.bodyLesson(e.identity,'ultrasound'),e.previous);
assert.equal(beforeHyoidEpiglottisUltrasound(historical),historical);
assert.equal(history({api:historical,catalog}),historical);
const synthetic={bodyLesson(){return undefined;}};
assert.equal(beforeHyoidEpiglottisUltrasound(synthetic),synthetic);
assert.throws(()=>beforeHyoidEpiglottisUltrasound({...historical,bodyLesson(s,t){const lesson=historical.bodyLesson(s,t);return s.id===first.identity.id&&t==='ultrasound'?{...lesson,body:'foreign'}:lesson;}}),/Unrecorded ultrasound history/);
const reason=transition.reason;transition.reason+=' foreign';try{assert.throws(()=>history({api,catalog}));}finally{transition.reason=reason;}
const baseline=pins.baseline;pins.baseline='foreign';try{assert.throws(()=>history({api,catalog}));}finally{pins.baseline=baseline;}
console.log(JSON.stringify({previousLessonsReconstructed:2,apiOnlyReplay:true,actualBaselineWithoutHelper:true,mixedHistoryAndForeignSourcesRefused:true,tamperedRecordsRefused:true}));
