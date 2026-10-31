import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,relative} from 'node:path';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const saved='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const old=(p:string)=>execFileSync('git',['show',`${saved}:${p}`],{maxBuffer:32e6});

test('learner and Clinical Review retain 28 exact source-bound drafts without new models or approval',async()=>{
 const json=(p:string)=>JSON.parse(old(p).toString()),review=json('atlas-review/manifest.json');
 assert.equal(review.revision,'88cea927d48729769b96ad8fe680b0872b7e6687');
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const name of ['head-neck','shoulder'])assert.equal(json('public/atlas-runtime/'+name+'/manifest.json').sourceCommit,review.revision);
 const prior=JSON.parse(execFileSync('git',['show','5cdb5c6c:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior.models);
 for(const kind of ['foot-sesamoid-teaching','cerebellar-mca-imaging'])for(const path of ['lib/'+kind+'.ts','content/'+kind+'.ts','content/'+kind+'-pins.json']){
  const file=review.files.find((f:any)=>f.path===path);assert(file,path);
  assert.equal(file.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256,path);
  assert.equal(file.importedSha256,createHash('sha256').update(old('atlas-review/'+path)).digest('hex'));
 }
 const r=await build({stdin:{contents:"export * from './atlas-review/app/body-content';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'saved-foot-cerebral-import',setup(api){api.onLoad({filter:/\.(?:ts|json)$/},args=>{const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!path.startsWith('atlas-review/'))return;return{contents:old(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};});}}]});
 const api=await import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));let count=0;
 for(const kind of ['foot-sesamoid-teaching','cerebellar-mca-imaging'])for(const entry of json('atlas-review/content/'+kind+'-pins.json').entries){
  const packet=await api.bodyReviewMaterial(entry.identity.id);assert.equal(packet.approval,false);assert((await api.parseBodyReviewResponse(packet,entry.identity.id)));
  for(const tab of entry.topics){
   const lesson=api.bodyLesson(entry.identity,tab),topic=packet.topics.find((t:any)=>t.tab===tab);const {tab:_tab,...shown}=topic;
   assert.equal(lesson.readiness,'draft');assert.deepEqual(shown,lesson);assert.match(lesson.note,/independent/);count++;
   const changed=structuredClone(packet);changed.approval=true;assert.equal((await api.parseBodyReviewResponse(changed,entry.identity.id)),null);
  }
 }
 assert.equal(count,28);assert.equal(json('public/atlas-review-viewer/manifest.json').personalRecordsIncluded,false);
});

test('current foot and cerebral teaching import retains exact source, emitted code and access boundary',async()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const featureSource='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
 const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
 const source=CURRENT_ATLAS_REVISION,sourceRoot=currentAtlasDeliveryRoot(),pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,source);
 assert.equal(execFileSync('git',['rev-parse',featureSource+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
 const review=json('atlas-review/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 const learner=json('public/atlas-runtime/head-neck/manifest.json'),viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(review.revision,source);assert.equal(learner.sourceCommit,source);assert.equal(viewer.sourceCommit,source);
 for(const kind of ['foot-sesamoid-teaching','cerebellar-mca-imaging'])for(const path of ['lib/'+kind+'.ts','content/'+kind+'.ts','content/'+kind+'-pins.json']){
  const file=review.files.find((f:{path:string})=>f.path===path),input=inputs.find((f:{path:string})=>f.path===path);
  assert.ok(file&&input,path);
  assert.equal(file.sourceSha256,input.sha256,path);
  const committed=execFileSync('git',['show',`${source}:${path}`],{cwd:sourceRoot});
  const historical=execFileSync('git',['show',`${featureSource}:${path}`],{cwd:sourceRoot});
  assert.equal(execFileSync('git',['merge-base',featureSource,source],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureSource,'feature source is an authenticated ancestor');
  assert.deepEqual(historical,old('atlas-review/'+path),path+': exact archived feature import');
  assert.equal(input.sha256,sha(committed),path);
  assert.deepEqual(readFileSync('atlas-review/'+path),committed,path+': exact current import');
  assert.equal(file.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
 }
 for(const [base,manifest] of [['public/atlas-runtime/head-neck/',learner],['public/atlas-review-viewer/',viewer]] as const)
  for(const file of manifest.files as {path:string;sha256:string}[])assert.equal(sha(readFileSync(base+file.path)),file.sha256,file.path);
 const inventory=json('lib/atlas-model-inventory.json');
 assert.equal(inventory.models.length,137);
 assert.equal(inventory.models.flatMap((m:{paths:string[]})=>m.paths).length,144);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
 const built=await build({stdin:{contents:"export * from './atlas-review/app/body-content';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));let currentPackets=0;
 for(const kind of ['foot-sesamoid-teaching','cerebellar-mca-imaging'])for(const entry of json('atlas-review/content/'+kind+'-pins.json').entries){
  const packet=await api.bodyReviewMaterial(entry.identity.id);assert(packet);assert.equal(packet.approval,false);
  assert.deepEqual(packet.source.structure,entry.identity);assert(await api.parseBodyReviewResponse(packet,entry.identity.id));
  for(const tab of entry.topics){
   const lesson=api.bodyLesson(entry.identity,tab),topic=packet.topics.find((t:any)=>t.tab===tab);assert(topic);
   const {tab:_tab,...shown}=topic;assert.equal(lesson.readiness,'draft');assert.deepEqual(shown,lesson);currentPackets++;
  }
  const forged=structuredClone(packet);forged.approval=true;assert.equal(await api.parseBodyReviewResponse(forged,entry.identity.id),null);
 }
 assert.equal(currentPackets,28,'Current resolver and protected Review still agree on every original placement');
});


test('current foot and cerebral bindings refuse forged source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),source=CURRENT_ATLAS_REVISION;
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 for(const kind of ['foot-sesamoid-teaching','cerebellar-mca-imaging'])
  for(const path of ['lib/'+kind+'.ts','content/'+kind+'.ts','content/'+kind+'-pins.json']){
   const committed=execFileSync('git',['show',source+':'+path],{cwd:sourceRoot});
   const imported=readFileSync('atlas-review/'+path);
   const verify=(manifest:any,learnerInputs:any,bytes:Buffer=imported)=>{
    const file=manifest.files.find((row:any)=>row.path===path);assert(file);
    assert.equal(file.sourceSha256,sha(committed),'committed source');
    assert.equal(file.importedSha256,sha(bytes),'Review import');
    assert.deepEqual(learnerInputs.filter((row:any)=>row.path===path),[{path,sha256:sha(committed)}],'learner input');
   };
   verify(review,inputs);
   const forgedSource=structuredClone(review);forgedSource.files.find((row:any)=>row.path===path).sourceSha256='0'.repeat(64);
   assert.throws(()=>verify(forgedSource,inputs),/committed source/);
   const forgedImport=structuredClone(review);forgedImport.files.find((row:any)=>row.path===path).importedSha256='0'.repeat(64);
   assert.throws(()=>verify(forgedImport,inputs),/Review import/);
   const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
   const forgedInput=structuredClone(inputs);forgedInput.find((row:any)=>row.path===path).sha256='0'.repeat(64);
   assert.throws(()=>verify(review,forgedInput),/learner input/);
  }
});
