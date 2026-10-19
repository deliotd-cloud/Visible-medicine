import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
// Freeze this historical connection delivery; newer tour changes are tested separately.
const json=(path:string)=>JSON.parse(execFileSync('git',['show','a5ed52c:'+path],{encoding:'utf8'}));
const prior=(path:string)=>JSON.parse(execFileSync('git',['show','e63af48:'+path],{encoding:'utf8'}));
const sha=(path:string)=>createHash('sha256').update(execFileSync('git',['show','a5ed52c:'+path],{maxBuffer:32e6})).digest('hex');

test('historical eye and component Education parity changed only its declared connection dependency closure',()=>{
 const before=prior('atlas-review/manifest.json'),after=json('atlas-review/manifest.json');
 assert.equal(after.revision,'b65b8c40bd3fb428b2b4688c695039e2e3a3554c');
 const changed=after.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256);
 assert.deepEqual(changed.map((f:any)=>f.path).sort(),[
  'app/body-explorer.tsx','app/eye-layers.tsx','app/femoral-components.tsx','app/ventricles.tsx',
  'lib/nested-education-binding.ts',
 ]);
 assert.equal(after.files.length,before.files.length);
 for(const file of changed)assert.equal(sha('atlas-review/'+file.path),file.importedSha256);
 const regional=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of ['app/nested-education-link.ts','lib/nested-education-binding.ts','lib/root-education-api.ts']){
  assert.equal(regional.find((f:any)=>f.path===path)?.sha256,after.files.find((f:any)=>f.path===path)?.sourceSha256);
 }
 assert.equal(after.files.some((f:any)=>f.path==='content/learning-resources.v1.json'),false,'No case registry is imported by the connection');
});

test('historical nested connection preserved model bytes, notices, scope and publication gates',()=>{
 for(const module of ['head-neck','shoulder']){
  const path='public/atlas-runtime/'+module+'/manifest.json',before=prior(path),after=json(path);
  assert.equal(after.sourceCommit,'b65b8c40bd3fb428b2b4688c695039e2e3a3554c');
  const retained=(f:any)=>f.path.endsWith('.glb')||f.path==='BUNDLED_NOTICES.txt'||f.path==='bundled-dependencies.json'||f.path.includes('credits');
  assert.deepEqual(after.files.filter(retained),before.files.filter(retained));
  for(const file of after.files.filter(retained))assert.equal(sha('public/atlas-runtime/'+module+'/'+file.path),file.sha256);
  assert.deepEqual(after.modelBundles,before.modelBundles);
  assert.deepEqual(after.regionalScopes,before.regionalScopes);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(after[flag],false);
 }
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
});
