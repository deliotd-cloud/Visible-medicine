import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Behaviour is exercised by the Atlas actual-component/session suite and the
// embedded browser journey; this gate proves those exact players reach both hosts.
test('reference-reading pause reaches both learner modules and protected review',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,'d35fab9730ca5420d7a65f0ba321d8cbfff03571');
 for(const [module,path,sourceHash,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','9999b7e35c90af53815d06fddec2c4082bc5a231685df734e37b074c070638da','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','a5bdbb67088765d8b7f0c179199c9ac4f819a7ae0e58fc7e8925f676b3db6a52','if(event.currentTarget.open){setPlaying(false);setMotionPaused(true);}'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,'d35fab9730ca5420d7a65f0ba321d8cbfff03571');
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sourceHash);
  assert.equal(record.sourceSha256,sourceHash);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(createHash('sha256').update(imported).digest('hex'),record.importedSha256);
  assert(imported.toString().includes(handler));
  for(const f of learner.files){const bytes=readFileSync(base+f.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);}
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
});
