import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Behaviour is exercised by the Atlas actual-component/session suite and the
// embedded browser journey; this gate proves those exact players reach both hosts.
test('reference-reading pause reaches both learner modules and protected review',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,'c5c99ba11e6533d306587e71f5fc2854d882fbd6');
 for(const [module,path,sourceHash,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','0fb1f95ec82c2323b4bc01372fd5e7938c090df8a4b8513f8929c672cfde6740','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','74f623f4d0cea33566b40e5278780a31a2618523631dcadbcee86436c35aadeb','if(event.currentTarget.open){setPlaying(false);setMotionPaused(true);}'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,'c5c99ba11e6533d306587e71f5fc2854d882fbd6');
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sourceHash);
  assert.equal(record.sourceSha256,sourceHash);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(createHash('sha256').update(imported).digest('hex'),record.importedSha256);
  assert(imported.toString().includes(handler));
  for(const f of learner.files){const bytes=readFileSync(base+f.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);}
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
});
