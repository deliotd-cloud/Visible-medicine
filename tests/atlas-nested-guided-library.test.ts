import assert from 'node:assert/strict';
import {prePICAImportBytes} from './atlas-pica-history.ts';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {desktopLayoutImportMilestone,withoutCubitalVenousUltrasoundNotice} from './atlas-cubital-ultrasound-history.ts';

const source='6c86bc8b1aa7a7418f21f890858b0217194aff4e';
const baseline='3d67b5575a49e302b0da7c4c55a5d6f3a033b003';
const old=(path:string)=>Buffer.from(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6}));
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');

async function load(previousRenderer=false){
 const built=await build({stdin:{contents:`export * from './atlas-review/lib/nested-guided-learning';
 export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/lib/nested-review';
 export * from './atlas-review/lib/nested-review-api';export * from './atlas-review/lib/nested-review-client';
 import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
 export {bodyDisplayCatalog};
 import raw from './public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json';
 export const catalog=bodyDisplayCatalog(raw);`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:previousRenderer?[{name:'exact-prior-review-renderer',setup(api){
  api.onLoad({filter:/body-renderer-revision\.json$/},args=>({contents:old('atlas-review/content/body-renderer-revision.json').toString('utf8'),loader:'json',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('nested library source, exact eye options and credits reach learner and protected review without new models or access',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),prior=JSON.parse(old('atlas-review/manifest.json').toString('utf8'));
 assert.equal(review.revision,source);assert.equal(review.files.length,1009);assert.deepEqual(review.packages,prior.packages);
 const milestone=desktopLayoutImportMilestone();
 assert.deepEqual(milestone.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/nested-guided-learning-bindings.v1.json','lib/nested-guided-learning.ts']);
 assert.deepEqual(milestone.files.filter((f:any)=>prior.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/atlas-workspace.css','app/eye-layers.tsx','app/whole-body-guided-learning.css','app/whole-body-guided-learning.tsx','content/body-renderer-revision.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 const receipt=json('atlas-review/integration-inputs.json');assert.equal(receipt.sourceCommit,source);
 for(const path of ['atlas-review/lib/nested-guided-learning.ts','atlas-review/content/nested-guided-learning-bindings.v1.json'])
  assert(receipt.inputs.some((i:any)=>i.path===path),path+' included in review binding');
 const options=api.nestedGuidedStudyOptions(api.catalog);
 assert.deepEqual(options.map((o:any)=>o.title),['Right eye layers','Left eye layers']);
 assert.equal(new Set(options.map((o:any)=>o.id)).size,2);
 assert.equal(options.reduce((n:number,o:any)=>n+o.guide.steps.length,0),8);
 const children=new Set(options.flatMap((o:any)=>o.guide.steps.flatMap((s:any)=>s.ids)));
 assert.equal(children.size,15);
 for(const option of options){
  assert.equal(option.guide.status,'draft');assert.equal(option.guide.parentId,option.parent.id);
  assert.match(option.parentHash,/^[a-f0-9]{64}$/);assert.match(option.sourceHash,/^[a-f0-9]{64}$/);
  assert.deepEqual(api.nestedGuidedStudyOptions(api.catalog,'head-neck').find((o:any)=>o.id===option.id),option);
 }
 for(const region of ['thorax','pelvis','unknown'])assert.deepEqual(api.nestedGuidedStudyOptions(api.catalog,region),[]);
 for(const folder of ['public/atlas-runtime/head-neck/','public/atlas-runtime/shoulder/','public/atlas-runtime/lower-limb/']){
  const manifest=json(folder+'manifest.json'),before=JSON.parse(old(folder+'manifest.json').toString('utf8'));
  assert.equal(manifest.sourceCommit,source);assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.modelBundles,before.modelBundles);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),before.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const f of manifest.files)assert.equal(sha(readFileSync(folder+f.path)),f.sha256,f.path);
  assert.equal(withoutCubitalVenousUltrasoundNotice(readFileSync(folder+'LICENSES/THIRD_PARTY_NOTICES.md','utf8')),old(folder+'LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8'));
  for(const path of ['bundled-dependencies.json','BUNDLED_NOTICES.txt'])
   assert.deepEqual(readFileSync(folder+path),old(folder+path),path+' retained');
  for(const flag of ['clinicalApproved','imagingConnection','standaloneReviewConnection']){
   if(folder==='public/atlas-runtime/head-neck/')assert.equal(manifest[flag],false);
   else{
    assert.equal(Object.hasOwn(manifest,flag),Object.hasOwn(before,flag),flag+' schema retained');
    if(Object.hasOwn(before,flag))assert.equal(manifest[flag],before[flag],flag+' baseline value retained');
   }
  }
 }
 const protectedViewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(protectedViewer.sourceCommit,source);assert.equal(protectedViewer.websiteIntegrationSha256,receipt.sha256);
 assert.equal(protectedViewer.mode,'production');assert.equal(protectedViewer.personalRecordsIncluded,false);
 for(const f of protectedViewer.files)assert.equal(sha(readFileSync('public/atlas-review-viewer/'+f.path)),f.sha256,f.path);
 const priorCredits=old('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt').toString('utf8');
 assert.equal(priorCredits.split('Atlas source: 03da432b035d1dca7cc9f3344ee2722af627d859\n').length,2,
  'Prior protected notice has exactly one source revision line');
 assert.equal(withoutCubitalVenousUltrasoundNotice(readFileSync('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt','utf8')),
  priorCredits.replace('Atlas source: 03da432b035d1dca7cc9f3344ee2722af627d859\n',
   'Atlas source: 6c86bc8b1aa7a7418f21f890858b0217194aff4e\n'),
  'Protected viewer credits retain every byte after the source revision header');
 // Source registry gained three exact MCA drafts later, tested across all live
 // contexts in atlas-mca-source-teaching; keep this epoch byte check historical.
 assert.deepEqual(Buffer.from(execFileSync('git',['show','a8349b2fefbe8be1403c78822487ba7eb95d7d8c:atlas-review/content/nested-teaching.ts'])),old('atlas-review/content/nested-teaching.ts'));
 for(const p of ['content/nested-review-bindings.json','lib/nested-review-material.ts',
  'lib/nested-review.ts'])
  assert.deepEqual(p==='lib/nested-review-material.ts'?prePICAImportBytes('atlas-review/'+p):readFileSync('atlas-review/'+p),old('atlas-review/'+p),p+' retained at the original teaching epoch');
 assert.equal(withoutCubitalVenousUltrasoundNotice(readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8')),old('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8'));
 const inventory=json('lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
 assert.deepEqual(inventory.models,JSON.parse(old('lib/atlas-model-inventory.json').toString('utf8')).models);
});

test('108 nested source and teaching packets remain exact; old material and geometry are refused before storage',async()=>{
 const now=await load(),before=await load(true),storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 let contexts=0,materialRejects=0,geometryRejects=0;let fixture:any;
 for(const group of now.nestedReviewRows)for(const row of group.surfaces){
  const current=await now.nestedReviewMaterial(group.key,row.id),previous=await before.nestedReviewMaterial(group.key,row.id);
  assert(current&&previous);contexts++;
  assert.deepEqual(current.source,previous.source);assert.deepEqual(current.teaching,previous.teaching);
  const c=current.context,p=previous.context;
  assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.sourceFrame,p.sourceFrame);
  assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.revisions.teaching,p.revisions.teaching);
  assert.deepEqual(c.teachingTabs,p.teachingTabs);assert.deepEqual(c.blockers,p.blockers);
  assert.equal(c.revisions.imaging,null);assert.notEqual(c.rendererHash,p.rendererHash);
  assert.notEqual(c.materialHash,p.materialHash);assert.notEqual(c.revisions.geometry,p.revisions.geometry);
  const reject=async(track:string,delta:any)=>{
   const response=await now.postNestedReview(new Request('https://review.test/api/atlas-review/nested-review',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_NESTED_LIBRARY'},
    body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,
     materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,
     draft:now.blankNestedReview(c,track),...delta})}),storage);
   assert.equal(response.status,409);
  };
  for(const track of ['geometry','teaching']){await reject(track,{materialHash:p.materialHash});materialRejects++;}
  await reject('geometry',{revisionHash:p.revisions.geometry});geometryRejects++;
  if(!fixture&&!c.blockers.teaching.length)fixture={c,p};
 }
 assert.deepEqual({contexts,materialRejects,geometryRejects},{contexts:108,materialRejects:216,geometryRejects:108});
 assert(fixture,'At least one reviewable teaching context');
 const {c,p}=fixture;
 for(const track of ['geometry','teaching']){
  const historical={...before.blankNestedReview(p,track),reviewer:'SOFTWARE TEST ONLY',qualification:'Synthetic fixture',
   scope:'Synthetic review only; not clinical sign-off',status:'approved',attested:true,
   checks:Object.fromEntries(p.checklists[track].map((item:any)=>[item.id,true])),
   evidence:[{title:'Synthetic fixture',url:'https://example.com/test',note:'Not clinical evidence'}],
   eventSchema:'vm-nested-review-event-1',catalogScope:p.catalogScope,nestedKey:p.nestedKey,sourceFrame:p.sourceFrame,
   structureId:p.structureId,track,version:1,savedAt:'2026-10-01T10:00:00.000Z',reviewedAt:'2026-10-01T10:00:00.000Z',
   revisionHash:p.revisions[track],checklistVersion:p.checklistVersion,checklist:p.checklists[track],
   material:{materialHash:p.materialHash,sourceHash:p.sourceHash,teachingHash:p.teachingHash,rendererHash:p.rendererHash,teachingTabs:p.teachingTabs}};
  const parsed=now.parseSavedNestedReview(historical);
  const history=now.parseNestedHistory({scope:'private-to-signed-in-user',track,context:c,history:[historical],nextBefore:null},c,track);
  assert.deepEqual(history.history[0],parsed,'Original approved record remains revision-bound');
  assert.equal(now.nestedDecisionLabel(parsed,c),track==='geometry'?'Re-review required':'Approval recorded');
  const restored=now.nestedDraftFromSaved(parsed,c,track);
  assert.equal(restored.status,'draft');assert.equal(restored.attested,false);
  if(track==='geometry')assert(Object.values(restored.checks).every(value=>value===false));
 }
});
