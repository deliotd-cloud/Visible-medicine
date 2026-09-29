import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const prior=(path:string)=>JSON.parse(execFileSync('git',['show','0c608b3:'+path],{encoding:'utf8'}));
const sha=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

test('nested Education import changes only its declared connection dependency closure',()=>{
 const before=prior('atlas-review/manifest.json'),after=json('atlas-review/manifest.json');
 assert.equal(after.revision,'d1dc51ed38502b557b8ae04aae295e20dc5f7317');
 const changed=after.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256);
 assert.deepEqual(changed.map((f:any)=>f.path).sort(),[
  'app/body-explorer.tsx','app/imaging-link.tsx','app/nested-education-link.ts','app/ventricles.tsx',
  'lib/learning-anatomy.ts','lib/nested-education-binding.ts','lib/nested-learning-anatomy.ts','lib/root-education-api.ts',
 ]);
 assert.equal(after.files.length,before.files.length+4);
 for(const file of changed)assert.equal(sha('atlas-review/'+file.path),file.importedSha256);
 const regional=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of ['app/nested-education-link.ts','lib/nested-education-binding.ts','lib/root-education-api.ts']){
  assert.equal(regional.find((f:any)=>f.path===path)?.sha256,after.files.find((f:any)=>f.path===path)?.sourceSha256);
 }
 assert.equal(after.files.some((f:any)=>f.path==='content/learning-resources.v1.json'),false,'No case registry is imported by the connection');
});

test('nested connection preserves all existing model bytes, notices, scope and publication gates',()=>{
 for(const module of ['head-neck','shoulder']){
  const path='public/atlas-runtime/'+module+'/manifest.json',before=prior(path),after=json(path);
  assert.equal(after.sourceCommit,'d1dc51ed38502b557b8ae04aae295e20dc5f7317');
  const retained=(f:any)=>f.path.endsWith('.glb')||f.path==='BUNDLED_NOTICES.txt'||f.path==='bundled-dependencies.json'||f.path.includes('credits');
  assert.deepEqual(after.files.filter(retained),before.files.filter(retained));
  for(const file of after.files.filter(retained))assert.equal(sha('public/atlas-runtime/'+module+'/'+file.path),file.sha256);
  assert.deepEqual(after.modelBundles,before.modelBundles);
  assert.deepEqual(after.regionalScopes,before.regionalScopes);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(after[flag],false);
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
});
