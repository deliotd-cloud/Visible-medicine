import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';

test('starter import is review-only and preserves learner modules and model inventory',()=>{
 const prior=(path:string)=>JSON.parse(execFileSync('git',['show','0292830:'+path],{encoding:'utf8',maxBuffer:32e6}));
 const current=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
 const before=prior('atlas-review/manifest.json'),after=current('atlas-review/manifest.json');
 assert.equal(after.revision,'97f48a1ec2e74d0d88b34a26c5180f0aaf447448');
 assert.deepEqual(after.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort(),
  ['app/review/overview/overview.css','app/review/overview/page.tsx','lib/clinical-review-index.ts','lib/clinical-review-pilot.ts']);
 for(const path of ['lib/atlas-model-inventory.json','public/atlas-runtime/head-neck/manifest.json','public/atlas-runtime/shoulder/manifest.json'])assert.deepEqual(current(path),prior(path));
});

test('starter search uses all eleven exact website routes with current nested bindings',async()=>{
 const built=await build({stdin:{contents:"export * from './atlas-review/lib/clinical-review-index';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const result=api.findClinicalReviewEntries({scope:'pilot'});
 assert.equal(result.total,11);assert.equal(result.pageCount,1);
 assert.equal(api.clinicalReviewHref({scope:'pilot'}),'/workspace/atlas-review?scope=pilot');
 assert.equal(api.findClinicalReviewEntries({scope:'pilot',q:'left femur'}).total,1);
 for(const entry of result.entries){
  const url=new URL(entry.href,'https://test.invalid');
  assert.equal(url.pathname,'/workspace/atlas-review/'+entry.scope);
  assert.equal(url.searchParams.get('structure'),entry.id);
  if(entry.scope==='nested')assert.match(url.searchParams.get('source')!,/^[a-f0-9]{64}$/);
 }
 assert.equal(result.entries.filter((e:any)=>e.scope==='body').length,9);
 assert.equal(result.entries.filter((e:any)=>e.scope==='nested').length,2);
});
