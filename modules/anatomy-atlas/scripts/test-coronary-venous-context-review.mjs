import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline='c5c99ba11e6533d306587e71f5fc2854d882fbd6';
const old=path=>execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6});
const exports=`export * from './lib/nested-review-material';
 export * from './lib/nested-review';export * from './lib/nested-review-client';
 export * from './lib/nested-review-api';export * from './lib/specimen-links';`;
async function load(previous=false){
 const result=await build({stdin:{contents:exports,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',
  plugins:previous?[{name:'immutable-before-coronary-context',setup(api){
   for(const [filter,path,loader] of [
    [/[/\\]lib[/\\]nested-review-material\.ts$/,'lib/nested-review-material.ts','ts'],
    [/[/\\]content[/\\]body-renderer-revision\.json$/,'content/body-renderer-revision.json','json'],
   ])api.onLoad({filter},args=>({contents:old(path).toString(),loader,resolveDir:dirname(args.path)}));
  }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const now=await load(),before=await load(true);
let storageCalls=0;
const storage=new Proxy({},{get(){storageCalls++;throw Error('Stale review reached storage');}});
const digest=value=>createHash('sha256').update(now.canonicalSpecimenValue(JSON.parse(JSON.stringify(value)))).digest('hex');
let staleRequests=0,forgedSources=0,restoredApprovals=0,selections=0;
for(const group of now.nestedReviewRows.filter(g=>g.study==='coronary-venous'))for(const row of group.surfaces){
 const current=await now.nestedReviewMaterial(group.key,row.id),previous=await before.nestedReviewMaterial(group.key,row.id);
 const c=current.context,p=previous.context,landmarks=current.source.orientationContext;
 assert(landmarks);assert.equal(landmarks.structures.length,3);
 assert.deepEqual(landmarks.structures.map(s=>s.fmaId),['FMA76767','FMA4707','FMA4713']);
 assert(!landmarks.structures.some(s=>s.id===current.source.parent.id||s.id===row.id));
 assert.deepEqual(landmarks.coordinateSystem,current.source.coordinateSystem);
 assert.equal(landmarks.license,current.source.license);assert.equal(landmarks.credit,current.source.credit);
 assert.equal(landmarks.sourceVersion,current.source.sourceVersion);
 assert.equal(landmarks.structures[0].sources.length,2,'Anterior vein remains a source group');
 assert(current.teaching.orientationContext.guide.includes('nonselectable'));
 assert(current.teaching.orientationContext.guide.includes('do not establish'));
 assert.equal(landmarks.structures[2].sources.length,14,'Middle vein retains fourteen grouped files');
 assert(c.checklists.geometry.some(check=>check.id==='coronary-landmarks'));
 assert(c.checklists.teaching.some(check=>check.id==='coronary-landmarks'));
 assert.notEqual(c.sourceHash,p.sourceHash);assert.notEqual(c.teachingHash,p.teachingHash);
 assert.notEqual(c.revisions.geometry,p.revisions.geometry);assert.notEqual(c.revisions.teaching,p.revisions.teaching);
 assert.equal(c.revisions.imaging,null);
 assert.equal(await now.nestedReviewSelection(group.key,row.id,p.sourceHash),null);
 assert.deepEqual(await now.nestedReviewSelection(group.key,row.id,c.sourceHash),current);
 for(const mutate of [
  source=>{source.orientationContext.structures.pop();},
  source=>{source.orientationContext.structures[0].sources[0].sha256='0'.repeat(64);},
  source=>{source.orientationContext.bundles[0].sha256='0'.repeat(64);},
  source=>{source.orientationContext.coordinateSystem.unitsPerMillimetre*=2;},
  source=>{source.orientationContext.credit='foreign';},
 ]){
  const changed=structuredClone(current.source);mutate(changed);
  assert.equal(await now.nestedReviewSelection(group.key,row.id,digest(changed)),null);forgedSources++;
 }
 for(const track of ['geometry','teaching']){
  for(const delta of [{materialHash:p.materialHash},{revisionHash:p.revisions[track]}]){
   const response=await now.postNestedReview(new Request('https://review.test/api/nested-review',{method:'POST',headers:{origin:'https://review.test',
    'content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CONTEXT_TEST'},body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,
    structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,
    track,expectedVersion:0,draft:now.blankNestedReview(c,track),...delta})}),storage);
   assert.equal(response.status,409);staleRequests++;
  }
  const event={...before.blankNestedReview(p,track),status:'approved',attested:true,reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic',scope:'No clinical sign-off',
   evidence:[{title:'Synthetic fixture',url:'https://example.test/review',note:'Not clinical evidence'}],checks:Object.fromEntries(p.checklists[track].map(check=>[check.id,true])),
   eventSchema:'vm-nested-review-event-1',catalogScope:p.catalogScope,nestedKey:p.nestedKey,sourceFrame:p.sourceFrame,structureId:p.structureId,
   track,version:1,savedAt:'2026-10-04T00:00:00.000Z',reviewedAt:'2026-10-04T00:00:00.000Z',revisionHash:p.revisions[track],checklistVersion:p.checklistVersion,
   checklist:p.checklists[track],material:{materialHash:p.materialHash,sourceHash:p.sourceHash,teachingHash:p.teachingHash,rendererHash:p.rendererHash,teachingTabs:p.teachingTabs}};
  const parsed=now.parseSavedNestedReview(event);
  assert.equal(now.nestedDecisionLabel(parsed,c),'Re-review required');
  const restored=now.nestedDraftFromSaved(parsed,c,track);
  assert.equal(restored.status,'draft');assert.equal(restored.attested,false);
  assert(Object.values(restored.checks).every(value=>value===false));restoredApprovals++;
 }
 const copy=structuredClone(current);copy.source.orientationContext.structures[0].name='mutated';copy.teaching.orientationContext.guide='mutated';
 assert.deepEqual(await now.nestedReviewMaterial(group.key,row.id),current);
 selections++;
}
assert.equal(selections,2);assert.equal(storageCalls,0);
const worksheet=await readFile('app/review/nested/workspace.tsx','utf8');
assert(worksheet.includes('Coronary vein landmark source evidence'));
assert(worksheet.includes('Coronary vein landmark teaching evidence'));
assert(worksheet.includes('Ordered source IDs:'));
console.log(JSON.stringify({passed:true,selections,forgedSources,staleRequests,restoredApprovals,storageCalls,
 baseline,clinicalApproval:false,patientDataAccess:false,browserAcceptance:false}));
