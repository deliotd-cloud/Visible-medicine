import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {preProjectionImportBytes,preProjectionTeachingPlugin} from './atlas-interosseous-projection-history.ts';
import {epochBytes} from './atlas-pre-lower-venous-reasoning-history.ts';
const baseline='6d851df6891316da971430ca8ddf522d31df640b';
const revision='1517521a5ee3eed985fff01bcd8608965b693fae';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
async function load(previous=false){
 const result=await build({stdin:{contents:`
 export * from './atlas-review/lib/reasoning-questions';
 export * from './atlas-review/lib/atlas-practice';
 export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-context';
 export * from './atlas-review/lib/body-review-decisions';
 export * from './atlas-review/lib/body-review-api';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';
 `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:[preProjectionTeachingPlugin(),...(previous?[{name:'exact-pre-core-questions',setup(api: import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!['atlas-review/lib/reasoning-questions.ts','atlas-review/content/body-renderer-revision.json'].includes(p))return;
   return{contents:old(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]:[{name:'completed170-concept-question-bank',setup(api: import('esbuild').PluginBuild){
  api.onLoad({filter:/reasoning-questions\.ts$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(p!=='atlas-review/lib/reasoning-questions.ts')return;
   // Keep the core milestone's170 questions; live176 coverage is independent.
   return{contents:epochBytes(p).toString(),loader:'ts',resolveDir:dirname(args.path)};
  });
 }}])]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('four core thoracic questions ship over five exact roots without new models, permissions or dependencies',async()=>{
 const api=await load(),prior=await load(true),review=json('atlas-review/manifest.json');
 const epoch=JSON.parse(old('atlas-review/manifest.json'));
 const milestone=JSON.parse(preProjectionImportBytes('atlas-review/manifest.json').toString());
 assert.equal(review.revision,revision);assert.equal(review.files.length,1002);
 assert.deepEqual(review.packages,epoch.packages);
 assert.deepEqual(milestone.files.filter((f:any)=>!epoch.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/thoracic-core-reasoning-pins.json','lib/thoracic-core-reasoning.ts']);
 assert.deepEqual(milestone.files.filter((f:any)=>epoch.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),['content/body-renderer-revision.json','content/body-review-display-pins.json','lib/reasoning-questions.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(api.reasoningConcepts.slice(0,166),prior.reasoningConcepts);
 assert.equal(api.reasoningConcepts.length,170);
 assert.deepEqual(api.reasoningConcepts.slice(166).map((c:any)=>c.key),['thoracic-core-heart','thoracic-core-lung','thoracic-core-right-main-bronchus','thoracic-core-left-main-bronchus']);
 for(const p of ['lib/atlas-practice.ts','lib/anatomy-practice.ts','LICENSES/THIRD_PARTY_NOTICES.md'])assert.equal(readFileSync('atlas-review/'+p,'utf8'),old('atlas-review/'+p));
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 const pins=json('atlas-review/content/thoracic-core-reasoning-pins.json');assert.equal(pins.entries.length,5);
 for(const folder of ['public/atlas-runtime/head-neck/','public/atlas-review-viewer/']){
  const manifest=json(folder+'manifest.json');assert.equal(manifest.sourceCommit,revision);
  assert.equal(manifest[folder.includes('runtime')?'patientDataIncluded':'personalRecordsIncluded'],false);
  for(const f of manifest.files)assert.equal(sha(readFileSync(folder+f.path)),f.sha256);
  const code=folder.includes('runtime')?emittedTeaching(folder,manifest.files,true):manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(folder+f.path,'utf8')).join('\n');
  for(const c of api.reasoningConcepts.slice(166))for(const s of [c.prompt,c.explanation,...c.references.flatMap((r:any)=>[r.title,r.url])])assert(code.includes(s)||code.includes(JSON.stringify(s).slice(1,-1)),s);
 }
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const p of ['lib/thoracic-core-reasoning.ts','content/thoracic-core-reasoning-pins.json','lib/reasoning-questions.ts'])assert.equal(inputs.find((f:any)=>f.path===p).sha256,review.files.find((f:any)=>f.path===p).sourceSha256);
});
test('five teaching packets advance,1099 stay exact; correct answers and stale reviews are source-bound',async()=>{
 const current=await load(),previous=await load(true);
 const catalog=current.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/thoracic-core-reasoning-pins.json'),targets=new Set(pins.entries.map((p:any)=>p.identity.id));
 const loaded=catalog.bundles.map((b:any)=>b.id);
 const session=(items:any[],id:string,bundles=loaded)=>current.createPracticeSession(items,bundles,{id:1,mode:'reason',sampling:'all',count:1,retryIds:[id]},()=>0.314159);
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 let changed=0,unchanged=0,rejected=0;
 for(const s of catalog.structures){
  const a=await previous.bodyReviewMaterial(s.id),b=await current.bodyReviewMaterial(s.id);
  assert.deepEqual(b.source,a.source);assert.deepEqual(b.topics,a.topics);assert.deepEqual(b.guidedTours,a.guidedTours);
  assert.equal(b.fingerprints.source,a.fingerprints.source);assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
  if(!targets.has(s.id)){assert.deepEqual(b.reasoning,a.reasoning);assert.equal(b.fingerprints.teaching,a.fingerprints.teaching);unchanged++;continue;}
  changed++;assert.equal(a.reasoning,null);assert(b.reasoning);assert.notEqual(b.fingerprints.teaching,a.fingerprints.teaching);
  assert.deepEqual(s,pins.entries.find((p:any)=>p.identity.id===s.id).identity);
  assert(await current.parseBodyReviewResponse(b,s.id));
  const altered=structuredClone(b);altered.reasoning.answerId='foreign';assert.equal(await current.parseBodyReviewResponse(altered,s.id),null);
  const run=session(catalog.structures,s.id);assert(run);const q=run.questions[0];
  assert.equal(q.target,s.id);assert.equal(q.choices.length,s.laterality==='unpaired'?4:2);
  for(const id of q.choices)assert.equal(catalog.structures.find((s:any)=>s.id===id).laterality,s.laterality);
  const action={sessionId:run.id,index:0};
  const correct=current.practiceReducer(run,{type:'answer',...action,chosen:s.id});assert.equal(current.practiceScore(correct),1);
  assert.deepEqual(current.practiceReducer(correct,{type:'answer',...action,chosen:q.choices.find((id:string)=>id!==s.id)}),correct);
  const wrong=current.practiceReducer(run,{type:'answer',...action,chosen:q.choices.find((id:string)=>id!==s.id)});assert.equal(current.practiceScore(wrong),0);
  assert.deepEqual(current.missedPracticeIds(current.practiceReducer(wrong,{type:'next',...action}).responses),[s.id]);
  assert.equal(session([s],s.id),null);assert.equal(session(catalog.structures.filter((t:any)=>t.id!==s.id),s.id),null);
  assert.equal(session(catalog.structures,s.id,loaded.filter((id:string)=>id!==s.bundle)),null);
  const c=await current.bodyReviewContext(s.id),oldContext=await previous.bodyReviewContext(s.id);
  assert.equal(c.teachingHash,b.fingerprints.teaching);assert.equal(c.revisions.imaging,null);
  assert.notEqual(c.revisions.teaching,oldContext.revisions.teaching);
  for(const delta of [{materialHash:a.materialHash},{revisionHash:oldContext.revisions.teaching}]){
   const response=await current.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_THORACIC_REVIEW'},body:JSON.stringify({catalogScope:c.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:current.blankBodyReview(c,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);rejected++;
  }
 }
 assert.deepEqual({changed,unchanged,rejected},{changed:5,unchanged:1099,rejected:10});
});
