import assert from 'node:assert/strict';
import {withoutEyeCrossSectionalNotice} from './atlas-eye-notice-history.ts';
import test from 'node:test';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
const source='24d023f471d39d7d1e4660fb4f20264528bdd6fe',before='107b55dfd3511222755a7d35fc18e7058350bf4c';
const previousBytes=(path:string)=>Buffer.from(execFileSync('git',['show',before+':'+path],{maxBuffer:32e6}));
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function load(previous=false){
 // Replay the exact eye milestone; live later CT changes have their own full
 // 108-context delta check in atlas-nested-ct-orientation.test.ts.
 const saved=previous?before:'c3fb787a9811bf0ef9c3bd130f7a0534d49db9ad';
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/nested-review-material';
 export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';
 export {nestedConcepts,nestedTeachingReferences} from './atlas-review/content/nested-teaching';
 export {eyeCrossSectionalTeaching,eyeCrossSectionalReferences} from './atlas-review/content/eye-cross-sectional-teaching';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'exact-imported-eye-baseline',setup(api){
  for(const path of ['content/nested-teaching.ts','content/body-renderer-revision.json'])api.onLoad({filter:new RegExp(path.replaceAll('/','[\\\\/]')+'$')},args=>({contents:Buffer.from(execFileSync('git',['show',saved+':atlas-review/'+path],{maxBuffer:32e6})).toString('utf8'),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}));
 }}]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('all eye CT/MRI drafts and credits reach learner and protected review without new anatomy or rights',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),viewer=json('public/atlas-review-viewer/manifest.json');
 const learner=json('public/atlas-runtime/head-neck/manifest.json');
 assert.equal(review.revision,source);assert.equal(viewer.sourceCommit,source);assert.equal(learner.sourceCommit,source);
 assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])assert.equal(learner[flag],false);
 const previousLearner=JSON.parse(previousBytes('public/atlas-runtime/head-neck/manifest.json').toString('utf8'));
 assert.deepEqual(learner.modelBundles,previousLearner.modelBundles);
 assert.deepEqual(learner.files.filter((f:any)=>f.path.startsWith('models/')),previousLearner.files.filter((f:any)=>f.path.startsWith('models/')));
 const inventory=json('lib/atlas-model-inventory.json');assert.equal(inventory.models.length,137);
 assert.deepEqual(inventory.models,JSON.parse(previousBytes('lib/atlas-model-inventory.json').toString('utf8')).models);
 for(const manifest of [learner,viewer])for(const file of manifest.files)
  assert.equal(sha(readFileSync((manifest===learner?'public/atlas-runtime/head-neck/':'public/atlas-review-viewer/')+file.path)),file.sha256,file.path);
 const bundle=(base:string,manifest:any)=>manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
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
  assert.deepEqual(readFileSync('atlas-review/'+path),previousBytes('atlas-review/'+path),path+' retained');
 const notices=readFileSync('public/atlas-review-viewer/THIRD_PARTY_NOTICES.txt','utf8');
 assert.match(notices,/Eye cross-sectional teaching/);assert.match(notices,/10\.1186\/s13244-021-01000-x/);assert.match(notices,/10\.1007\/s13244-016-0471-z/);
 const rawNotice=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8').replaceAll('\r','');
 assert.equal(withoutEyeCrossSectionalNotice(rawNotice),previousBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString('utf8').replaceAll('\r',''));
 assert.throws(()=>withoutEyeCrossSectionalNotice(rawNotice.replace('10.1186/s13244-021-01000-x','10.1186/tampered')));
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
