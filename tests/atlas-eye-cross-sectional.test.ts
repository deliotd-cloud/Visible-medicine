import assert from 'node:assert/strict';
import {withoutEyeCrossSectionalNotice} from './atlas-eye-notice-history.ts';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,relative} from 'node:path';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const source='88cea927d48729769b96ad8fe680b0872b7e6687',before='107b55dfd3511222755a7d35fc18e7058350bf4c';
const previousBytes=(path:string)=>Buffer.from(execFileSync('git',['show',before+':'+path],{maxBuffer:32e6}));
const imported=(path:string)=>Buffer.from(execFileSync('git',['show','f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6:'+path],{maxBuffer:32e6}));
const milestoneSource=(path:string)=>execFileSync('git',['-C','F:/VisibleMedicine/atlas','show',source+':'+path],{maxBuffer:32e6});
const currentSource=CURRENT_ATLAS_REVISION;
const sourceBytes=(path:string)=>execFileSync('git',['show',currentSource+':'+path],{cwd:currentAtlasDeliveryRoot(),maxBuffer:32e6});
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function load(previous=false){
 // Replay the exact eye milestone; live later CT changes have their own full
 // 108-context delta check in atlas-nested-ct-orientation.test.ts.
 const saved=previous?before:'c3fb787a9811bf0ef9c3bd130f7a0534d49db9ad';
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';
 export {nestedConcepts,nestedTeachingReferences} from './atlas-review/content/nested-teaching';
 ${previous?'':"export {eyeCrossSectionalTeaching,eyeCrossSectionalReferences} from './atlas-review/content/eye-cross-sectional-teaching';"}`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-imported-eye-baseline',setup(api){
  api.onLoad({filter:/[\\/]atlas-review[\\/].*\.(?:ts|tsx|json)$/},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');
   return {contents:execFileSync('git',['show',saved+':'+path],{encoding:'utf8',maxBuffer:32e6}),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
  });
 }}]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('all eye CT/MRI drafts and credits reach learner and protected review without new anatomy or rights',async()=>{
 const api=await load(),review=JSON.parse(imported('atlas-review/manifest.json').toString()),viewer=JSON.parse(imported('public/atlas-review-viewer/manifest.json').toString());
 const learner=JSON.parse(imported('public/atlas-runtime/head-neck/manifest.json').toString());
 assert.equal(review.revision,source);assert.equal(viewer.sourceCommit,source);assert.equal(learner.sourceCommit,source);
 assert.deepEqual(imported('atlas-review/content/eye-cross-sectional-teaching.ts'),milestoneSource('content/eye-cross-sectional-teaching.ts'));
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
 const previousLearner=JSON.parse(previousBytes('public/atlas-runtime/head-neck/manifest.json').toString('utf8'));
 assert.deepEqual(learner.modelBundles,previousLearner.modelBundles);
 assert.deepEqual(learner.files.filter((f:any)=>f.path.startsWith('models/')),previousLearner.files.filter((f:any)=>f.path.startsWith('models/')));
 const inventory=json('lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
 assert.deepEqual(inventory.models,JSON.parse(previousBytes('lib/atlas-model-inventory.json').toString('utf8')).models);
 for(const manifest of [learner,viewer])for(const file of manifest.files)
  assert.equal(sha(imported((manifest===learner?'public/atlas-runtime/head-neck/':'public/atlas-review-viewer/')+file.path)),file.sha256,file.path);
 const bundle=(base:string,manifest:any)=>manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>imported(base+f.path).toString()).join('\n');
 const runtimes=[bundle('public/atlas-runtime/head-neck/',learner),bundle('public/atlas-review-viewer/',viewer)];
 let notes=0;
 for(const topics of Object.values(api.eyeCrossSectionalTeaching) as any[])for(const note of Object.values(topics) as any[]){
  assert.equal(note.readiness,'draft');
  for(const runtime of runtimes)assert(runtime.includes(note.body)||runtime.includes(JSON.stringify(note.body).slice(1,-1)),'Complete draft missing');notes++;
 }
 assert.equal(notes,12);
 for(const ref of Object.values(api.eyeCrossSectionalReferences) as any[])for(const runtime of runtimes)
  for(const value of [ref.url,ref.title])assert(runtime.includes(value)||runtime.includes(JSON.stringify(value).slice(1,-1)),'Credit missing');
 for(const path of ['content/eye-imaging-teaching.ts','content/nested-teaching-bindings.v1.json','content/nested-review-bindings.json'])
  assert.deepEqual(imported('atlas-review/'+path),previousBytes('atlas-review/'+path),path+' retained');
 const notices=imported('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt').toString();
 assert.match(notices,/Eye cross-sectional teaching/);assert.match(notices,/10\.1186\/s13244-021-01000-x/);assert.match(notices,/10\.1007\/s13244-016-0471-z/);
 const rawNotice=Buffer.from(execFileSync('git',['show','c3fb787a9811bf0ef9c3bd130f7a0534d49db9ad:atlas-review/LICENSES/THIRD_PARTY_NOTICES.md'],{maxBuffer:32e6})).toString().replaceAll('\r','');
 assert.equal(withoutEyeCrossSectionalNotice(rawNotice),previousBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8').replaceAll('\r',''));
 assert.throws(()=>withoutEyeCrossSectionalNotice(rawNotice.replace('10.1186/s13244-021-01000-x','10.1186/tampered')));
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,currentSource);
 assert.equal(execFileSync('git',['rev-parse',source+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),'1bac2c40cfa3bbcd31b1cc42d54de096e283010e');
 assert.deepEqual(sourceBytes('content/eye-cross-sectional-teaching.ts'),milestoneSource('content/eye-cross-sectional-teaching.ts'),'immutable eye teaching source held');
 assert.equal(json('atlas-review/manifest.json').revision,currentSource);
 assert.equal(json('public/atlas-runtime/head-neck/manifest.json').sourceCommit,currentSource);
 assert.equal(json('public/atlas-review-viewer/manifest.json').sourceCommit,currentSource);
 const currentReview=json('atlas-review/manifest.json');
 const eyePath='content/eye-cross-sectional-teaching.ts',eyeEntry=currentReview.files.find((f:any)=>f.path===eyePath);
 assert(eyeEntry);assert.equal(eyeEntry.sourceSha256,sha(sourceBytes(eyePath)));
 assert.equal(eyeEntry.importedSha256,sha(readFileSync('atlas-review/'+eyePath)));
 for(const folder of ['public/atlas-runtime/head-neck/','public/atlas-review-viewer/']){
  const manifest=json(folder+'manifest.json');
  for(const file of manifest.files)if(file.path.endsWith('.js'))assert.equal(sha(readFileSync(folder+file.path)),file.sha256,file.path);
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(folder+f.path,'utf8')).join('\n');
  for(const topics of Object.values(api.eyeCrossSectionalTeaching) as any[])for(const note of Object.values(topics) as any[])
   assert(js.includes(note.body)||js.includes(JSON.stringify(note.body).slice(1,-1)),'Current learner/review eye draft missing');
 }
});
test('eye teaching invalidates only its 13 teaching contexts and rejects prior revisions before storage',async()=>{
 const current=await load(),previous=await load(true),storage=new Proxy({},{get(){throw Error('Stale request reached storage');}});
 const scope:any={'eye-cornea':['ct','mri'],'eye-iris':['ct','mri'],'eye-lens':['mri'],'eye-zonule':['ct','mri'],'eye-vitreous':['ct','mri'],'eye-choroid':['ct'],'eye-chamber':['ct','mri']};
 let contexts=0,changed=0,unchanged=0,placements=0,rejected=0,pending=0;
 for(const row of current.nestedReviewRows)for(const surface of row.surfaces){
  const old=await previous.nestedReviewMaterial(row.key,surface.id),now=await current.nestedReviewMaterial(row.key,surface.id);
  assert(old&&now);contexts++;assert.deepEqual(now.source,old.source);assert.equal(now.context.sourceHash,old.context.sourceHash);
  assert.deepEqual(now.context.blockers,old.context.blockers);assert.equal(now.context.revisions.imaging,null);
  pending+=now.teaching.topics.filter((t:any)=>t.readiness==='pending').length;
  const topics=scope[now.teaching.concept?.id];
  if(!topics){unchanged++;assert.deepEqual(now.teaching,old.teaching);assert.equal(now.context.teachingHash,old.context.teachingHash);continue;}
  changed++;assert.notEqual(now.context.teachingHash,old.context.teachingHash);
  const restored=structuredClone(now.teaching.concept);
  for(const topic of topics){assert.equal(old.teaching.concept.imaging[topic],undefined);delete restored.imaging[topic];
   assert(now.context.teachingTabs.includes(topic));placements++;}
  assert.deepEqual(restored,old.teaching.concept);
  if(now.teaching.concept.id==='eye-chamber')assert.equal(now.source.structure.laterality,'left');
  for(const delta of [{materialHash:old.context.materialHash},{revisionHash:old.context.revisions.teaching},{sourceFrame:'foreign-frame'}]){
   const c=now.context,response=await current.postNestedReview(new Request('https://review.test/api/atlas-review/nested-review',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_EYE_REVIEW'},
    body:JSON.stringify({catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,
     revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,track:'teaching',expectedVersion:0,draft:current.blankNestedReview(c,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);rejected++;
  }
 }
 assert.deepEqual({contexts,changed,unchanged,placements,rejected,pending},{contexts:108,changed:13,unchanged:95,placements:22,rejected:39,pending:356});
});


test('current eye CT/MRI source binding refuses forged source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),path='content/eye-cross-sectional-teaching.ts';
 const review=json('atlas-review/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 const committed=execFileSync('git',['show',currentSource+':'+path],{cwd:sourceRoot,maxBuffer:32e6});
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
});
