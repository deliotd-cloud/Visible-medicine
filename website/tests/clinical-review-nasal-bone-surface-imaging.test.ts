import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeachingSearch} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const sourceCommit='7e2552a300df29faf346be146929ffc727880ec5';
const sourceHashes:Record<string,string>={
 'content/nasal-bone-surface-imaging.ts':'b8a9e1005426628017fd1f8ba04b31c145253159d7c15b10a4d80d671e497496',
 'lib/nasal-bone-surface-imaging.ts':'da4cf412f933c1771aafa08ddb8615dc8ae1523d2eb1c2b3cec3ff99b1b52e02',
 'content/cranial-bone-imaging-pins.json':'c45e8bb107ee02a976c43fd47cc77305391e112fdeaf84c51e1d2bc3f7850be0',
};
const expected=new Map([
 ['vm:anatomy:body:head-neck:left:bone:left-nasal-bone',{fma:'FMA53648',file:'FJ3272',sha:'43a73088376ae4179e8edd2f5d296d5c573cd1078379a0e3e8eeb90920ba9dc5'}],
 ['vm:anatomy:body:head-neck:right:bone:right-nasal-bone',{fma:'FMA53647',file:'FJ3378',sha:'933e8c8de3b4eaa2a4d784862388cac53da48309a29fd3ae04e9ac10da543c5f'}],
]);
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('bilateral nasal-bone teaching binds imported source, learner and protected Review',async()=>{
 assert.equal(CURRENT_ATLAS_REVISION,sourceCommit);
 assert.equal(validateCurrentAtlasDelivery().source,sourceCommit);
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,sourceCommit);
 for(const [path,digest] of Object.entries(sourceHashes)){
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 const pins=json('atlas-review/content/cranial-bone-imaging-pins.json');
 const selected=pins.entries.filter((entry:{identity:{id:string}})=>expected.has(entry.identity.id));
 assert.equal(selected.length,2);
 assert.deepEqual(new Set(selected.map((entry:{identity:{id:string}})=>entry.identity.id)),new Set(expected.keys()));
 const modules=['head-neck','shoulder','lower-limb','female-pelvis'];
 for(const module of modules){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,sourceCommit,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,digest] of Object.entries(sourceHashes)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(input?.sha256,digest,`${module}: ${path}`);
   else assert.equal(input,undefined,`${module}: unrelated source`);
  }
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,sourceCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const learner=json('public/atlas-runtime/head-neck/manifest.json');
 const emitted=[emittedTeachingSearch('public/atlas-runtime/head-neck/',learner.files),emittedTeachingSearch('public/atlas-review-viewer/',viewer.files)];
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {nasalBoneSurfaceImagingLesson} from './atlas-review/lib/nasal-bone-surface-imaging';",
  "export {nasalBoneSurfaceImagingTopics,nasalBoneSurfaceImagingReferences,nasalBoneSurfaceImagingNote} from './atlas-review/content/nasal-bone-surface-imaging';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.nasalBoneSurfaceImagingTopics).sort(),['ultrasound','xray']);
 let placements=0;
 for(const {identity} of selected){
  const id=identity.id,known=expected.get(id)!;
  assert.equal(identity.fmaId,known.fma);
  assert.deepEqual(identity.sources,[{file:known.file,sha256:known.sha}]);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  const packet=wire(await api.bodyReviewMaterial(id)),context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.deepEqual(packet.source.structure,identity,id);
  assert.equal(context.materialHash,packet.materialHash,id);
  assert.equal(context.sourceHash,packet.fingerprints.source,id);
  assert.equal(context.teachingHash,packet.fingerprints.teaching,id);
  assert.equal(context.revisions.imaging,null,id);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet,id);
  for(const tab of ['xray','ultrasound']){
   const lesson=api.nasalBoneSurfaceImagingLesson(identity,tab);
   assert(lesson,`${id}:${tab}`);
   assert.equal(lesson.readiness,'draft');
   assert.deepEqual(api.bodyLesson(identity,tab),lesson,`${id}:${tab}: website resolver`);
   assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab===tab),{tab,...lesson},`${id}:${tab}: Review consumer`);
   assert.match(lesson.note,/revision-bound radiologist sign-off is pending/i);
   assert.match(lesson.note,/anatomically unvalidated/i);
   for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
    assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${id}:${tab}: emitted teaching missing ${value}`);
   for(const changed of [
    (bad:any)=>{bad.topics.find((topic:any)=>topic.tab===tab).body+=' altered';},
    (bad:any)=>{bad.topics.find((topic:any)=>topic.tab===tab).citations[0]+='?altered';},
    (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
   ]){const bad=wire(packet);changed(bad);assert.equal(await api.parseBodyReviewResponse(bad,id),null,`${id}:${tab}: forged packet`);}
   placements++;
  }
  for(const tab of ['anatomy','function','clinical','pathology','ct','mri','quiz'])
   assert.equal(api.nasalBoneSurfaceImagingLesson(identity,tab),undefined,`${id}:${tab}: no new placement`);
  for(const claim of ['materialHash','revisionHash'] as const){
   const input={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
   input[claim]='0'.repeat(64);
   let storageCalls=0;
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
     'oai-authenticated-user-id':'synthetic-reviewer'},body:JSON.stringify(input)}),
    {prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
   assert.equal(response.status,409,`${id}: stale ${claim}`);
   assert.equal(storageCalls,0,`${id}: refusal before storage`);
  }
 }
 assert.equal(placements,4);
});
