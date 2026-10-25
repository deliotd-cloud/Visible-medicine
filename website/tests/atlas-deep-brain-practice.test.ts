import {beforeHippocampi} from './atlas-hippocampi-fixture.ts';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {build} from './review-component-test-build.ts';
import {runOriginalRole} from './deepbrain-foot-roles.mjs';

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
    if(path==='lib/deep-brain-reasoning.ts')
      assert.deepEqual(source,historicalSource,'Complete original deep-brain definition held');
    else {
      assert.equal(sha(historicalSource),'c6b053f9b2d199bfcd3cb1508c833f5f6ccf1a7b2331c1ab073aa1a32a117824');
      assert.equal(sha(source),'462883b2806932ec7a58585cc56078758e01f52b8f0b08b42fd732edd25352ee');
      assert(source.includes(Buffer.from("import { deepBrainReasoningConcepts } from './deep-brain-reasoning';")));
      assert(source.includes(Buffer.from('...deepBrainReasoningConcepts')));
    }
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

test('current six deep-brain targets retain exact definition, display identity, and real practice output',async()=>{
 const root=currentAtlasDeliveryRoot(),pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const path='lib/deep-brain-reasoning.ts';
 const source=execFileSync('git',['--no-replace-objects','show',pin.source+':'+path],{cwd:root,maxBuffer:32e6});
 const original=execFileSync('git',['--no-replace-objects','show','9fba9a1e24b6669aafd48e945d55fc0939d50ab2:'+path],{cwd:root,maxBuffer:32e6});
 assert.deepEqual(source,original);
 assert.equal(createHash('sha256').update(source).digest('hex'),'0f18416cece4e887ff8916abf70667b6e9fcbbceff558863782e4e2038616a5f');
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const entry=review.files.find((f:any)=>f.path===path);assert(entry);
 assert.equal(entry.sourceSha256,entry.importedSha256);assert.equal(entry.sourceSha256,createHash('sha256').update(source).digest('hex'));
 assert.deepEqual(readFileSync('atlas-review/'+path),source);
 const learner=JSON.parse(readFileSync('public/atlas-runtime/head-neck/manifest.json','utf8'));
 const input=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8')).find((f:any)=>f.path===path);
 assert.equal(learner.sourceCommit,pin.source);assert.equal(input.sha256,entry.sourceSha256);
 const compiled=await build({stdin:{contents:[
  "export {deepBrainReasoningConcepts} from './atlas-review/lib/deep-brain-reasoning';",
  "export {reasoningConceptFor} from './atlas-review/lib/reasoning-questions';",
  "export {createPracticeSession} from './atlas-review/lib/atlas-practice';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const raw=JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json','utf8'));
 const catalog=api.bodyDisplayCatalog(raw),loaded=catalog.bundles.map((b:any)=>b.id);
 const keys=['caudate','putamen','pallidum','thalamus','lateral-geniculate','medial-geniculate'].map(x=>'deep-brain-'+x);
 assert.deepEqual(api.deepBrainReasoningConcepts.map((c:any)=>c.key),keys);
 for(const concept of api.deepBrainReasoningConcepts){
  assert.equal(concept.readiness,'draft');assert.equal(concept.revision,1);
  assert.equal(concept.region,'head-neck');assert.equal(concept.sourceTissue,'neural-organ');
  for(const binding of concept.bindings){
   const matches=catalog.structures.filter((s:any)=>s.fmaId===binding.fma&&s.laterality===binding.side&&
    s.sources.length===1&&s.sources[0].file===binding.file&&s.region==='head-neck');
   assert.equal(matches.length,1,concept.key+': exact real catalogue target');
   const structure=matches[0];assert.equal(api.reasoningConceptFor(structure)?.key,concept.key);
   const session=api.createPracticeSession(catalog.structures,loaded,
    {id:1,mode:'reason',sampling:'all',count:1,retryIds:[structure.id]},()=>0.314159);
   assert(session,concept.key+': real learner session');assert.equal(session.questions.length,1);
   assert.equal(session.questions[0].target,structure.id);
   assert.equal(session.questions[0].reasoning.key,concept.key);
   assert.equal(session.questions[0].reasoning.prompt,concept.prompt);
   assert.equal(session.questions[0].reasoning.explanation,concept.explanation);
   assert.deepEqual(session.questions[0].reasoning.references,concept.references);
  }
 }
});

test('complete unchanged f2f deep-brain original runs in its own Website epoch',async()=>{
 await runOriginalRole('deep-brain');
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
