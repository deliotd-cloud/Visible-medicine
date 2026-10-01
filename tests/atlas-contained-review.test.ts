import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('contained review correction ships exact tested inputs without changing model delivery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'6d0fcf5d58943d69e78176085491a7c1b2ce4253a94a16c7f3fe358b17e81b32');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'33566ee21aa65ed1a370a5e7653337048656a13e');
  assert.equal(manifest.standaloneReviewConnection,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/eye-layers.tsx':'dc85935898d81d5b6a1c17b750f7ae7b52893dda8c1082e200859a74ec61d675',
    'app/femoral-components.tsx':'0bcd8922fb70204b272a1083c67a6bfda8b3af20eb20f870ef19be0700aa05ae',
    'app/nested-teaching.tsx':'502e0a1d13c65875963bc760ca01260bde329368fe6d3bf4162f98cf3de42744',
    'app/ventricles.tsx':'08a2c1cd5d64cb9072d8fe80f2d95a40a7eb0611a2071043db45bc4a8f6f7ed0',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  const before=JSON.parse(execFileSync('git',['show','93ff7b0f798fb3b788684ee38462326b46d44eb3:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models,'all model hashes, byte lengths and protected paths remain identical');
  assert.ok(Array.isArray(current.models) && current.models.length===137);
});
