import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('regional delivery binds the verified Search/session transition without expanding access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  const manifest=JSON.parse(bytes.toString());
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const registered=inventory.sources.find((s:{module:string})=>s.module==='head-neck');
  assert(registered);
  assert.equal(sha(bytes),registered.manifestSha256);
  assert.equal(manifest.sourceCommit,registered.sourceCommit);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of [
    ['app/atlas-workspace.tsx','dddafc036e20e23b1048c0be494df62cd6eb794ffbb7a6a6423bd74bf8c0cdbd'],
    ['app/body-explorer.tsx','a4cdbd814df2ee08a4fc158e70d377c378f4e2849870d8ffb7d89d0894658e09'],
    ['app/workspace-session.ts','7a2a73775b9eebebc50df257cc520f2f33499ebb7130f496a4b2cdfb46fc379a'],
  ])assert.deepEqual(inputs.filter(i=>i.path===path),[{path,sha256}]);
  assert(!inputs.some(i=>/test-study-mode|study-history|\.transition\.json|\.local\//.test(i.path)));
  assert.equal(inventory.models.length,136);
  assert.equal(inventory.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])
    assert.equal(manifest[flag],false);
});
