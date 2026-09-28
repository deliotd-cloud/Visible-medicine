import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('shared viewer exports the verified unobstructed Search handoff without anatomy changes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'ce62c7db739c92a6cc9e018e63ed9dd2e60e75105480efa22787e10c466b5613');
  assert.equal(manifest.sourceCommit,'7d584505c79d94a5b19c44fed0b75f2f7d57d424');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(i=>i.path==='app/atlas-workspace.tsx'),[{path:'app/atlas-workspace.tsx',sha256:'3492d74682daa945418e97a7e8130cae62907e4c7f67285c99196b329f79b104'}]);
  assert.ok(!inputs.some(i=>/native-mr|local-mr-study|renal-segmental|\.vmmr/i.test(i.path)));
  for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
  const before=JSON.parse(execFileSync('git',['show','da3b8666644a557604d141dbecdc8338eb85fb06:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
});
