import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const json=(path:string)=>JSON.parse(read(path));
const sha=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const featureRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
const source=CURRENT_ATLAS_REVISION;
const loadPolicy=()=>{
 const output=ts.transpileModule(read('atlas-review/lib/guided-playback.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{} as any};new Function('module','exports',output)(module,module.exports);return module.exports;
};

test('adjustable tour speed reaches all normal website modules and the revision-bound Review renderer',()=>{
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,source);
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,source);
 assert.equal(execFileSync('git',['rev-parse',featureRevision+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
 const paths=['lib/guided-playback.ts','app/tour-speed-control.tsx','app/tour-speed-control.css'];
 for(const path of paths){
  const committed=execFileSync('git',['show',source+':'+path],{cwd:sourceRoot});
  const historical=execFileSync('git',['show',featureRevision+':'+path],{cwd:sourceRoot});
  assert.deepEqual(committed,historical,path+': immutable feature source held');
  const row=review.files.find((item:{path:string})=>item.path===path);assert(row,path);
  assert.equal(row.sourceSha256,sha(committed),path+': committed source');
  assert.equal(row.importedSha256,sha(read('atlas-review/'+path)),path+': bound import');
 }
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis']){
  assert.equal(json(`public/atlas-runtime/${module}/manifest.json`).sourceCommit,pin.runtimeSources[module]);
  const inputs=json(`public/atlas-runtime/${module}/source-inputs.json`);
  for(const path of ['lib/guided-playback.ts','app/tour-speed-control.tsx','app/tour-speed-control.css']){
   const input=inputs.find((item:{path:string})=>item.path===path);assert(input,`${module}: ${path}`);
   const imported=review.files.find((item:{path:string})=>item.path===path);assert(imported,path);
   assert.equal(input.sha256,imported.sourceSha256);
   assert.equal(sha(read('atlas-review/'+path)),imported.importedSha256);
  }
 }
 for(const path of ['app/regional-guided-learning.tsx','app/shoulder-tour-player.tsx','app/eye-layers.tsx','app/ventricles.tsx','app/um-knee-study.tsx']){
  assert.match(read('atlas-review/'+path),/TourSpeedControl/);assert(review.files.some((item:{path:string})=>item.path===path));
 }
 assert.match(read('atlas-review/app/shoulder-explorer.tsx'),/onRateChange=\{changeTourRate\}/);
 assert.match(read('atlas-review/app/tour-speed-control.tsx'),/aria-label="Tour speed"/);
});

test('imported runtime speed scales stop and sweep while preserving authored 1x evidence and invalid-rate safety',()=>{
 const api=loadPolicy(),steps=[{caption:'Retained anatomical caption.'},{caption:'Longer stop.',durationMs:60000}],before=structuredClone(steps);
 assert.deepEqual(api.GUIDED_PLAYBACK_RATES,[.5,1,1.5,2,3]);
 assert.deepEqual(api.guidedPlaybackEvidence(steps),{version:1,start:'explicit-play-full-tour',transition:'quintic-orbit',transitionMs:8000,minimumStepMs:24000,captionWordsPerMinute:180,stepDurationsMs:[24000,60000],final:'hold',reducedMotion:'no-camera-sweep'});
 for(const rate of api.GUIDED_PLAYBACK_RATES){assert.equal(api.guidedSweepDuration(rate),Math.ceil(8000/rate));assert.equal(api.guidedPlaybackDuration(steps[0].caption,0,rate),Math.ceil(24000/rate));}
 for(const rate of [0,4,NaN,Infinity,'2',null]){assert.equal(api.isGuidedPlaybackRate(rate),false);assert.equal(api.guidedSweepDuration(rate),8000);assert.equal(api.guidedPlaybackDuration('Caption',0,rate),24000);}
 assert.deepEqual(steps,before);
});

test('tour speed current binding refuses forged source, import and learner hashes',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),path='lib/guided-playback.ts';
 const committed=execFileSync('git',['show',source+':'+path],{cwd:sourceRoot});
 const review=json('atlas-review/manifest.json');
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 const imported=read('atlas-review/'+path);
 const verify=(manifest:any,learnerInputs:any,bytes:string=imported)=>{
  const row=manifest.files.find((item:{path:string})=>item.path===path);assert(row);
  assert.equal(row.sourceSha256,sha(committed),'committed source');
  assert.equal(row.importedSha256,sha(bytes),'Review import');
  assert.deepEqual(learnerInputs.filter((item:{path:string})=>item.path===path),
   [{path,sha256:sha(committed)}],'head-neck source input');
 };
 verify(review,inputs);
 const forgedSource=structuredClone(review);forgedSource.files.find((item:{path:string})=>item.path===path).sourceSha256='0'.repeat(64);
 assert.throws(()=>verify(forgedSource,inputs),/committed source/);
 const forgedImport=structuredClone(review);forgedImport.files.find((item:{path:string})=>item.path===path).importedSha256='0'.repeat(64);
 assert.throws(()=>verify(forgedImport,inputs),/Review import/);
 assert.throws(()=>verify(review,inputs,'x'+imported.slice(1)),/Review import/);
 const forgedInput=structuredClone(inputs);forgedInput.find((item:{path:string})=>item.path===path).sha256='0'.repeat(64);
 assert.throws(()=>verify(review,forgedInput),/head-neck source input/);
});
