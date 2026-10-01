import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
const baseline='03da432b035d1dca7cc9f3344ee2722af627d859';
const old=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6});
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './lib/nested-review-material';
 export * from './lib/nested-review';export * from './lib/nested-review-api';export * from './lib/nested-review-client';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:previous?[{name:'exact-previous-guide-library-renderer',setup(api){
  api.onLoad({filter:/body-renderer-revision\.json$/},()=>({contents:old('content/body-renderer-revision.json').toString(),loader:'json'}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const now=await load(),before=await load(true),storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
let count=0,materialRejected=0,geometryRejected=0;
for(const group of now.nestedReviewRows)for(const row of group.surfaces){
 const current=await now.nestedReviewMaterial(group.key,row.id),previous=await before.nestedReviewMaterial(group.key,row.id),c=current.context,p=previous.context;
 assert.deepEqual(current.source,previous.source);assert.deepEqual(current.teaching,previous.teaching);
 assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.sourceFrame,p.sourceFrame);
 assert.equal(c.revisions.teaching,p.revisions.teaching);assert.equal(c.revisions.imaging,null);assert.deepEqual(c.checklists,p.checklists);assert.deepEqual(c.blockers,p.blockers);
 assert.notEqual(c.rendererHash,p.rendererHash);assert.notEqual(c.materialHash,p.materialHash);assert.notEqual(c.revisions.geometry,p.revisions.geometry);
 for(const [track,delta]of [['teaching',{materialHash:p.materialHash}],['geometry',{materialHash:p.materialHash}],['geometry',{revisionHash:p.revisions.geometry}]]){
  const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test',
   'content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_LIBRARY_TEST'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,
   structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,
   track,expectedVersion:0,draft:now.blankNestedReview(c,track),...delta})}),storage);
  assert.equal(response.status,409);if('materialHash'in delta)materialRejected++;else geometryRejected++;
 }
 for(const track of ['geometry','teaching']){
  const event={...before.blankNestedReview(p,track),status:'approved',attested:true,reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic',scope:'No clinical sign-off',
   evidence:[{title:'Synthetic fixture',url:'https://example.test/review',note:'Not clinical evidence'}],checks:Object.fromEntries(p.checklists[track].map(i=>[i.id,true])),
   eventSchema:'vm-nested-review-event-1',catalogScope:p.catalogScope,nestedKey:p.nestedKey,sourceFrame:p.sourceFrame,structureId:p.structureId,
   track,version:1,savedAt:'2026-10-01T10:00:00.000Z',reviewedAt:'2026-10-01T10:00:00.000Z',revisionHash:p.revisions[track],checklistVersion:p.checklistVersion,
   checklist:p.checklists[track],material:{materialHash:p.materialHash,sourceHash:p.sourceHash,teachingHash:p.teachingHash,rendererHash:p.rendererHash,teachingTabs:p.teachingTabs}};
  const parsed=now.parseSavedNestedReview(event);assert.equal(now.nestedDecisionLabel(parsed,c),track==='geometry'?'Re-review required':'Approval recorded');
  const restored=now.nestedDraftFromSaved(parsed,c,track);assert.equal(restored.status,'draft');assert.equal(restored.attested,false);
  if(track==='geometry')assert(Object.values(restored.checks).every(v=>v===false));
 }
 count++;
}
assert.deepEqual({count,materialRejected,geometryRejected},{count:108,materialRejected:216,geometryRejected:108});
for(const path of ['content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json','content/nested-teaching.ts','lib/eye-layer-guide.ts','lib/nested-review-material.ts','LICENSES/THIRD_PARTY_NOTICES.md','package-lock.json'])
 assert.deepEqual(await readFile(path),old(path),path+' retained');
const evidence={baseline,unchangedSourceContexts:count,unchangedTeachingContexts:count,staleMaterialRejectedBeforeStorage:materialRejected,
 staleGeometryRejectedBeforeStorage:geometryRejected,teachingHistoryIndependent:true,geometryReReviewRequired:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/nested-guided-library-review-validation.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
