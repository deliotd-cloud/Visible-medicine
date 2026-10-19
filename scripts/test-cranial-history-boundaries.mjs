// Source-identity and cached-surface regressions, using the real live API.
import assert from 'node:assert/strict';
import transition from '../content/celiac-display-transition.json' with {type:'json'};
import {postFootHistoryContext} from './post-foot-history-context.mjs';
import {cranialHistoryContext,shortCiliaryHistoryContext} from './cranial-history-context.mjs';
import {hash,snapshot} from './pin-pica-clinical.mjs';

const {api:loaded,catalog}=await postFootHistoryContext();
const api={...loaded},before=hash(snapshot(api,api.bodyDisplayCatalog(catalog)));
const originalLesson=api.bodyLesson;
let lessonCalls=0;
api.bodyLesson=(...args)=>{lessonCalls++;return originalLesson(...args);};
const delegatedLesson=api.bodyLesson;
const historical=cranialHistoryContext(api,catalog);
const short=shortCiliaryHistoryContext(api,catalog);
const exact=structuredClone(transition.original);
let identityRefusals=0;
for(const [name,value]of [['cranial',historical],['short-ciliary',short]]){
 assert.deepEqual(value.bodyDisplayCatalog(catalog).structures.filter(s=>s.id===exact.id),[exact],name);
 for(const tab of ['xray','quiz']){
  const lesson=value.bodyLesson(exact,tab);
  assert(lesson&&typeof lesson==='object');
  const{readiness:_,...shown}=lesson;
  assert.deepEqual(value.bodyContent(exact,tab),shown);
  lesson.body='foreign';assert.notEqual(value.bodyLesson(exact,tab).body,'foreign');
  for(const alter of [
   s=>{s.bundle='foreign';},s=>{s.region='thorax';},
   s=>{s.sources[0].sha256='0'.repeat(64);},s=>{s.sources.reverse();},
   s=>{delete s.sources;},s=>{delete s.bundle;},s=>{s.provenance.recovered=false;},
  ]){
   const bad=structuredClone(exact);alter(bad);
   assert.throws(()=>value.bodyLesson(bad,tab),/Exact recovered celiac source identity required/);identityRefusals++;
   assert.throws(()=>value.bodyContent(bad,tab),/Exact recovered celiac source identity required/);identityRefusals++;
  }
  assert.throws(()=>value.bodyLesson(transition.replacement,tab),/Exact recovered celiac source identity required/);identityRefusals++;
  assert.throws(()=>value.bodyContent(transition.replacement,tab),/Exact recovered celiac source identity required/);identityRefusals++;
 }
}
assert.equal(identityRefusals,64);
const oldSource=transition.replacement.sources[0].sha256;
try{
 transition.replacement.sources[0].sha256='0'.repeat(64);
 for(const value of [short,historical])assert.throws(()=>value.bodyLesson(exact,'xray'),/Celiac display transition changed/);
}finally{transition.replacement.sources[0].sha256=oldSource;}
assert.equal(cranialHistoryContext(historical,catalog),historical);

const delegated=catalog.structures.find(s=>s.id==='vm:anatomy:body:head-neck:midline:bone:hyoid-bone');assert(delegated);
lessonCalls=0;historical.bodyLesson(delegated,'anatomy');
assert(lessonCalls>0,'This cell must really call the captured original input lesson');
let cachedRefusals=0;
function refuses(change,restore,pattern){
 try{change();assert.throws(()=>cranialHistoryContext(historical,catalog),pattern);cachedRefusals++;}
 finally{restore();}
 assert.equal(cranialHistoryContext(historical,catalog),historical,'Exact restoration must remain repeatable');
}
refuses(()=>{api.bodyLesson=()=>({body:'foreign'});},()=>{api.bodyLesson=delegatedLesson;},/Cached historical input API method\/data bodyLesson changed/);
const originalContent=api.bodyContent;
refuses(()=>{api.bodyContent=()=>({body:'foreign'});},()=>{api.bodyContent=originalContent;},/Cached historical input API method\/data bodyContent changed/);
refuses(()=>{api.bodyLesson=(...args)=>originalLesson(...args);},()=>{api.bodyLesson=delegatedLesson;},/Cached historical input API method\/data bodyLesson changed/);
const outputLesson=historical.bodyLesson;
refuses(()=>{historical.bodyLesson=()=>({body:'foreign'});},()=>{historical.bodyLesson=outputLesson;},/Cached historical output API method\/data bodyLesson changed/);
const helper=historical.genicularUltrasoundLesson;
refuses(()=>{historical.genicularUltrasoundLesson=()=>({body:'foreign'});},()=>{historical.genicularUltrasoundLesson=helper;},/Cached historical output API method\/data genicularUltrasoundLesson changed/);
const name=catalog.structures[0].name;
refuses(()=>{catalog.structures[0].name='foreign';},()=>{catalog.structures[0].name=name;},/Cached historical catalog data changed/);
const reference=historical.dissectionProfiles.thorax.references[0];
refuses(()=>{historical.dissectionProfiles.thorax.references[0]='foreign';},()=>{historical.dissectionProfiles.thorax.references[0]=reference;},/Cached historical (?:input|output) API method\/data dissectionProfiles changed/);
const prototype=Object.getPrototypeOf(historical);
refuses(()=>{Object.setPrototypeOf(historical,{});},()=>{Object.setPrototypeOf(historical,prototype);},/Cached historical output API prototype changed/);
refuses(()=>{historical.foreign=true;},()=>{delete historical.foreign;},/Cached historical output API keys changed/);
const descriptor=Object.getOwnPropertyDescriptor(historical,'bodyLesson');
refuses(()=>{Object.defineProperty(historical,'bodyLesson',{...descriptor,enumerable:!descriptor.enumerable});},()=>{Object.defineProperty(historical,'bodyLesson',descriptor);},/Cached historical output API descriptor bodyLesson changed/);
assert.equal(cachedRefusals,10);
assert.equal(hash(snapshot(api,api.bodyDisplayCatalog(catalog))),before,'Live teaching/catalogue/recipes/shoulder data must remain unchanged');
console.log(JSON.stringify({sharedPaths:2,exactCellsPerPath:2,identityRefusals,alteredSourceRefusals:2,cachedRefusals,
 capturedOriginalLessonDelegation:'observed',originalContentDelegation:'not asserted',restoredRepeat:true,liveTeachingUnchanged:true}));
