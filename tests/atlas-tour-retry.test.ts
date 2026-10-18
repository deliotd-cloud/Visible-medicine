import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const featureWebsite='c285a3871181565c35535ed65eb48d23fc13acd8';
const featureSource='a10496da94d9d054306bbc48e5ae9c98239d82b5';
const gitOptions={maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}};
const websiteBytes=(path:string)=>execFileSync('git',['show',featureWebsite+':'+path],gitOptions);
const websiteJson=(path:string)=>JSON.parse(websiteBytes(path).toString());
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

test('regional and whole-body learners deliver the verified source-bound tour recovery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const historicalLearner=websiteJson(base+'manifest.json');
  const historicalInputs=websiteJson(base+'source-inputs.json');
  const historicalReview=websiteJson('atlas-review/manifest.json');
  assert.equal(historicalLearner.sourceCommit,featureSource);
  assert.equal(historicalReview.revision,featureSource);
  const pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  const currentAtlas=currentAtlasDeliveryRoot();
  assert.equal(learner.sourceCommit,pin.source);
  assert.equal(review.revision,pin.source);
  // motion-safety-old-player:start
  const oldManifest=JSON.parse(execFileSync('git',['show','a0df5f3d4df65f6d45ea6e6d71d6a196c22b51ef:atlas-review/manifest.json'],
    {maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString());
  const oldEntry=oldManifest.files.find((f:any)=>f.path==='app/regional-guided-learning.tsx');assert(oldEntry);
  assert.equal(oldEntry.sourceSha256,'74f623f4d0cea33566b40e5278780a31a2618523631dcadbcee86436c35aadeb');
  const oldPlayer=execFileSync('git',['show','a0df5f3d4df65f6d45ea6e6d71d6a196c22b51ef:atlas-review/app/regional-guided-learning.tsx'],
    {maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(createHash('sha256').update(oldPlayer).digest('hex'),oldEntry.importedSha256);
  // motion-safety-old-player:end
  for(const path of ['app/regional-guided-learning.tsx','lib/anatomy-load-retry.ts','app/body-scene.tsx']){
    const record=review.files.find((f:any)=>f.path===path);assert.ok(record,path);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,record.sourceSha256,path);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),record.importedSha256,path);
    const source=execFileSync('git',['show',pin.source+':'+path],{...gitOptions,cwd:currentAtlas});
    assert.equal(sha(source),record.sourceSha256,path);
    const previous=historicalReview.files.find((f:any)=>f.path===path);assert.ok(previous,path);
    assert.equal(sha(websiteBytes('atlas-review/'+path)),previous.importedSha256,path);
    assert.equal(historicalInputs.find((f:any)=>f.path===path)?.sha256,previous.sourceSha256,path);
    assert.equal(sha(execFileSync('git',['show',featureSource+':'+path],{...gitOptions,cwd:currentAtlas})),previous.sourceSha256,path);
  }
  assert.equal(historicalInputs.find((f:any)=>f.path==='app/regional-guided-learning.tsx').sha256,
    'f4c0d9d484a2b4a8ee2e4e258cf20e38b433d188e8123bbd673c5e67c1e40fb3');
  const changedInputs=structuredClone(inputs);
  changedInputs.find((f:any)=>f.path==='app/regional-guided-learning.tsx').sha256='0'.repeat(64);
  assert.throws(()=>validateCurrentAtlasDelivery({pin,read:(path:string)=>path===base+'source-inputs.json'?Buffer.from(JSON.stringify(changedInputs)):readFileSync(path)}),/Current delivery changed: public\/atlas-runtime\/head-neck\/source-inputs.json/);
  assert(historicalLearner.regionalScopes.some((scope:any)=>scope.region==='whole-body'));
  assert(learner.regionalScopes.some((scope:any)=>scope.region==='whole-body'));
  const historicalCompiled=historicalLearner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{const bytes=websiteBytes(base+f.path);assert.equal(sha(bytes),f.sha256,f.path);return bytes.toString();}).join('\n');
  for(const text of ['Retry the missing anatomy to continue.','data-tour-resume','The retry could not start. Try again when the connection returns.'])assert(historicalCompiled.includes(text),text);
  assert(!historicalCompiled.includes('Some anatomy failed to load. Exit and reload the atlas before retrying.'));
  const compiled=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  for(const text of ['Retry the missing anatomy to continue.','data-tour-resume','The retry could not start. Try again when the connection returns.'])assert(compiled.includes(text),text);
  assert(!compiled.includes('Some anatomy failed to load. Exit and reload the atlas before retrying.'));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(learner[flag],false);
});
