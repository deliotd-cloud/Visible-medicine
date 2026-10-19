import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {currentNonregionalAtlasSources,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,assertCurrentAtlasInput,assertHistoricalAtlasInputs} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const historicalSourceBindings={
  "app/dissection-data.ts": "e4612894eda280188f24aa96ea4095795ead893ff5509a4e07d0389a5623e6e4",
  "content/posterior-mediastinal-study.ts": "d07a11bda4ab63ad6ba2098efa80d5afa676aece071352599385b37549516924"
};

test('posterior mediastinal study ships with exact sources and no new assets or access',()=>{
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
  for(const marker of ['posterior-mediastinal-conduits','Posterior mediastinum: oesophagus & vessels',
    'FMA7131','FMA87217','FMA4838','FMA4944','Both left and right side filters retain all four targets',
    'No joined lumen or complete mediastinum','source boundaries and relationships await revision-bound radiologist review'])assert.ok(runtime.includes(marker),marker);
  const before=JSON.parse(execFileSync('git',['show','d9ae25cfbeb161bcbae00afb20b96d943fb93eaf:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),currentNonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
});


test('historical posterior-mediastinal source-input hashes remain exact at the saved website export',()=>{
  assertHistoricalAtlasInputs(historicalSourceBindings);
});
