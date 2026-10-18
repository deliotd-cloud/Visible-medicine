import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import test from 'node:test';

const sourceRepo=currentAtlasDeliveryRoot();
const current=CURRENT_ATLAS_REVISION;
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const git=(repo:string,revision:string,path:string)=>execFileSync('git',['--no-replace-objects','-C',repo,'show',`${revision}:${path}`],{maxBuffer:32e6});
const json=(bytes:Buffer)=>JSON.parse(bytes.toString());
const pickerGuards=(picker:string)=>{
 assert.ok(picker.includes('disabled={!ready}'));
 assert.ok(picker.includes('if(open&&ready)onPause();'));
 assert.ok(picker.includes("if(!ready||typeof value!=='string')return"));
 assert.ok(picker.includes('if(next<0||next===index)return'));
 assert.ok(picker.includes('onPause();onStep(next)'));
};

test('historical step-picker delivery left tour teaching unchanged',()=>{
 const prior='6c7524e',delivered='ff3502a';
 const review=json(git('.',delivered,'atlas-review/manifest.json'));
 assert.equal(review.revision,'9ddeaed1a045cc86aeda7ac40d0dd48bf6a405b1');
 for(const module of ['head-neck','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(git('.',delivered,base+'manifest.json'));
  const inputs=json(git('.',delivered,base+'source-inputs.json'));
  assert.equal(manifest.sourceCommit,review.revision);
  for(const path of ['app/tour-step-picker.tsx','app/tour-step-picker.css']){
   const file=review.files.find((f:any)=>f.path===path);assert(file,path);
   assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
   assert.equal(sha(git(sourceRepo,review.revision,path)),file.sourceSha256);
   assert.equal(sha(git('.',delivered,'atlas-review/'+path)),file.importedSha256);
  }
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>git('.',delivered,base+f.path).toString()).join('\n');
  assert.ok(js.includes('Go to tour step'));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
 }
 pickerGuards(git('.',delivered,'atlas-review/app/tour-step-picker.tsx').toString());
 for(const path of ['lib/regional-tours.ts','lib/shoulder-tours.ts','lib/subscapular-tour.ts']){
  assert.deepEqual(git('.',delivered,'atlas-review/'+path),git('.',prior,'atlas-review/'+path),`historical tour teaching changed: ${path}`);
 }
});

test('current source, Review, and both learners retain pause-safe step navigation',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,current);
 for(const module of ['head-neck','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.equal(manifest.sourceCommit,current);
  for(const path of ['app/tour-step-picker.tsx','app/tour-step-picker.css']){
   const file=review.files.find((f:any)=>f.path===path);assert(file,path);
   assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256);
   assert.equal(sha(git(sourceRepo,current,path)),file.sourceSha256);
   assert.equal(sha(readFileSync('atlas-review/'+path)),file.importedSha256);
  }
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  assert.ok(js.includes('Go to tour step'));
  for(const f of manifest.files){const bytes=readFileSync(base+f.path);assert.equal(bytes.length,f.bytes);assert.equal(sha(bytes),f.sha256);}
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
 }
 const sourcePicker=git(sourceRepo,current,'app/tour-step-picker.tsx').toString();
 const reviewPicker=readFileSync('atlas-review/app/tour-step-picker.tsx','utf8');
 pickerGuards(sourcePicker);pickerGuards(reviewPicker);
 for(const path of ['app/regional-guided-learning.tsx','app/shoulder-tour-player.tsx']){
  const file=review.files.find((f:any)=>f.path===path);assert(file,path);
  assert.equal(sha(git(sourceRepo,current,path)),file.sourceSha256);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(sha(imported),file.importedSha256);
  assert.ok(imported.toString().includes('<TourStepPicker'));
 }
 assert.ok(reviewPicker.includes('Navigation only: it never marks an unvisited stop as learned or approved.'));
});
