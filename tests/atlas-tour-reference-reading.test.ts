import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Behaviour is exercised by the Atlas actual-component/session suite and the
// embedded browser journey; this gate proves those exact players reach both hosts.
test('reference-reading pause reaches both learner modules and protected review',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,'6149a26a1fd1ae74782f93be77856a1c1de08b86');
 for(const [module,path,sourceHash,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','cb8a94094e8dde630c3bf24e9ae27a18e0239307388fbffd2a81b5e2cf18657e','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','90d4a7d2bbbae7c9abc0676a40e597be8b26fa7ed49fc2db2306ae7759ab48e5','if(event.currentTarget.open){setPlaying(false);setMotionPaused(true);}'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,review.revision);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sourceHash);
  assert.equal(record.sourceSha256,sourceHash);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(createHash('sha256').update(imported).digest('hex'),record.importedSha256);
  assert(imported.toString().includes(handler));
  for(const f of learner.files){const bytes=readFileSync(base+f.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);}
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
});
