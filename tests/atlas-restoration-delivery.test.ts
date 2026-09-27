import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('regional and whole-body delivery contains tested restoration and source-bound drafts',()=>{
  const base='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.equal(manifest.sourceCommit,'14581a6e2cbf82d8d57e98290c7d7b63c5bf3cb1');
  for(const [path,hash] of Object.entries({
    'app/body-explorer.tsx':'d48fba0a93e73bd9362cecb26c95a5ef8e3d21babdd20fcac622cca7e735c325',
    'content/achilles-ct.ts':'90957fbb728c1b72aa29b5db1f0aca01269035d49022d93d3fe5bf413a05cd21',
    'content/foot-vascular-quiz.ts':'3dc9fd1aa39ea472ea2d01b3e682a02524fdd902da2e44a71b3132714759bde9',
    'lib/foot-vascular-quiz.ts':'df617fe8a552a1d0b808c212497c77c879a18192a4094e269a4e0d94fc3eb791',
  })) assert.equal(inputs.find(f=>f.path===path)?.sha256,hash,path);
  assert.equal(manifest.regionalScopes.length,12);
  assert.equal(manifest.regionalScopes.find((s:{region:string})=>s.region==='whole-body').regionalIds.length,1104);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  for(const file of manifest.files)assert.equal(createHash('sha256').update(readFileSync(base+file.path)).digest('hex'),file.sha256,file.path);
  // Exact source and artifact evidence above; actual interaction behavior is
  // exercised by the Atlas handler tests and the integrated browser acceptance.
});
