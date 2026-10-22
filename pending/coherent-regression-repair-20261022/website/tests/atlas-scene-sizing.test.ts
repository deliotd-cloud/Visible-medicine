import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {historicalNonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';

test('shared regional viewer isolates scene intrinsic size without changing model delivery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const sizingEpoch='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
  const at=(epoch:string,path:string)=>execFileSync('git',['show',`${epoch}:${path}`],{maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const bytes=at(sizingEpoch,base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(hash(bytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(at(sizingEpoch,base+'source-inputs.json').toString());
  assert.deepEqual(inputs.filter((i:{path:string})=>i.path==='app/body-explorer.css'),[
    {path:'app/body-explorer.css',sha256:'315a5cbfeac80620e6f805b82d409a293acdf07869333438b6eb74dbbb3a826f'},
  ]);
  const css=manifest.files.filter((f:{path:string})=>f.path.endsWith('.css')).map((f:{path:string;sha256:string})=>{
    const data=at(sizingEpoch,base+f.path);assert.equal(hash(data),f.sha256);return data.toString();
  }).join('\n');
  assert.ok(/\.body-canvas\s*>\s*\.body-scene\{[^}]*contain:size[;}]/.test(css),'Compiled root scene containment');
  assert.ok(css.includes('minmax(160px,1fr)'),'Minimum usable scene preserved');
  assert.ok(/\.body-workspace\{[^}]*overflow-y:auto/.test(css),'Short and enlarged layouts retain scrolling');
  const inventoryEpoch='1ad7cb684e894c08d4f29dbd546a96ba16ec7b40';
  const current=JSON.parse(at(inventoryEpoch,'lib/atlas-model-inventory.json').toString());
  const previous=JSON.parse(execFileSync('git',['show','5c3346b2a73223fac91dc71c593adcf32e77ea33:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),historicalNonregionalAtlasSources);
});

test('current a679 viewer retains containment and source-bound model inventory',()=>{
  const pin=validateCurrentAtlasDelivery();
  const base='public/atlas-runtime/head-neck/';
  const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(hash(bytes),validateCurrentAtlasDelivery().documents['public/atlas-runtime/head-neck/manifest.json']);
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  const source=execFileSync('git',['show',`${manifest.sourceCommit}:app/body-explorer.css`],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const historicalCss=execFileSync('git',['show','190a63238eadcf906abe89dcbb6a67c88afe70b9:app/body-explorer.css'],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(hash(historicalCss),'9834c72543476b41ba5acb5a47427dced3596d56320c59502d91f9e9e2524dca','Entire previous compact CSS source remains independently pinned');
  const append=readFileSync(new URL('./fixtures/drawable-space-css-append.css.raw',import.meta.url));
  assert.equal(hash(append),'36d9b0ef6c2786e3752508ee721361be88585db0ca574c8f9734c356469c6404');
  assert.deepEqual(source,Buffer.concat([historicalCss,append]),'Exact previous CSS plus only the reviewed desktop gutter append');
  assert.deepEqual(inputs.filter((i:{path:string})=>i.path==='app/body-explorer.css'),[
    {path:'app/body-explorer.css',sha256:hash(source)},
  ]);
  assert.equal(hash(source),inputs.find((i:{path:string})=>i.path==='app/body-explorer.css').sha256);
  const css=manifest.files.filter((f:{path:string})=>f.path.endsWith('.css')).map((f:{path:string;sha256:string})=>{
    const data=readFileSync(base+f.path);assert.equal(hash(data),f.sha256);return data.toString();
  }).join('\n');
  assert.match(css,/\.body-canvas\s*>\s*\.body-scene\{[^}]*contain:size[;}]?/);
  assert.ok(css.includes('minmax(160px,1fr)'));
  assert.match(css,/\.body-workspace\{[^}]*overflow-y:auto/);
  const inventory=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.equal(inventory.purpose,'licensed-atlas-model-staging-only');
  assert.equal(inventory.learnerDelivery,'existing-static-assets');
  for(const entry of inventory.sources){
    assert.equal(entry.sourceCommit,pin.runtimeSources[entry.module],entry.module);
    const moduleManifest=readFileSync(`public/atlas-runtime/${entry.module}/manifest.json`);
    assert.equal(hash(moduleManifest),entry.manifestSha256,entry.module);
  }
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
});
