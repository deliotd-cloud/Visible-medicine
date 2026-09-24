import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('contained review correction ships exact tested inputs without changing model delivery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'8d6b7cbf56b231b06ddaa1426952c09707ab6e9aa321f4161dd5410f0ce53bf4');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'05b799f8a6f6830a7dd2ec51751507017973d4d3');
  assert.equal(manifest.standaloneReviewConnection,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/eye-layers.tsx':'3efe67855495116b5e75ccd14c0737fbd814ae0192633a6080f9d83bae9ecfbc',
    'app/femoral-components.tsx':'adedfcc6a51b584908e5813c57b33b873c2b4ec60b70750837aa54e33c10764e',
    'app/nested-teaching.tsx':'502e0a1d13c65875963bc760ca01260bde329368fe6d3bf4162f98cf3de42744',
    'app/ventricles.tsx':'56f6eba3b7f735be290f436958194b12cc5c0f4266c2c6d4ecbb879d84e4d405',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const before=JSON.parse(execFileSync('git',['show','93ff7b0f798fb3b788684ee38462326b46d44eb3:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(current.models,before.models,'all model hashes, byte lengths and protected paths remain identical');
  assert.ok(Array.isArray(current.models) && current.models.length===136);
});
