// Historical admission proof runs on import; current delivery is checked separately.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {admission,pins,common,hash,handWebsiteEpoch} from './atlas-hand-bone-ultrasound-checks.mjs';
import {checkedAtlasHistoryRepo} from './atlas-source-repo.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const historicalDeliveryRevision='537838f028f15e62a6642e7eb360cbaeea31fa20';
const sourceRevision='408759d57644b05402e98a937e7cf6338b5509cf';
const atlasSource=checkedAtlasHistoryRepo(sourceRevision);
const saved=(path:string)=>execFileSync('git',['show',`${handWebsiteEpoch}:${path}`],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sourceAt=(path:string)=>execFileSync('git',['show',`${sourceRevision}:${path}`],{cwd:atlasSource,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));

test('current hand ultrasound import preserves all 46 historical drafts and exact current source delivery',async()=>{
 const currentSourceRoot=currentAtlasDeliveryRoot(),pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(execFileSync('git',['rev-parse',sourceRevision+'^{tree}'],{cwd:atlasSource,encoding:'utf8'}).trim(),'8386a10eb2bf80393233a7afe04447b2778877cd');
 const currentAt=(path:string)=>execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{cwd:currentSourceRoot,maxBuffer:32e6});
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
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 for(const file of review.files)assert.equal(hash(readFileSync(`atlas-review/${file.path}`)),file.importedSha256,file.path);
 for(const path of ['lib/hand-bone-ultrasound.ts','content/hand-bone-ultrasound.ts','content/hand-bone-ultrasound-pins.json']){
  const file=review.files.find((item:{path:string})=>item.path===path);assert(file,path);
  assert.deepEqual(currentAt(path),sourceAt(path),path+': immutable hand teaching held');
  assert.equal(file.sourceSha256,hash(currentAt(path)));
  assert.deepEqual(sourceAt(path),execFileSync('git',['show',`${historicalDeliveryRevision}:${path}`],{cwd:atlasSource,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}),`${path}: historical hand source retained`);
 }
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${name}/`,manifest=json(`${base}manifest.json`);
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
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
 assert.equal(reviewManifest.sourceCommit,CURRENT_ATLAS_REVISION);
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


test('current hand ultrasound binding refuses altered source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),review=json('atlas-review/manifest.json');
 for(const path of ['lib/hand-bone-ultrasound.ts','content/hand-bone-ultrasound.ts','content/hand-bone-ultrasound-pins.json']){
  const committed=execFileSync('git',['show',CURRENT_ATLAS_REVISION+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
  const imported=readFileSync('atlas-review/'+path);
  const verify=(manifest:any,learnerInputs:any,bytes:Buffer=imported)=>{
   const entry=manifest.files.find((file:any)=>file.path===path);assert(entry);
   assert.equal(entry.sourceSha256,hash(committed),'committed source');
   assert.equal(entry.importedSha256,hash(bytes),'Review import');
   assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:hash(committed)}],'learner input');
  };
  for(const module of ['head-neck','shoulder']){
   const inputs=json('public/atlas-runtime/'+module+'/source-inputs.json');
   verify(review,inputs);
   const forgedSource=structuredClone(review);forgedSource.files.find((file:any)=>file.path===path).sourceSha256='0'.repeat(64);
   assert.throws(()=>verify(forgedSource,inputs),/committed source/);
   const forgedImport=structuredClone(review);forgedImport.files.find((file:any)=>file.path===path).importedSha256='0'.repeat(64);
   assert.throws(()=>verify(forgedImport,inputs),/Review import/);
   const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
   const forgedInput=structuredClone(inputs);forgedInput.find((file:any)=>file.path===path).sha256='0'.repeat(64);
   assert.throws(()=>verify(review,forgedInput),/learner input/);
  }
 }
});
