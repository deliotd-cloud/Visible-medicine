import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {currentNonregionalAtlasSources,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,assertCurrentAtlasInput,assertHistoricalAtlasInputs} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const historicalSourceBindings={
  "app/dissection-data.ts": "e4612894eda280188f24aa96ea4095795ead893ff5509a4e07d0389a5623e6e4",
  "content/thoracic-hilar-study.ts": "29337537b45c066543ef0ee4010c4d6dfe2ca985b09726f3fc894535c34c4ac8"
};

test('shared runtime carries both source-pinned pulmonary-hilar studies without new assets or access',()=>{
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
  for(const marker of ['right-pulmonary-hilum','left-pulmonary-hilum',
    'Right pulmonary hilum: bronchus & vessels','Left pulmonary hilum: bronchus & vessels',
    'FMA7395','FMA7396','FMA50872','FMA50873','FMA49914','FMA49916','FMA49911','FMA49913',
    'joined lumen or ostia','revision-bound radiologist review'])assert.ok(runtime.includes(marker),marker);
  const before=JSON.parse(execFileSync('git',['show','910edaccb90328881614f582bc99e8416627f5b7:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),currentNonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
});


test('historical pulmonary-hilar source-input hashes remain exact at the saved website export',()=>{
  assertHistoricalAtlasInputs(historicalSourceBindings);
});
