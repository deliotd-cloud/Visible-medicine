import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('shared practice exports tested focus navigation without changing model inventory',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),'5d9ff7d9ab6b1a3965a20a96ba5b5a1a085ada4d8e0d40e55f929ba2781f4cf3');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'8cfd73cda5077ea608720c3c4d88d8e51371e2ef');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/practice-panel-navigation.tsx':'e02be0b9fe8f12c2b52b27205880ae6a20d12bbf506cf91ce83cc36f352cf808',
    'app/body-explorer.tsx':'d6e7ebbe87a4325a84d3a0241b788edcf23e6dae7ec6e3c3f6c15875abf6ad57',
  }))assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256}]);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const marker of ['data-practice-question','data-practice-feedback','preventScroll','aria-describedby'])assert.ok(runtime.includes(marker),marker);
  const before=JSON.parse(execFileSync('git',['show','f9f4cba3b42f5c57ebff02745287f31177e24fee:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
  assert.equal(current.models.length,137);
});
