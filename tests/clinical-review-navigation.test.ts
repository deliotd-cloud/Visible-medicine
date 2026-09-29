import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

test('sequential review changes only the body review interface, not clinical source material',()=>{
 const before=JSON.parse(execFileSync('git',['show','ff3502a:atlas-review/manifest.json'],{encoding:'utf8'}));
 const after=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const changed=after.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort();
 assert.deepEqual(changed,['app/review/body/body-review.css','app/review/body/review-dashboard.tsx']);
 assert.equal(after.files.length,before.files.length);
 for(const path of changed){const f=after.files.find((f:any)=>f.path===path);assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),f.importedSha256);}
 const dashboard=readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8');
 assert.ok(dashboard.includes('Previous structure')&&dashboard.includes('Next structure'));
 assert.ok(dashboard.includes('if (id === selected) return;'));
 assert.ok(dashboard.includes('index < 0 || !canLeave()'));
 assert.ok(dashboard.includes('setPage(Math.floor(index / 20))'));
 assert.ok(dashboard.includes('clinicalReviewFetch(`/api/atlas-review/body-review?structure='));
 assert.ok(!dashboard.includes("method: 'POST'"));
});

test('review navigation leaves all learner assets and model bytes unchanged',()=>{
 for(const module of ['head-neck','shoulder']){
  const path='public/atlas-runtime/'+module+'/manifest.json';
  const before=JSON.parse(execFileSync('git',['show','ff3502a:'+path],{encoding:'utf8'}));
  const after=JSON.parse(readFileSync(path,'utf8'));
  assert.deepEqual(after.files,before.files,'Re-exported learner dependency graph and assets are byte-identical');
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(after[flag],false);
 }
});
