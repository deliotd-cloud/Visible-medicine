import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('contained review correction ships exact tested inputs without changing model delivery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'567f5f38c5e1d1b8ec56bda4230429b1dfce383e75701df2f1c65fba5d7dea1c');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'c97c2b0b200ab1813a510ef65355fa2b45d05499');
  assert.equal(manifest.standaloneReviewConnection,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/eye-layers.tsx':'3efe67855495116b5e75ccd14c0737fbd814ae0192633a6080f9d83bae9ecfbc',
    'app/femoral-components.tsx':'adedfcc6a51b584908e5813c57b33b873c2b4ec60b70750837aa54e33c10764e',
    'app/nested-teaching.tsx':'502e0a1d13c65875963bc760ca01260bde329368fe6d3bf4162f98cf3de42744',
    'app/ventricles.tsx':'5f25c4d966c8d8ca5ca52fa1bb59e32fa62a942a2a03b63717e5be1d3b2ff396',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const before=JSON.parse(execFileSync('git',['show','93ff7b0f798fb3b788684ee38462326b46d44eb3:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models,'all model hashes, byte lengths and protected paths remain identical');
  assert.ok(Array.isArray(current.models) && current.models.length===137);
});
