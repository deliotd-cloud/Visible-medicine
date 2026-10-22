import {CURRENT_ATLAS_REVISION} from './current-atlas-delivery.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {historicalRegionalLearningReview,historicalRegionalReadinessEvidence,HISTORICAL_REGIONAL_TEACHING} from './regional-learning-readiness-history.mjs';

const bundled=await build({stdin:{contents:`export {buildRegionalMri3dCatalogue} from './lib/regional-mri-3d-catalogue'; export {resolveRegionalLearningReview} from './lib/regional-mri-learning-review'; export {regionalLearningRevision} from './lib/regional-mri-learning';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const {buildRegionalMri3dCatalogue,resolveRegionalLearningReview,regionalLearningRevision}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`) as any;
const clone=<T>(value:T):T=>structuredClone(value);
async function fixture(){
 const catalogue=await buildRegionalMri3dCatalogue({revision:'a'.repeat(64),region:'knee'});
 assert(catalogue?.learning?.entries?.length);
 const entry=catalogue.learning.entries[0];
 const request={target:entry.target.id,relation:entry.target.relation,atlasRevision:catalogue.atlasRevision,
  mappingRevision:catalogue.mappingRevision,teachingRevision:entry.revision};
 return {catalogue,entry,request};
}

test('current public target resolves a detached read-only eight-topic snapshot',async()=>{
 const {catalogue,entry,request}=await fixture();
 const pending=resolveRegionalLearningReview(request,catalogue);
 entry.topics[0].body='Changed after request';request.target='changed after request';
 const result=await pending;assert(result);
 assert.equal(result.entry.topics.length,8);
 assert.notEqual(result.entry.topics[0].body,'Changed after request');
 assert.equal(result.entry.target.id,catalogue.learning.entries[0].target.id);
 assert(Object.isFrozen(result));assert(Object.isFrozen(result.entry));assert(Object.isFrozen(result.entry.topics[0]));
});

test('header, teaching digest and public target mutations are refused',async()=>{
 const original=await fixture();
 const cases:[string,(f:any)=>void][]=[
  ['atlas',f=>{f.request.atlasRevision='0'.repeat(40)}],
  ['mapping',f=>{f.request.mappingRevision='0'.repeat(64)}],
  ['teaching',f=>{f.request.teachingRevision='0'.repeat(64)}],
  ['content',f=>{f.catalogue.learning.entries[0].topics[0].body='Altered'}],
  ['identity',f=>{f.catalogue.learning.entries[0].target.label='Altered'}],
  ['public target',f=>{const t=f.catalogue.entries.flatMap((e:any)=>e.targets).find((t:any)=>t.id===f.request.target&&t.relation===f.request.relation);t.sourceHash='0'.repeat(64)}],
  ['duplicate',f=>{f.catalogue.learning.entries.push(clone(f.catalogue.learning.entries[0]))}],
  ['missing',f=>{f.catalogue.learning.entries=[]}],
 ];
 for(const [name,mutate] of cases){const f=clone(original);mutate(f);assert.equal(await resolveRegionalLearningReview(f.request,f.catalogue),null,name);}
});

test('source authored draft and pending topics keep their distinct readiness',async()=>{
 const {api,catalogue}=await historicalRegionalLearningReview();
 const resolveRegionalLearningReview=api.resolveRegionalLearningReview;
 const first=catalogue.learning.entries[0];
 const f={catalogue,request:{target:first.target.id,relation:first.target.relation,atlasRevision:catalogue.atlasRevision,
  mappingRevision:catalogue.mappingRevision,teachingRevision:first.revision}};
 assert.equal(catalogue.atlasRevision,HISTORICAL_REGIONAL_TEACHING);
 const draft=f.catalogue.learning.entries.find((e:any)=>e.topics.some((t:any)=>t.readiness==='draft'));
 assert(draft);
 const draftRequest={...f.request,target:draft.target.id,relation:draft.target.relation,teachingRevision:draft.revision};
 const snapshot=await resolveRegionalLearningReview(draftRequest,f.catalogue);
 assert(snapshot);assert(snapshot.entry.topics.some((topic:any)=>topic.readiness==='draft'));
 const pending=f.catalogue.learning.entries.find((e:any)=>e.topics.some((t:any)=>t.readiness==='pending'));
 assert(pending);
 const pendingRequest={...f.request,target:pending.target.id,relation:pending.target.relation,teachingRevision:pending.revision};
 const pendingSnapshot=await resolveRegionalLearningReview(pendingRequest,f.catalogue);
 assert(pendingSnapshot);assert(pendingSnapshot.entry.topics.some((topic:any)=>topic.readiness==='pending'));
});

test('historical source closure preserves original counts; current delivery has four specifically completed draft placements',async()=>{
 const {api,catalogue:historical}=await historicalRegionalLearningReview(),current=(await fixture()).catalogue;
 const previous=JSON.parse(readFileSync(new URL('./fixtures/atlas-model-inventory-408759d5.json',import.meta.url),'utf8'));
 assert.equal(previous.sources.find((row:{module:string})=>row.module==='head-neck').sourceCommit,'408759d57644b05402e98a937e7cf6338b5509cf');
 assert.equal(current.atlasRevision,CURRENT_ATLAS_REVISION);
 for(const [catalogue,draft,pending] of [[historical,276,4],[current,280,0]] as const){
  assert.equal(catalogue.learning.entries.length,35);const topics=catalogue.learning.entries.flatMap((e:any)=>e.topics);
  assert.equal(topics.length,280);assert.equal(topics.filter((t:any)=>t.readiness==='draft').length,draft);assert.equal(topics.filter((t:any)=>t.readiness==='pending').length,pending);
 }
 const changed:string[]=[];
 for(const before of historical.learning.entries){
  const after=current.learning.entries.find((e:any)=>e.target.id===before.target.id&&e.target.relation===before.target.relation);assert(after);
  for(const topic of before.topics){const delivered=after.topics.find((t:any)=>t.id===topic.id);assert(delivered);
   if(topic.readiness==='pending'){assert.equal(delivered.readiness,'draft');changed.push(`${before.target.id}|${topic.id}`);}
   else assert.equal(delivered.readiness,topic.readiness);
  }
  const borrowed={target:before.target.id,relation:before.target.relation,atlasRevision:current.atlasRevision,mappingRevision:current.mappingRevision,teachingRevision:before.revision};
  assert.equal(await resolveRegionalLearningReview(borrowed,current),null,'Historical teaching revision cannot label current content');
  assert.equal(await api.resolveRegionalLearningReview(borrowed,historical),null,'Current Atlas/mapping cannot label historical content');
 }
 assert.deepEqual(changed.sort(),[
  'vm:anatomy:body:leg:left:vessel:left-popliteal-artery|xray',
  'vm:anatomy:body:leg:left:vessel:left-popliteal-vein|xray',
  'vm:anatomy:body:leg:right:vessel:right-popliteal-artery|xray',
  'vm:anatomy:body:leg:right:vessel:right-popliteal-vein|xray',
 ].sort());
 const evidence=historicalRegionalReadinessEvidence();assert.equal(evidence.originalCompleteWebsiteOrReleaseReplay,false);
 assert.equal(evidence.bindingOnlyFixtures,4);assert(evidence.sourceInputs.some((f:any)=>f.origin==='immutable-atlas-git'));
 assert(evidence.sourceInputs.filter((f:any)=>f.origin==='immutable-atlas-git').every((f:any)=>f.revision===HISTORICAL_REGIONAL_TEACHING));
});

test('every canonical public target/relation packet resolves without MRI identity or geometry',async()=>{
 const {catalogue,request}=await fixture();const kinds=new Set();
 for(const entry of catalogue.learning.entries){
  const r={...request,target:entry.target.id,relation:entry.target.relation,teachingRevision:entry.revision};
  const snapshot=await resolveRegionalLearningReview(r,catalogue);assert(snapshot,entry.target.id);assert.deepEqual(snapshot.entry,entry);kinds.add(entry.target.kind);
  assert.deepEqual(Object.keys(snapshot).sort(),['atlasRevision','entry','mappingRevision']);
  const text=JSON.stringify(snapshot);for(const field of ['mriRevision','image','annotation','sourceSide','shape_kji','offset_kji','nodeName','href'])assert(!text.includes('"'+field+'"'),field);
 }
 assert.deepEqual(kinds,new Set(['body','specimen']));
});

test('recomputed content integrity cannot substitute another public target identity',async()=>{
 const f=await fixture();
 for(const patch of [{id:'borrowed'},{kind:'specimen'},{label:'Borrowed label'},{side:'right'},{sourceHash:'0'.repeat(64)},{runtimeRevision:'0'.repeat(40)},{runtimeRevision:undefined},{specimenRevision:'0'.repeat(64)},{relation:'same-structure'}]){
  const c=clone(f.catalogue),entry=c.learning.entries[0];if(Object.entries(patch).every(([key,value])=>entry.target[key]===value))continue;
  Object.assign(entry.target,patch);const {revision:_,...content}=entry;
  entry.revision=await regionalLearningRevision(c.atlasRevision,c.mappingRevision,content);
  assert.equal(await resolveRegionalLearningReview({...f.request,teachingRevision:entry.revision},c),null,JSON.stringify(patch));
 }
 for(const patch of [{target:'../private'},{target:['one','two']},{extra:'private'},{teachingRevision:undefined}])assert.equal(await resolveRegionalLearningReview({...f.request,...patch},f.catalogue),null);
});

test('foreign runtime cannot inherit a teaching review after both integrity digests are recomputed',async()=>{
 const {catalogue,request}=await fixture(),entry=catalogue.learning.entries.find((e:any)=>e.target.kind==='specimen');assert(entry);
 const foreign='0'.repeat(40);
 for(const target of catalogue.entries.flatMap((row:any)=>row.targets).filter((t:any)=>t.id===entry.target.id&&t.relation===entry.target.relation)){
  target.href=target.href.replace(target.runtimeRevision,foreign);target.runtimeRevision=foreign;
 }
 entry.target.runtimeRevision=foreign;
 catalogue.mappingRevision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({version:1,atlasRevision:catalogue.atlasRevision,entries:catalogue.entries})))),n=>n.toString(16).padStart(2,'0')).join('');
 catalogue.learning.mappingRevision=catalogue.mappingRevision;
 const {revision:_,...content}=entry;
 entry.revision=await regionalLearningRevision(catalogue.atlasRevision,catalogue.mappingRevision,content);
 assert.equal(await resolveRegionalLearningReview({...request,target:entry.target.id,relation:entry.target.relation,mappingRevision:catalogue.mappingRevision,teachingRevision:entry.revision},catalogue),null);
});
