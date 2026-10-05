import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

test('regional and whole-body learners deliver the verified source-bound tour recovery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(learner.sourceCommit,'4ee8d5273bc325e7f27494e27d0b704b0565f2b8');
  assert.equal(review.revision,'4ee8d5273bc325e7f27494e27d0b704b0565f2b8');
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
  }
  assert.equal(inputs.find((f:any)=>f.path==='app/regional-guided-learning.tsx').sha256,
    'fa41afd1de2558b5eae3e9445911b6cf6538f6f5df9571835a40aa786157b9e0');
  assert(learner.regionalScopes.some((scope:any)=>scope.region==='whole-body'));
  const compiled=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  for(const text of ['Retry the missing anatomy to continue.','data-tour-resume','The retry could not start. Try again when the connection returns.'])assert(compiled.includes(text),text);
  assert(!compiled.includes('Some anatomy failed to load. Exit and reload the atlas before retrying.'));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(learner[flag],false);
});
