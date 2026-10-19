import {CURRENT_ATLAS_REVISION,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {historicalNonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';
const saved='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const old=(path:string)=>execFileSync('git',['show',`${saved}:${path}`],{maxBuffer:32e6});

test('named femoral clinical drafts retain exact source inputs, model limits and independent access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=old(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(sha(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(old(base+'source-inputs.json').toString()) as {path:string;sha256:string}[];
  assert.deepEqual(inputs.filter(input=>input.path==='content/femoral-component-teaching.ts'),[
    {path:'content/femoral-component-teaching.ts',sha256:'5f52d9e615dfd8f842a705b630c37b67ec396fb92b3a53dbf02d19de91320b31'},
  ]);
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(f=>f.path.endsWith('.js')).map(f=>{
    const data=old(base+f.path);assert.equal(sha(data),f.sha256);return data.toString();
  }).join('\n');
  for(const marker of [
    'The selected lateral circumflex femoral component provides parent-vessel context for anterolateral thigh flap anatomy.',
    'No pseudoaneurysm, wall defect, bleeding, fracture or implant is represented in this reference model.',
    'Component-specific clinical teaching awaits review.',
    'https://pubmed.ncbi.nlm.nih.gov/29922539/',
    'https://aott.org.tr/index.php/pub/article/view/4018',
    'Atlas, case and paid-lecture access remain independent.',
  ])assert.ok(runtime.includes(marker),marker);
  const previous=JSON.parse(execFileSync('git',['show','9d9106d3066cda7bf8359db98d29eed1fce94a28:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(old('lib/atlas-model-inventory.json').toString());
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  const originalSources=JSON.parse(execFileSync('git',['show','8d4d4aba:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  assert.deepEqual(originalSources.sources.filter((s:{module:string})=>s.module!=='head-neck'),historicalNonregionalAtlasSources);
  assert.deepEqual(current.sources.filter((s:{module:string;modelPaths:number})=>s.module!=='head-neck').map((s:{module:string;modelPaths:number})=>[s.module,s.modelPaths]),historicalNonregionalAtlasSources.map(s=>[s.module,s.modelPaths]));
  assert.equal(current.models.length,137);
  assert.equal(current.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});

test('current femoral clinical import retains source, emitted code, models and independent access',()=>{
  const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
  const source=CURRENT_ATLAS_REVISION;
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,source);
  const path='content/femoral-component-teaching.ts';
  const input=json('public/atlas-runtime/head-neck/source-inputs.json').find((f:{path:string})=>f.path===path);
  const imported=review.files.find((f:{path:string})=>f.path===path);
  assert.ok(input&&imported);
  assert.equal(input.sha256,imported.sourceSha256);
  assert.equal(input.sha256,sha(execFileSync('git',['-C','F:/VisibleMedicine/atlas','show',`${source}:${path}`])));
  assert.equal(imported.importedSha256,sha(readFileSync('atlas-review/'+path)));
  const inventory=json('lib/atlas-model-inventory.json');
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
  for(const entry of inventory.sources as {module:string;sourceCommit:string;manifestSha256:string}[]){
    const base=`public/atlas-runtime/${entry.module}/`;
    const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
    assert.equal(entry.sourceCommit,source,entry.module);
    assert.equal(manifest.sourceCommit,source,entry.module);
    assert.equal(entry.manifestSha256,sha(bytes),entry.module);
    for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
    for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection'])assert.equal(manifest[flag],false,entry.module+':'+flag);
    assert.equal(manifest.imagingConnection,entry.module==='shoulder'?undefined:false,entry.module+':imagingConnection');
  }
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal(ATLAS_DELIVERY_POLICY.manifestRevision,sha(readFileSync('lib/atlas-model-inventory.json')));
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});
