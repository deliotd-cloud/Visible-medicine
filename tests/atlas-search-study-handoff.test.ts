import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';

test('shared viewer exports the verified unobstructed Search handoff without anatomy changes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'b1882ae6c46033bc331052226c9bc407f49132ad475620eb9bd16142ab49e798');
  assert.equal(manifest.sourceCommit,'0931b2da1151f04a2b6f0f623252879588178e08');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(i=>i.path==='app/atlas-workspace.tsx'),[{path:'app/atlas-workspace.tsx',sha256:'849c48b446c6a174e3a7f4beb4fc8a1dabae628ba21b4def75e02b5d9b6e9f26'}]);
  assert.ok(!inputs.some(i=>/native-mr|local-mr-study|renal-segmental|\.vmmr/i.test(i.path)));
  for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
  const before=JSON.parse(execFileSync('git',['show','da3b8666644a557604d141dbecdc8338eb85fb06:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),before.sources.filter((s:{module:string})=>s.module!=='head-neck'));
  assert.equal(current.models.length,136);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,143);
});
