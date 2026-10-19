import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

test('deep-brain formative practice ships tested source without new models or access',()=>{
  const base='public/atlas-runtime/head-neck/';
  const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
  const saved=(path:string)=>execFileSync('git',['--no-replace-objects','show','f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6:'+path],{maxBuffer:32e6});
  const bytes=readFileSync(base+'manifest.json');
  const historical=JSON.parse(saved(base+'manifest.json').toString());
  assert.equal(sha(saved(base+'manifest.json')),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  assert.equal(historical.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  const manifest=JSON.parse(bytes.toString());
  const feature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
  const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
  const sourceRoot=currentAtlasDeliveryRoot(),pin=validateCurrentAtlasDelivery();
  assert.equal(pin.source,CURRENT_ATLAS_REVISION);
  assert.equal(execFileSync('git',['rev-parse',feature+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
  for(const flag of ['clinicalApproved','patientDataIncluded','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as {path:string;sha256:string}[];
  const historicalInputs=JSON.parse(saved(base+'source-inputs.json').toString()) as {path:string;sha256:string}[];
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));assert.equal(review.revision,manifest.sourceCommit);
  for(const [path,sha256] of Object.entries({
    'lib/deep-brain-reasoning.ts':'0f18416cece4e887ff8916abf70667b6e9fcbbceff558863782e4e2038616a5f',
    'lib/reasoning-questions.ts':'634bf2054f1c1494609b094c11092e1ab5166833b9c5c16a805ab77ea439b4e5',
  })){
    assert.deepEqual(historicalInputs.filter(input=>input.path===path),[{path,sha256}]);
    const source=execFileSync('git',['--no-replace-objects','show',manifest.sourceCommit+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
    const historicalSource=execFileSync('git',['--no-replace-objects','show',feature+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
    assert.deepEqual(source,historicalSource,path+': immutable deep-brain source held');
    const entry=review.files.find((f:any)=>f.path===path);assert(entry,path);
    assert.equal(entry.sourceSha256,sha(source));assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)));
    assert.deepEqual(inputs.filter(input=>input.path===path),[{path,sha256:sha(source)}]);
  }
  assert.ok(!inputs.some(input=>/native-mr|local-mr-study|\.vmmr|patient[-_/]?data/i.test(input.path)));
  const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
    const data=readFileSync(base+file.path);assert.equal(sha(data),file.sha256);return data.toString();
  }).join('\n');
  for(const key of ['caudate','putamen','pallidum','thalamus','lateral-geniculate','medial-geniculate'])assert.ok(runtime.includes('deep-brain-'+key),key);
  const before=JSON.parse(execFileSync('git',['show','83fa723ec2babaecdd71ecc4919928f94d03081a:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
  const current=JSON.parse(readFileSync('lib/atlas-model-inventory.json','utf8'));
  assert.deepEqual(beforeHippocampi(current.models),before.models,'all original model bytes and protected paths remain identical');
  assert.equal(current.models.length,137);
});


test('current deep-brain import refuses altered source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),revision=CURRENT_ATLAS_REVISION;
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
 for(const path of ['lib/deep-brain-reasoning.ts','lib/reasoning-questions.ts']){
  const committed=execFileSync('git',['--no-replace-objects','show',revision+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
  const imported=readFileSync('atlas-review/'+path);
  const verify=(manifest:any,learnerInputs:any,bytes:Buffer=imported)=>{
   const entry=manifest.files.find((file:any)=>file.path===path);assert(entry);
   assert.equal(entry.sourceSha256,sha(committed),'committed source');
   assert.equal(entry.importedSha256,sha(bytes),'Review import');
   assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:sha(committed)}],'learner input');
  };
  verify(review,inputs);
  const forgedSource=structuredClone(review);forgedSource.files.find((file:any)=>file.path===path).sourceSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedSource,inputs),/committed source/);
  const forgedImport=structuredClone(review);forgedImport.files.find((file:any)=>file.path===path).importedSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedImport,inputs),/Review import/);
  const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
  const forgedInput=structuredClone(inputs);forgedInput.find((file:any)=>file.path===path).sha256='0'.repeat(64);
  assert.throws(()=>verify(review,forgedInput),/learner input/);
 }
});
