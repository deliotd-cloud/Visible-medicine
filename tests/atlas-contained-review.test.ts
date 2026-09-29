import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('contained review correction ships exact tested inputs without changing model delivery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'9bc502f8747bc92ee658000ff4a7238e2b591f6cecccfb7092dfc335796c9c5b');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'d1dc51ed38502b557b8ae04aae295e20dc5f7317');
  assert.equal(manifest.standaloneReviewConnection,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/eye-layers.tsx':'3efe67855495116b5e75ccd14c0737fbd814ae0192633a6080f9d83bae9ecfbc',
    'app/femoral-components.tsx':'adedfcc6a51b584908e5813c57b33b873c2b4ec60b70750837aa54e33c10764e',
    'app/nested-teaching.tsx':'502e0a1d13c65875963bc760ca01260bde329368fe6d3bf4162f98cf3de42744',
    'app/ventricles.tsx':'f257d94c627dbd6888e1dc7d8709264bf168050f409678a2aae3c2cb3a54b7cc',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const before=JSON.parse(execFileSync('git',['show','93ff7b0f798fb3b788684ee38462326b46d44eb3:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models,'all model hashes, byte lengths and protected paths remain identical');
  assert.ok(Array.isArray(current.models) && current.models.length===137);
});
