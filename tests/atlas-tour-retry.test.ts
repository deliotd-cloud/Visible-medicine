import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('regional and whole-body learners deliver the verified source-bound tour recovery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(learner.sourceCommit,'6888a898281695faf9e41bdf34a7d3c771c4f7f2');
  assert.equal(review.revision,'6888a898281695faf9e41bdf34a7d3c771c4f7f2');
  for(const path of ['app/regional-guided-learning.tsx','lib/anatomy-load-retry.ts','app/body-scene.tsx']){
    const record=review.files.find((f:any)=>f.path===path);assert.ok(record,path);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,record.sourceSha256,path);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),record.importedSha256,path);
  }
  assert.equal(inputs.find((f:any)=>f.path==='app/regional-guided-learning.tsx').sha256,
    'a5bdbb67088765d8b7f0c179199c9ac4f819a7ae0e58fc7e8925f676b3db6a52');
  assert(learner.regionalScopes.some((scope:any)=>scope.region==='whole-body'));
  const compiled=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  for(const text of ['Retry the missing anatomy to continue.','data-tour-resume','The retry could not start. Try again when the connection returns.'])assert(compiled.includes(text),text);
  assert(!compiled.includes('Some anatomy failed to load. Exit and reload the atlas before retrying.'));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(learner[flag],false);
});
