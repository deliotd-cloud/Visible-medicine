import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
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
  assert.equal(sha(bytes),'6565ac859dd3aeaa39b88887e1021dea0cc4613bb74762b52de2500be58d5c05');
  assert.equal(manifest.sourceCommit,'8386fa7e3c17c7a6da67d6a511604e95f31fdebb');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(i=>i.path==='app/atlas-workspace.tsx'),[{path:'app/atlas-workspace.tsx',sha256:'3492d74682daa945418e97a7e8130cae62907e4c7f67285c99196b329f79b104'}]);
  assert.ok(!inputs.some(i=>/native-mr|local-mr-study|renal-segmental|\.vmmr/i.test(i.path)));
  for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
  const before=JSON.parse(execFileSync('git',['show','da3b8666644a557604d141dbecdc8338eb85fb06:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});
