import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {currentNonregionalAtlasSources,CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery,assertCurrentAtlasInput,assertHistoricalAtlasInputs} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import test from 'node:test';

const historicalSourceBindings={
  "app/atlas-workspace.tsx": "fb0b89748213755782a9eeb4522193425e912da976020249eaa80ecb56ef653d"
};

test('shared viewer exports the verified unobstructed Search handoff without anatomy changes',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),validateCurrentAtlasDelivery().documents['public/atlas-runtime/head-neck/manifest.json']);
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  assertCurrentAtlasInput(inputs,'app/atlas-workspace.tsx');
  assert.ok(!inputs.some(i=>/native-mr|local-mr-study|renal-segmental|\.vmmr/i.test(i.path)));
  for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
  const before=JSON.parse(execFileSync('git',['show','da3b8666644a557604d141dbecdc8338eb85fb06:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),currentNonregionalAtlasSources);
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
});


test('historical search-study-handoff source-input hashes remain exact at the saved website export',()=>{
  assertHistoricalAtlasInputs(historicalSourceBindings,'navigation');
});
