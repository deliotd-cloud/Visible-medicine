import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import {nonregionalAtlasSources} from './atlas-nonregional-release-fixture.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';

test('shared regional viewer isolates scene intrinsic size without changing model delivery',()=>{
  const base='public/atlas-runtime/head-neck/';
  const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  const bytes=readFileSync(base+'manifest.json'),manifest=JSON.parse(bytes.toString());
  assert.equal(hash(bytes),'024ca267eddea5240211e42d9bdad326ec4048aacc738a4954f50c09a2f84c7f');
  assert.equal(manifest.sourceCommit,'f636891cdcee10aeca20ae684cb04c183fa7600e');
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.deepEqual(inputs.filter((i:{path:string})=>i.path==='app/body-explorer.css'),[
    {path:'app/body-explorer.css',sha256:'315a5cbfeac80620e6f805b82d409a293acdf07869333438b6eb74dbbb3a826f'},
  ]);
  const css=manifest.files.filter((f:{path:string})=>f.path.endsWith('.css')).map((f:{path:string;sha256:string})=>{
    const data=readFileSync(base+f.path);assert.equal(hash(data),f.sha256);return data.toString();
  }).join('\n');
  assert.ok(/\.body-canvas\s*>\s*\.body-scene\{[^}]*contain:size[;}]/.test(css),'Compiled root scene containment');
  assert.ok(css.includes('minmax(160px,1fr)'),'Minimum usable scene preserved');
  assert.ok(/\.body-workspace\{[^}]*overflow-y:auto/.test(css),'Short and enlarged layouts retain scrolling');
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  const previous=JSON.parse(execFileSync('git',['show','5c3346b2a73223fac91dc71c593adcf32e77ea33:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  assert.deepEqual(beforeHippocampi(current.models),previous.models);
  assert.deepEqual(current.sources.filter((s:{module:string})=>s.module!=='head-neck'),nonregionalAtlasSources);
});
