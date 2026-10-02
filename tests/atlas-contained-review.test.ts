import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('contained review correction ships exact tested inputs without changing model delivery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'40e364dfd2dd5cf146efdf6fe56674ae0f0d2d1cb0cef4a18ff295a6babf25aa');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'24e82d38d226eac294ffa5f3a922448f4904cec0');
  assert.equal(manifest.standaloneReviewConnection,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/eye-layers.tsx':'61138f2e48a41702e3ee0516a6c7e74bf4f8182cc389773740748cc384a06098',
    'app/femoral-components.tsx':'0bcd8922fb70204b272a1083c67a6bfda8b3af20eb20f870ef19be0700aa05ae',
    'app/nested-teaching.tsx':'502e0a1d13c65875963bc760ca01260bde329368fe6d3bf4162f98cf3de42744',
    'app/ventricles.tsx':'08a2c1cd5d64cb9072d8fe80f2d95a40a7eb0611a2071043db45bc4a8f6f7ed0',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const before=JSON.parse(execFileSync('git',['show','93ff7b0f798fb3b788684ee38462326b46d44eb3:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models,'all model hashes, byte lengths and protected paths remain identical');
  assert.ok(Array.isArray(current.models) && current.models.length===137);
});
