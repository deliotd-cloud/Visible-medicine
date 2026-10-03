import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
const source='4b6f0629ffedd99c5529882ed74341d9402e6ef0',baseline='7ad008589684b622efc6a31f5254d05676991683';
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true});
const oldJson=(p:string)=>JSON.parse(old(p).toString());
async function load(previous=false){
 const frozen=new Set(['atlas-review/lib/reasoning-questions.ts','atlas-review/content/body-review-display-pins.json','atlas-review/content/body-renderer-revision.json']);
 const result=await build({stdin:{contents:`export * from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/atlas-practice';
 export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 export {regionalTours} from './atlas-review/lib/regional-tours';
 import raw from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:previous?[{name:'pre-lower-venous-reasoning',setup(b){b.onLoad({filter:/\.(?:ts|json)$/},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!frozen.has(path))return;
  return{contents:old(path),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
 });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('six source-bound venous concepts reach learner and clinical Review without new anatomy, controls or entitlements',async()=>{
 const api=await load(),prior=await load(true),pins=json('atlas-review/content/lower-venous-reasoning-pins.json');
 assert.equal(api.reasoningConcepts.length,176);assert.equal(prior.reasoningConcepts.length,170);
 assert.deepEqual(api.reasoningConcepts.slice(0,170),prior.reasoningConcepts);assert.equal(pins.entries.length,12);
 assert.equal(api.catalog.structures.filter(api.reasoningConceptFor).length,325);assert.equal(prior.catalog.structures.filter(prior.reasoningConceptFor).length,313);
 assert.deepEqual(api.catalog,prior.catalog);assert.deepEqual(api.regionalTours,prior.regionalTours);assert.equal(api.catalog.structures.length,1104);
 const review=json('atlas-review/manifest.json'),previous=oldJson('atlas-review/manifest.json');
 assert.equal(review.revision,source);assert.equal(review.files.length,996);assert.deepEqual(review.packages,previous.packages);
 const added=['content/lower-venous-reasoning-pins.json','lib/lower-venous-reasoning.ts'];
 assert.deepEqual(review.files.filter((f:any)=>!previous.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),added);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,oldJson('lib/atlas-model-inventory.json').models);assert.equal(json('lib/atlas-model-inventory.json').models.length,137);
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),previous=oldJson(base+'manifest.json');
  assert.equal(manifest.sourceCommit,source);assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),previous.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false);
  assert.equal(manifest.imagingConnection,previous.imagingConnection);
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,f.path);
  const inputs=json(base+'source-inputs.json'),previousInputs=oldJson(base+'source-inputs.json');
  assert.equal(inputs.length,({'head-neck':969,shoulder:643,'female-pelvis':111,'lower-limb':100} as Record<string,number>)[name]);
  assert.deepEqual(inputs.filter((f:any)=>!previousInputs.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),name==='head-neck'?added:[]);
  if(name!=='head-neck')continue;
  for(const path of [...added,'lib/reasoning-questions.ts','lib/atlas-practice.ts'])assert.equal(inputs.find((f:any)=>f.path===path).sha256,review.files.find((f:any)=>f.path===path).sourceSha256);
  const code=emittedTeaching(base,manifest.files,true);
  for(const c of api.reasoningConcepts.slice(170)){
   const split=c.explanation.lastIndexOf(' No lumen,');assert(split>0);
   // Production retains the authored prefix plus a shared scope suffix; the
   // complete reconstructed explanation is verified in actual sessions below.
   for(const value of [c.key,c.prompt,c.explanation.slice(0,split),c.explanation.slice(split),...c.references.map((r:any)=>r.url)])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);
  }
 }
 const base='public/atlas-review-viewer/',viewer=json(base+'manifest.json');assert.equal(viewer.sourceCommit,source);assert.equal(viewer.mode,'production');assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const f of viewer.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,f.path);
 const code=emittedTeaching(base,viewer.files,true);for(const c of api.reasoningConcepts.slice(170)){const split=c.explanation.lastIndexOf(' No lumen,');assert(split>0);for(const value of [c.key,c.prompt,c.explanation.slice(0,split),c.explanation.slice(split)])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);}
 for(const path of ['package.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-delivery-access.ts','lib/lecture-repository.ts','atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','atlas-review/app/body-content.ts','atlas-review/app/body-explorer.tsx','atlas-review/app/reasoning-feedback.tsx','atlas-review/lib/atlas-practice.ts','atlas-review/lib/anatomy-practice.ts','atlas-review/lib/regional-tours.ts','atlas-review/lib/learning-resources.ts'])assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
});
test('existing teaching stays exact while12 venous questions score, filter and require fresh review',async()=>{
 const api=await load(),before=await load(true),pins=json('atlas-review/content/lower-venous-reasoning-pins.json'),targets=new Set(pins.entries.map((e:any)=>e.identity.id));
 const loaded=api.catalog.bundles.map((b:any)=>b.id),create=(items:any[],id:string,bundles=loaded)=>api.createPracticeSession(items,bundles,{id:1,mode:'reason',sampling:'all',count:1,retryIds:[id]},()=>0.314159);
 assert.equal(api.practiceQuestionCount(api.catalog.structures,'reason',[...targets]),6);
 let topics=0,changed=0,preserved=0,stale=0,refused=0,answerCases=0;
 for(const s of api.catalog.structures){
  const n=await api.bodyReviewMaterial(s.id),p=await before.bodyReviewMaterial(s.id);assert.equal(n.approval,false);assert.deepEqual(n.source,p.source);assert.deepEqual(n.topics,p.topics);assert.deepEqual(n.guidedTours,p.guidedTours);topics+=n.topics.length;
  if(!targets.has(s.id)){assert.deepEqual(n,p);preserved++;continue;}
  changed++;assert.equal(p.reasoning,null);assert(n.reasoning);assert.equal(n.reasoning.readiness,'draft');assert.equal(n.reasoning.answerId,s.id);assert(await api.parseBodyReviewResponse(n,s.id));
  const nc=await api.bodyReviewContext(s.id),pc=await before.bodyReviewContext(s.id);assert.equal(nc.sourceHash,pc.sourceHash);assert.equal(nc.revisions.imaging,null);assert.notEqual(nc.revisions.teaching,pc.revisions.teaching);
  for(const scope of [api.catalog.structures,...s.regions.map((r:string)=>api.catalog.structures.filter((v:any)=>v.regions.includes(r)))]){
   const session=create(scope,s.id);assert(session);const q=session.questions[0];assert.equal(q.target,s.id);assert.equal(new Set(q.choices).size,q.choices.length);assert(q.choices.length>=2&&q.choices.length<=4);
   assert.equal(q.reasoning.prompt,n.reasoning.prompt);assert.equal(q.reasoning.explanation,n.reasoning.explanation,'Complete factored explanation reaches practice and Review identically');
   assert(q.choices.every((id:string)=>scope.some((v:any)=>v.id===id&&v.laterality===s.laterality)));
   const action={sessionId:1,index:0},answered=api.practiceReducer(session,{type:'answer',...action,chosen:s.id});assert.equal(api.practiceScore(answered),1);
   assert.deepEqual(api.practiceReducer(answered,{type:'answer',...action,chosen:q.choices.find((id:string)=>id!==s.id)}),answered);
   const wrong=api.practiceReducer(session,{type:'answer',...action,chosen:q.choices.find((id:string)=>id!==s.id)});assert.equal(api.practiceScore(wrong),0);answerCases++;
  }
  assert.equal(create([s],s.id),null);assert.equal(create(api.catalog.structures.filter((v:any)=>v.id!==s.id),s.id),null);assert.equal(create(api.catalog.structures,s.id,loaded.filter((b:string)=>b!==s.bundle)),null);
  for(const mutate of [(q:any)=>q.reasoning.prompt+=' altered',(q:any)=>q.reasoning.revision++,
   (q:any)=>q.reasoning.choices.find((c:any)=>c.id===s.id).sources[0].sha256='0'.repeat(64),
   (q:any)=>q.reasoning.choices.find((c:any)=>c.id===s.id).name+=' altered',
   (q:any)=>q.reasoning.answerId=q.reasoning.choices.find((c:any)=>c.id!==s.id).id,
   (q:any)=>q.reasoning.references[0].url='javascript:alert(1)']){const packet=structuredClone(n);mutate(packet);assert.equal(await api.parseBodyReviewResponse(packet,s.id),null);refused++;}
  let storageCalls=0;const body={catalogScope:nc.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:nc.materialHash,revisionHash:pc.revisions.teaching,checklistVersion:nc.checklistVersion,draft:api.blankBodyReview(nc,'teaching')};
  const response=await api.postBodyDecision(new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_VENOUS_REASONING'},body:JSON.stringify(body)}),{prepare(){storageCalls++;throw Error('Stale packet reached storage');}});
  assert.equal(response.status,409);assert.equal(storageCalls,0);stale++;
 }
 assert.deepEqual({topics,changed,preserved,stale,refused,answerCases},{topics:9936,changed:12,preserved:1092,stale:12,refused:72,answerCases:44});
});
