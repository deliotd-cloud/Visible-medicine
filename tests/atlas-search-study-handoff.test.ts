import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('shared viewer exports the verified unobstructed Search handoff without anatomy changes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'2bba43e74ecc65bc1f401b74add346bfc6f9689e7a2a94037d6c307b2af7d6a4');
  assert.equal(manifest.sourceCommit,'5e3667fe3c9f012cbc21e679ba2e834f527dcc3f');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(i=>i.path==='app/atlas-workspace.tsx'),[{path:'app/atlas-workspace.tsx',sha256:'e8a1ac9aaf77f0745c872a61686af3e454bbe59274e937237d6daa72761a3b28'}]);
  assert.ok(!inputs.some(i=>/native-mr|local-mr-study|renal-segmental|\.vmmr/i.test(i.path)));
  for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
  const before=JSON.parse(execFileSync('git',['show','da3b8666644a557604d141dbecdc8338eb85fb06:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),before.sources.filter((s:{module:string})=>s.module!=='head-neck'));
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
});
