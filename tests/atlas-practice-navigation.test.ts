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
  assert.equal(sha(bytes),'f6be93dbff8c9ac4a98502633444c7ca220ee4f863af14c3ec390f8bc2e33bfa');
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,'9ddeaed1a045cc86aeda7ac40d0dd48bf6a405b1');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const [path,sha256] of Object.entries({
    'app/practice-panel-navigation.tsx':'e02be0b9fe8f12c2b52b27205880ae6a20d12bbf506cf91ce83cc36f352cf808',
    'app/body-explorer.tsx':'6e93637ab53c186a8513a0314fd5d8fdfacbf6665e1443d3b6a31f6b411b9ba9',
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
