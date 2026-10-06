import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// Behaviour is exercised by the Atlas actual-component/session suite and the
// embedded browser journey; this gate proves those exact players reach both hosts.
test('reference-reading pause reaches both learner modules and protected review',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,'e3e292f234d4e9e9c96903a67703f9ec92678626');
 // motion-safety-old-player:start
 const oldManifest=JSON.parse(execFileSync('git',['show','a0df5f3d4df65f6d45ea6e6d71d6a196c22b51ef:atlas-review/manifest.json'],
  {maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString());
 const oldEntry=oldManifest.files.find((f:any)=>f.path==='app/regional-guided-learning.tsx');assert(oldEntry);
 assert.equal(oldEntry.sourceSha256,'74f623f4d0cea33566b40e5278780a31a2618523631dcadbcee86436c35aadeb');
 const oldPlayer=execFileSync('git',['show','a0df5f3d4df65f6d45ea6e6d71d6a196c22b51ef:atlas-review/app/regional-guided-learning.tsx'],
  {maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(createHash('sha256').update(oldPlayer).digest('hex'),oldEntry.importedSha256);
 // motion-safety-old-player:end
 for(const [module,path,sourceHash,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','0fb1f95ec82c2323b4bc01372fd5e7938c090df8a4b8513f8929c672cfde6740','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','f4c0d9d484a2b4a8ee2e4e258cf20e38b433d188e8123bbd673c5e67c1e40fb3','if(event.currentTarget.open)revokePlayback();'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,'e3e292f234d4e9e9c96903a67703f9ec92678626');
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sourceHash);
  assert.equal(record.sourceSha256,sourceHash);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(createHash('sha256').update(imported).digest('hex'),record.importedSha256);
  assert(imported.toString().includes(handler));
  for(const f of learner.files){const bytes=readFileSync(base+f.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);}
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
});
