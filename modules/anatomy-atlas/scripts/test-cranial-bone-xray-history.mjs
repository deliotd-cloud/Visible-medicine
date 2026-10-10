import assert from 'node:assert/strict';
import pins from '../content/cranial-bone-xray-pins.json' with {type:'json'};
import transition from '../content/cranial-bone-xray.transition.json' with {type:'json'};
import {contentContext} from './content-contract-tools.mjs';
import {authoringBeforeCranialBoneXray as history} from './cranial-bone-xray-history.mjs';
const {api,catalog}=await contentContext(),prior=history({api,catalog});
for(const e of pins.entries){
 assert.deepEqual(prior.bodyLesson(e.identity,'xray'),e.previous);const lesson=prior.bodyLesson(e.identity,'xray');lesson.body+=' foreign';assert.deepEqual(prior.bodyLesson(e.identity,'xray'),e.previous);
 assert.deepEqual(prior.bodyLesson(e.identity,'ct'),api.bodyLesson(e.identity,'ct'));
 const foreign=structuredClone(e.identity);foreign.sources[0].sha256='foreign';assert.throws(()=>prior.bodyLesson(foreign,'xray'),/exact source identity/);
}
assert.equal(history({api:prior,catalog}),prior);
const first=pins.entries[0],partial={...api,bodyLesson(s,t){return s.id===first.identity.id&&t==='xray'?structuredClone(first.previous):api.bodyLesson(s,t);}};
partial.bodyContent=(s,t)=>{const {readiness,...shown}=partial.bodyLesson(s,t);return shown;};
assert.throws(()=>history({api:partial,catalog}),/Mixed xray history/);
assert.throws(()=>history({api:{...api,cranialBoneXrayLesson(){return{readiness:'draft',body:'foreign'};}},catalog}),/Unrecorded xray draft/);
const foreignCatalog=structuredClone(catalog);foreignCatalog.structures.find(s=>s.id===first.identity.id).sources[0].sha256='foreign';assert.throws(()=>history({api,catalog:foreignCatalog}),/Unrecorded xray source identity/);
const reason=transition.reason;transition.reason+=' foreign';try{assert.throws(()=>history({api,catalog}));}finally{transition.reason=reason;}
const baseline=pins.baseline;pins.baseline='foreign';try{assert.throws(()=>history({api,catalog}));}finally{pins.baseline=baseline;}
console.log(JSON.stringify({previousLessonsReconstructed:8,mixedHistoryAndForeignSourcesRefused:true,tamperedRecordsRefused:true}));
