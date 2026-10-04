// Historical admission proof runs on import; current delivery is checked separately.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {admission,pins,common,hash,handWebsiteEpoch} from './atlas-hand-bone-ultrasound-checks.mjs';

const sourceRevision='537838f028f15e62a6642e7eb360cbaeea31fa20';
const atlasSource='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const saved=(path:string)=>execFileSync('git',['show',`${handWebsiteEpoch}:${path}`],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sourceAt=(path:string)=>execFileSync('git',['show',`${sourceRevision}:${path}`],{cwd:atlasSource,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));

test('current midfoot ultrasound import preserves all 46 hand ultrasound drafts and exact source delivery',async()=>{
 const compiled=await build({stdin:{contents:common+"export * from './atlas-review/lib/hand-bone-ultrasound';export * from './atlas-review/content/hand-bone-ultrasound';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const delivery=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalogue=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
 assert.deepEqual(catalogue,JSON.parse(saved('atlas-review/public/models/bodyparts3d/full-body/catalog.json').toString()));
 const catalog=delivery.bodyDisplayCatalog(catalogue);
 assert.equal(catalog.structures.length,1104);
 assert.equal(catalog.bundles.length,109);
 assert.deepEqual(readFileSync('atlas-review/content/hand-bone-ultrasound-pins.json'),sourceAt('content/hand-bone-ultrasound-pins.json'));
 for(const {identity} of pins.entries){
  const lesson=admission.handBoneUltrasoundLesson(identity,'ultrasound');
  assert.deepEqual(delivery.handBoneUltrasoundLesson(identity,'ultrasound'),lesson,identity.id);
  assert.deepEqual(delivery.bodyLesson(identity,'ultrasound'),lesson,identity.id);
  const {readiness,...shown}=lesson;
  assert.deepEqual(delivery.bodyContent(identity,'ultrasound'),shown,identity.id);
  const before=await admission.bodyReviewMaterial(identity.id),current=await delivery.bodyReviewMaterial(identity.id);
  assert.deepEqual(current.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),before.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'));
  assert.equal(current.approval,false);
  assert(await delivery.parseBodyReviewResponse(current,identity.id));
  assert.equal((await delivery.bodyReviewContext(identity.id)).sourceHash,(await admission.bodyReviewContext(identity.id)).sourceHash);
 }
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,sourceRevision);
 for(const file of review.files)assert.equal(hash(readFileSync(`atlas-review/${file.path}`)),file.importedSha256,file.path);
 for(const path of ['lib/hand-bone-ultrasound.ts','content/hand-bone-ultrasound.ts','content/hand-bone-ultrasound-pins.json']){
  const file=review.files.find((item:{path:string})=>item.path===path);assert(file,path);
  assert.equal(file.sourceSha256,hash(sourceAt(path)));
 }
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${name}/`,manifest=json(`${base}manifest.json`);
  assert.equal(manifest.sourceCommit,sourceRevision);
  assert.equal(manifest.patientDataIncluded,false);
  assert.equal(manifest.clinicalApproved,false);
  for(const file of manifest.files){const bytes=readFileSync(base+file.path);assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
  const previous=JSON.parse(saved(`${base}manifest.json`).toString());
  assert.deepEqual(manifest.files.filter((file:{path:string})=>file.path.startsWith('models/')),previous.files.filter((file:{path:string})=>file.path.startsWith('models/')));
  const inputs=json(`${base}source-inputs.json`);
  for(const path of ['lib/hand-bone-ultrasound.ts','content/hand-bone-ultrasound.ts','content/hand-bone-ultrasound-pins.json']){
   const actual=inputs.find((file:{path:string})=>file.path===path),imported=review.files.find((file:{path:string})=>file.path===path);
   assert.equal(Boolean(actual),name==='head-neck'||name==='shoulder',`${name}:${path}`);
   if(actual)assert.equal(actual.sha256,imported.sourceSha256);
  }
  assert(!inputs.some((file:{path:string})=>file.path==='content/hand-bone-ultrasound.transition.json'));
  if(name==='head-neck'){
   const emitted=emittedTeaching(base,manifest.files);
   for(const {identity} of pins.entries){const lesson=delivery.handBoneUltrasoundLesson(identity,'ultrasound');
    for(const value of [identity.id,lesson.body,...lesson.bullets,lesson.note,...lesson.citations])
     assert(emitted.includes(value)||emitted.includes(JSON.stringify(value).slice(1,-1)),`learner:${identity.id}:${value.slice(0,40)}`);
   }
  }
 }
 const reviewBase='public/atlas-review-viewer/',reviewManifest=json(`${reviewBase}manifest.json`);
 assert.equal(reviewManifest.sourceCommit,sourceRevision);
 assert.equal(reviewManifest.personalRecordsIncluded,false);
 assert.equal(reviewManifest.mode,'production');
 assert.equal(reviewManifest.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const file of reviewManifest.files)assert.equal(hash(readFileSync(reviewBase+file.path)),file.sha256,`review:${file.path}`);
 const emittedReview=emittedTeaching(reviewBase,reviewManifest.files,true);
 for(const {identity} of pins.entries){const lesson=delivery.handBoneUltrasoundLesson(identity,'ultrasound');
  for(const value of [identity.id,lesson.body,...lesson.bullets,lesson.note,...lesson.citations])
   assert(emittedReview.includes(value)||emittedReview.includes(JSON.stringify(value).slice(1,-1)),`review:${identity.id}:${value.slice(0,40)}`);
 }
});
