import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const sourceRepo=currentAtlasDeliveryRoot();
const current=CURRENT_ATLAS_REVISION;
const oldSource='a10496da94d9d054306bbc48e5ae9c98239d82b5';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const git=(repo:string,revision:string,path:string)=>execFileSync('git',['--no-replace-objects','-C',repo,'show',`${revision}:${path}`],{maxBuffer:32e6});
const json=(bytes:Buffer)=>JSON.parse(bytes.toString());

test('historical reading-focus delivery is bound to its saved Atlas and website epochs',()=>{
 const prior='c285a387';
 const review=json(git('.',prior,'atlas-review/manifest.json'));
 assert.equal(review.revision,oldSource);
 const earlier=json(git('.','a0df5f3d','atlas-review/manifest.json'));
 const oldEntry=earlier.files.find((f:any)=>f.path==='app/regional-guided-learning.tsx');assert(oldEntry);
 assert.equal(oldEntry.sourceSha256,'74f623f4d0cea33566b40e5278780a31a2618523631dcadbcee86436c35aadeb');
 assert.equal(sha(git('.','a0df5f3d','atlas-review/app/regional-guided-learning.tsx')),oldEntry.importedSha256);
 for(const [module,path,sourceHash,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','0fb1f95ec82c2323b4bc01372fd5e7938c090df8a4b8513f8929c672cfde6740','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','f4c0d9d484a2b4a8ee2e4e258cf20e38b433d188e8123bbd673c5e67c1e40fb3','if(event.currentTarget.open)revokePlayback();'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=json(git('.',prior,base+'manifest.json'));
  const inputs=json(git('.',prior,base+'source-inputs.json'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,oldSource);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,sourceHash);
  assert.equal(record.sourceSha256,sourceHash);
  assert.equal(sha(git(sourceRepo,oldSource,path)),sourceHash);
  const imported=git('.',prior,'atlas-review/'+path);
  assert.equal(sha(imported),record.importedSha256);
  assert(imported.toString().includes(handler));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
});

test('current reading-focus handlers reach both learner exports and protected Review',()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,current);
 for(const [module,path,handler] of [
  ['shoulder','app/shoulder-tour-player.tsx','if(event.currentTarget.open)onReadImaging();'],
  ['head-neck','app/regional-guided-learning.tsx','if(event.currentTarget.open)revokePlayback();'],
 ]){
  const base=`public/atlas-runtime/${module}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const record=review.files.find((f:any)=>f.path===path);assert(record,path);
  assert.equal(learner.sourceCommit,current);
  assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,record.sourceSha256);
  assert.equal(sha(git(sourceRepo,current,path)),record.sourceSha256);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(sha(imported),record.importedSha256);
  assert(imported.toString().includes(handler));
  for(const f of learner.files){const bytes=readFileSync(base+f.path);assert.equal(bytes.length,f.bytes);assert.equal(sha(bytes),f.sha256);}
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(learner[flag],false);
 }
});
