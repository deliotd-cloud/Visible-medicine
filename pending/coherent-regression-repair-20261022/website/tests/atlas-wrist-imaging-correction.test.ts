// Immutable correction admission proof on import; current delivery is separate.
import './atlas-wrist-imaging-correction-checks.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const wristWebsiteEpoch='fdf1a982c2064786f0de8cc01c5ec895f2227d38';
const sourceRevision='537838f028f15e62a6642e7eb360cbaeea31fa20';
const atlasSource=currentAtlasDeliveryRoot();
const tabs=['ct','mri','xray'];
const common="export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const options={maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
const saved=(path:string)=>execFileSync('git',['show',`${wristWebsiteEpoch}:${path}`],options);
const sourceAt=(path:string)=>execFileSync('git',['show',`${sourceRevision}:${path}`],{...options,cwd:atlasSource});
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const hash=(value:Buffer|string)=>createHash('sha256').update(value).digest('hex');

test('current midfoot import preserves all 48 wrist correction topics and exact source delivery',async()=>{
 const admission=await atlasExactGitApi(wristWebsiteEpoch,common+"export * from './atlas-review/lib/wrist-imaging';export * from './atlas-review/content/wrist-imaging-concepts';");
 const compiled=await build({stdin:{contents:common+"export * from './atlas-review/lib/wrist-imaging';export * from './atlas-review/content/wrist-imaging-concepts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const delivery=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalogue=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
 assert.deepEqual(catalogue,JSON.parse(saved('atlas-review/public/models/bodyparts3d/full-body/catalog.json').toString()));
 const catalog=delivery.bodyDisplayCatalog(catalogue);
 assert.equal(catalog.structures.length,1104);
 assert.equal(catalog.bundles.length,109);
 const pins=json('atlas-review/content/wrist-imaging-pins.json');
 assert.deepEqual(readFileSync('atlas-review/content/wrist-imaging-pins.json'),sourceAt('content/wrist-imaging-pins.json'));
 assert.equal(pins.entries.length,16);
 let preserved=0;
 for(const {identity} of pins.entries)for(const tab of tabs){
  const lesson=admission.wristImagingLesson(identity,tab);
  assert.deepEqual(delivery.wristImagingLesson(identity,tab),lesson,`${identity.id}:${tab}`);
  assert.deepEqual(delivery.bodyLesson(identity,tab),lesson,`${identity.id}:${tab}`);
  const {readiness,...shown}=lesson;
  assert.deepEqual(delivery.bodyContent(identity,tab),shown,`${identity.id}:${tab}`);
  const before=await admission.bodyReviewMaterial(identity.id),current=await delivery.bodyReviewMaterial(identity.id);
  assert.deepEqual(current.topics.find((topic:{tab:string})=>topic.tab===tab),before.topics.find((topic:{tab:string})=>topic.tab===tab));
  assert.equal(current.approval,false);
  assert(await delivery.parseBodyReviewResponse(current,identity.id));
  assert.equal((await delivery.bodyReviewContext(identity.id)).sourceHash,(await admission.bodyReviewContext(identity.id)).sourceHash);
  preserved++;
 }
 assert.equal(preserved,48);
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const currentAtlas=currentAtlasDeliveryRoot();
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,pin.source);
 const altered=structuredClone(review);
 altered.files.find((file:{path:string})=>file.path==='content/wrist-imaging-pins.json').sourceSha256='0'.repeat(64);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:(path:string)=>path==='atlas-review/manifest.json'?Buffer.from(JSON.stringify(altered)):readFileSync(path)}),/Current delivery changed: atlas-review\/manifest.json/);
 for(const file of review.files)assert.equal(hash(readFileSync(`atlas-review/${file.path}`)),file.importedSha256,file.path);
 for(const path of ['lib/wrist-imaging.ts','content/wrist-imaging-concepts.ts','content/wrist-imaging-pins.json']){
  const file=review.files.find((item:{path:string})=>item.path===path);assert(file,path);
  assert.equal(file.sourceSha256,hash(sourceAt(path)));
  assert.equal(file.sourceSha256,hash(execFileSync('git',['show',pin.source+':'+path],{...options,cwd:currentAtlas})));
 }
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base=`public/atlas-runtime/${name}/`,manifest=json(`${base}manifest.json`);
  assert.equal(manifest.sourceCommit,pin.runtimeSources[name]);
  assert.equal(manifest.patientDataIncluded,false);
  assert.equal(manifest.clinicalApproved,false);
  for(const file of manifest.files){const bytes=readFileSync(base+file.path);assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
  const previous=JSON.parse(saved(`${base}manifest.json`).toString());
  assert.deepEqual(manifest.files.filter((file:{path:string})=>file.path.startsWith('models/')),previous.files.filter((file:{path:string})=>file.path.startsWith('models/')));
  const inputs=json(`${base}source-inputs.json`);
  for(const path of ['lib/wrist-imaging.ts','content/wrist-imaging-concepts.ts','content/wrist-imaging-pins.json']){
   const actual=inputs.find((file:{path:string})=>file.path===path),imported=review.files.find((file:{path:string})=>file.path===path);
   assert.equal(Boolean(actual),name==='head-neck'||name==='shoulder',`${name}:${path}`);
   if(actual){
    assert(imported,path);
    const runtimeSource=execFileSync('git',['--no-replace-objects','show',`${pin.runtimeSources[name]}:${path}`],{...options,cwd:currentAtlas});
    assert.equal(actual.sha256,hash(runtimeSource));
   }
  }
  assert(!inputs.some((file:{path:string})=>file.path.startsWith('content/wrist-imaging-correction.')));
  if(name==='head-neck'){
   const emitted=emittedTeaching(base,manifest.files);
   for(const {identity} of pins.entries)for(const tab of tabs){const lesson=delivery.wristImagingLesson(identity,tab);
    for(const value of [identity.id,lesson.body,...lesson.bullets,lesson.note,...lesson.citations])
     assert(emitted.includes(value)||emitted.includes(JSON.stringify(value).slice(1,-1)),`learner:${identity.id}:${tab}:${value.slice(0,40)}`);
   }
  }
 }
 const reviewBase='public/atlas-review-viewer/',reviewManifest=json(`${reviewBase}manifest.json`);
 assert.equal(reviewManifest.sourceCommit,pin.source);
 assert.equal(reviewManifest.personalRecordsIncluded,false);
 assert.equal(reviewManifest.mode,'production');
 assert.equal(reviewManifest.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const file of reviewManifest.files)assert.equal(hash(readFileSync(reviewBase+file.path)),file.sha256,`review:${file.path}`);
 const emittedReview=emittedTeaching(reviewBase,reviewManifest.files,true);
 for(const {identity} of pins.entries)for(const tab of tabs){const lesson=delivery.wristImagingLesson(identity,tab);
  for(const value of [identity.id,lesson.body,...lesson.bullets,lesson.note,...lesson.citations])
   assert(emittedReview.includes(value)||emittedReview.includes(JSON.stringify(value).slice(1,-1)),`review:${identity.id}:${tab}:${value.slice(0,40)}`);
 }
});
