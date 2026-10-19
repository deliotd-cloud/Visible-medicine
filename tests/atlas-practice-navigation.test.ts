import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {currentNonregionalAtlasSources,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,assertCurrentAtlasInput,assertHistoricalAtlasInputs} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const historicalSourceBindings={
  "app/practice-panel-navigation.tsx": "e02be0b9fe8f12c2b52b27205880ae6a20d12bbf506cf91ce83cc36f352cf808",
  "app/body-explorer.tsx": "2dad1c22dfec424db6a4cdf578cb4f9cafe6a0e3295f95ed7d3318976aa62dc0"
};

test('shared practice exports tested focus navigation without changing model inventory',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const bytes=readFileSync(base+'manifest.json');
  assert.equal(sha(bytes),validateCurrentAtlasDelivery().documents['public/atlas-runtime/head-neck/manifest.json']);
  const manifest=JSON.parse(bytes.toString());
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  for(const path of Object.keys(historicalSourceBindings))assertCurrentAtlasInput(inputs,path);
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const marker of ['data-practice-question','data-practice-feedback','preventScroll','aria-describedby'])assert.ok(runtime.includes(marker),marker);
  const before=JSON.parse(execFileSync('git',['show','f9f4cba3b42f5c57ebff02745287f31177e24fee:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),currentNonregionalAtlasSources);
  assert.equal(current.models.length,137);
});


test('historical practice-navigation source-input hashes remain exact at the saved website export',()=>{
  assertHistoricalAtlasInputs(historicalSourceBindings);
});
