import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const featureRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
const revision=CURRENT_ATLAS_REVISION;
const sha=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url));
const json=(path:string)=>JSON.parse(read(path).toString());

test('learner and protected Review deliver the same source-bound library playback pause',()=>{
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,revision);
 assert.equal(execFileSync('git',['rev-parse',featureRevision+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
 const prefix='public/atlas-runtime/head-neck/',learner=json(prefix+'manifest.json'),review=json('atlas-review/manifest.json');
 assert.equal(learner.sourceCommit,revision);assert.equal(review.revision,revision);
 const inputs=json(prefix+'source-inputs.json'),renderer=json('atlas-review/content/body-renderer-revision.json');
 for(const path of ['app/whole-body-guided-learning.tsx','app/regional-guided-learning.tsx']){
  const input=inputs.find((f:any)=>f.path===path),imported=review.files.find((f:any)=>f.path===path);
  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256);
  const current=execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot});
  const historical=execFileSync('git',['show',featureRevision+':'+path],{cwd:sourceRoot});
  assert.deepEqual(current,historical,path+': immutable pause source held');
  assert.equal(input.sha256,sha(current),path+': exact committed source');
  assert.equal(renderer.dependencies.find((f:any)=>f.path===path)?.sha256,input.sha256);
  const bytes=read('atlas-review/'+path);assert.equal(sha(bytes),imported.importedSha256);
  assert.equal(sha(bytes.toString().replaceAll('@/atlas-review/','@/')),input.sha256);
 }
 const library=read('atlas-review/app/whole-body-guided-learning.tsx').toString();
 for(const text of ['onFocusCapture={pauseForLibrary}','onPointerDownCapture={pauseForLibrary}','if(event.currentTarget.open)pauseForLibrary()','pauseRequest={pauseRequest}','key={`${tour.id}:${tour.tour.revision}`'])assert(library.includes(text),text);
 const player=read('atlas-review/app/regional-guided-learning.tsx').toString();
 for(const text of ['previousPauseRequest.current===pauseRequest','pausedImaging?.suspend();revokePlayback();','playbackEpoch.current++','setMotionPaused(true)','transitionPaused={motionPaused||!ready}'])assert(player.includes(text),text);
 const runtime=learner.files.filter((f:any)=>/\.js$/.test(f.path)).map((f:any)=>{
  const bytes=read(prefix+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();
 }).join('\n');
 assert(runtime.includes('pauseRequest'),'Generated learner contains the parent/child pause contract');
 for(const prop of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(learner[prop],false);
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
});


test('current pause source binding refuses altered source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),path='app/regional-guided-learning.tsx';
 const committed=execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot});
 const review=json('atlas-review/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 const imported=read('atlas-review/'+path);
 const verify=(manifest:any,learnerInputs:any,bytes:Buffer=imported)=>{
  const row=manifest.files.find((file:any)=>file.path===path);assert(row);
  assert.equal(row.sourceSha256,sha(committed),'committed source');
  assert.equal(row.importedSha256,sha(bytes),'Review import');
  assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:sha(committed)}],'learner input');
 };
 verify(review,inputs);
 const forgedSource=structuredClone(review);forgedSource.files.find((file:any)=>file.path===path).sourceSha256='0'.repeat(64);
 assert.throws(()=>verify(forgedSource,inputs),/committed source/);
 const forgedImport=structuredClone(review);forgedImport.files.find((file:any)=>file.path===path).importedSha256='0'.repeat(64);
 assert.throws(()=>verify(forgedImport,inputs),/Review import/);
 const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
 const forgedInput=structuredClone(inputs);forgedInput.find((file:any)=>file.path===path).sha256='0'.repeat(64);
 assert.throws(()=>verify(review,forgedInput),/learner input/);
});
