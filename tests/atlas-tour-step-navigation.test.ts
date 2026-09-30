import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';

test('both website tour players deliver the same pause-safe step picker without changing teaching',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 for(const module of ['head-neck','shoulder']){
  const base='public/atlas-runtime/'+module+'/',manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,'eb6031b48e00faec4894c180f4c0d5a680847224');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  for(const path of ['app/tour-step-picker.tsx','app/tour-step-picker.css']){
   const file=review.files.find((f:any)=>f.path===path);assert.ok(file);
   assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
   assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
  }
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  assert.ok(js.includes('Go to tour step'));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
 }
 for(const path of ['lib/regional-tours.ts','lib/shoulder-tours.ts','lib/subscapular-tour.ts']){
  const prior=execFileSync('git',['show','6c7524e:atlas-review/'+path],{encoding:'utf8'}).replace(/\r/g,'');
  const delivered=execFileSync('git',['show','ff3502a:atlas-review/'+path],{encoding:'utf8'}).replace(/\r/g,'');
  assert.equal(delivered,prior,'The historical step-picker delivery did not change tour teaching; later tours have separate coverage');
 }
 const picker=readFileSync('atlas-review/app/tour-step-picker.tsx','utf8');
 assert.ok(picker.includes('disabled={!ready}'));assert.ok(picker.includes('onPause();onStep(next)'));
 assert.ok(picker.includes("if(next<0||next===index)return"));
 for(const path of ['app/regional-guided-learning.tsx','app/shoulder-tour-player.tsx'])assert.ok(readFileSync('atlas-review/'+path,'utf8').includes('<TourStepPicker'));
});
