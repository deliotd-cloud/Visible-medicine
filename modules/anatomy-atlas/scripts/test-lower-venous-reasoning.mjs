import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {relative,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const baseline='193fb837176dd3bb2a991754f2f2f087c55978b3',root=process.cwd();
const old=p=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const read=p=>readFile(p,'utf8'),same=(a,b,m)=>assert.deepEqual(structuredClone(a),structuredClone(b),m);
async function load(previous=false){
 const teachingEpoch='4b6f0629ffedd99c5529882ed74341d9402e6ef0';
 // Replay this completed milestone's teaching exactly. The hand-venous suite checks
 // all actual current topics and source-bound Review transitions independently.
 const teachingPaths=new Set(['app/body-content.ts','content/body-review-display-pins.json','content/body-renderer-revision.json']);
 const result=await build({stdin:{contents:`export * from './lib/reasoning-questions';
 export * from './lib/atlas-practice'; export * from './lib/body-review-material';
 export * from './lib/body-review-context'; export * from './lib/body-review-decisions'; export * from './lib/body-review-response';
 export * from './lib/body-review-api';
 export {bodyDisplayCatalog} from './lib/body-display-catalog'; export {ReasoningFeedback} from './app/reasoning-feedback';`,resolveDir:root,loader:'ts'},
 bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',
 plugins:[{name:'completed-lower-venous-teaching',setup(api){api.onLoad({filter:/\.(?:ts|json)$/},args=>{
  const path=relative(root,args.path).replaceAll('\\','/');if(!teachingPaths.has(path))return;
  return{contents:execFileSync('git',['show',teachingEpoch+':'+path],{encoding:'utf8',maxBuffer:32e6}),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
 });}},...(previous?[{name:'exact-pre-lower-venous',setup(api){api.onLoad({filter:/reasoning-questions\.ts$/},args=>{
  if(relative(root,args.path).replaceAll('\\','/')!=='lib/reasoning-questions.ts')return;
  return{contents:old('lib/reasoning-questions.ts'),loader:'ts',resolveDir:dirname(args.path)};
 });}}]:[])]});
 const module={exports:{}},require=createRequire(root+'/package.json');
 runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,crypto,TextEncoder,TextDecoder,Request,Response,structuredClone,URL,URLSearchParams});
 return module.exports;
}
const previous=await load(true),current=await load(),raw=JSON.parse(await read('public/models/bodyparts3d/full-body/catalog.json'));
const catalog=current.bodyDisplayCatalog(raw),pins=JSON.parse(await read('content/lower-venous-reasoning-pins.json'));
same(current.reasoningConcepts.slice(0,170),previous.reasoningConcepts,'All previous170 definitions/order exact');
same(current.reasoningConcepts.slice(170).map(c=>c.key),['small-saphenous-vein','popliteal-vein','femoral-vein','great-saphenous-vein','external-iliac-vein','common-iliac-vein'].map(k=>'lower-venous-'+k));
assert.equal(current.reasoningConcepts.length,176);assert.equal(pins.entries.length,12);
const words={};for(const c of current.reasoningConcepts.slice(170))for(const r of c.references){assert.equal(new URL(r.url).protocol,'https:');words[r.url]=(words[r.url]??0)+(c.prompt+' '+c.explanation).split(/\s+/).length;}
for(const [url,count]of Object.entries(words))assert(count<=200,'Brief original synthesis per reference: '+url+' '+count);
assert.equal(catalog.structures.filter(current.reasoningConceptFor).length,325);
assert.equal(current.practiceQuestionCount(catalog.structures,'reason',pins.entries.map(e=>e.identity.id)),6,'One question per concept, not duplicated by side');
for(const path of ['lib/atlas-practice.ts','lib/anatomy-practice.ts','app/reasoning-feedback.tsx','app/body-explorer.tsx','package.json','package-lock.json','public/models/bodyparts3d/full-body/catalog.json'])same(await read(path),old(path),'Shared engine/UI/rights/geometry unchanged: '+path);
same(catalog.coordinateSystem,pins.coordinateSystem);assert.equal(catalog.sourceVersion,pins.sourceVersion);
const targets=new Set(pins.entries.map(e=>e.identity.id)),loaded=catalog.bundles.map(b=>b.id);
const create=(api,items,target,bundles=loaded,random=()=>0.314159)=>api.createPracticeSession(items,bundles,{id:1,mode:'reason',sampling:'all',count:1,retryIds:[target]},random);
const require=createRequire(root+'/package.json'),{createElement}=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let changed=0,unchanged=0,sourceMutations=0,answerCases=0,malformedPackets=0,oldQuestions=0;
const isa=(await read('LICENSES/bodyparts3d-v4-index/isa_element_parts.txt')).trim().split(/\r?\n/).map(l=>l.split('\t'));
for(const entry of pins.entries){
 const target=catalog.structures.find(s=>s.id===entry.identity.id);same(target,entry.identity);
 assert.equal(current.reasoningConceptFor(target)?.key,entry.key);
 same(catalog.bundles.find(b=>b.id===target.bundle),pins.bundles.find(b=>b.id===target.bundle));
 same(isa.filter(r=>r[0]===target.fmaId).map(r=>r[2]),target.sources.map(s=>s.file),'Complete official source membership');
 const concept=current.reasoningConceptFor(target);assert.equal(concept.readiness,'draft');assert.equal(concept.revision,1);
 assert.equal(concept.bindings.length,2);assert.equal(new Set(concept.distractors).size,3);assert(!concept.distractors.includes(concept.key));
 for(const patch of [{id:'foreign'},{name:'Renamed surface'},{sourceName:'Renamed source'},{fmaId:'FMA0'},{laterality:'unspecified'},
  {system:'muscles'},{category:'muscle'},{sourceTree:'partof'},{region:'thorax'},{regions:['thorax']},{regions:[...target.regions].reverse()},
  {bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:[0,0,0,1,1,1]},
  {sources:target.sources.map((s,i)=>i?s:{...s,sha256:'0'.repeat(64)})},
  {sources:[...target.sources].reverse()},{sources:target.sources.slice(1)},{sources:[]},{sources:[...target.sources,...target.sources]}]){
  if(JSON.stringify({...target,...patch})===JSON.stringify(target))continue;
  assert.equal(current.reasoningConceptFor({...target,...patch}),undefined,'Reject complete identity substitution');sourceMutations++;
 }
 for(const scope of [catalog.structures,...target.regions.map(r=>catalog.structures.filter(s=>s.regions.includes(r)))]){
  for(const random of [()=>0,()=>0.314159,()=>0.999999]){
   const session=create(current,scope,target.id,loaded,random);assert(session);assert.equal(session.questions[0].target,target.id);
   const q=session.questions[0];assert.equal(q.reasoning.key,entry.key);assert.equal(new Set(q.choices).size,q.choices.length);
   assert(q.choices.length>=2 && q.choices.length<=4);
   for(const id of q.choices){const selected=scope.find(s=>s.id===id);assert(selected);assert.equal(selected.laterality,target.laterality);
    if(id!==target.id)assert(concept.distractors.includes(current.reasoningConceptFor(selected).key));}
   assert.equal(renderToStaticMarkup(createElement(current.ReasoningFeedback,{session})),'','No answer leaked before response');
   const action={sessionId:session.id,index:0},incorrect=q.choices.find(id=>id!==target.id);
   const answered=current.practiceReducer(session,{type:'answer',...action,chosen:target.id});assert.equal(current.practiceScore(answered),1);
   same(current.practiceReducer(answered,{type:'answer',...action,chosen:incorrect}),answered,'Answer once');
   same(current.practiceReducer(session,{type:'answer',...action,sessionId:99,chosen:target.id}),session,'Stale response refused');
   const html=renderToStaticMarkup(createElement(current.ReasoningFeedback,{session:answered}));assert(html.includes('Sources &amp; scope'));assert(html.includes('review pending'));
   const wrong=current.practiceReducer(session,{type:'answer',...action,chosen:incorrect});assert.equal(current.practiceScore(wrong),0);
   const finished=current.practiceReducer(wrong,{type:'next',...action});same(current.missedPracticeIds(finished.responses),[target.id]);answerCases++;
  }
 }
 assert.equal(create(current,catalog.structures.filter(s=>s.id!==target.id),target.id),null);
 assert.equal(create(current,catalog.structures,target.id,loaded.filter(b=>b!==target.bundle)),null);
 assert.equal(create(current,[target],target.id),null);
 const material=await current.bodyReviewMaterial(target.id);assert(await current.parseBodyReviewResponse(material,target.id));
 for(const edit of [p=>delete p.reasoning,p=>p.reasoning.readiness='approved',p=>p.reasoning.revision=0,
  p=>p.reasoning.references[0].url='javascript:alert(1)',p=>p.reasoning.choices.push(p.reasoning.choices[0]),
  p=>p.reasoning.choices.find(c=>c.id===target.id).sources[0].sha256='0'.repeat(64),p=>p.reasoning.choices.find(c=>c.id===target.id).name+=' changed',
  p=>p.reasoning.answerId=p.reasoning.choices.find(c=>c.id!==target.id).id]){
   const copy=structuredClone(material);edit(copy);assert.equal(await current.parseBodyReviewResponse(copy,target.id),null);malformedPackets++;
 }
 const before=await previous.bodyReviewContext(target.id),after=await current.bodyReviewContext(target.id);
 assert(current.bodyReviewStale({catalogScope:before.catalogScope,structureId:target.id,track:'teaching',revisionHash:before.revisions.teaching,checklistVersion:before.checklistVersion},after));
 assert.equal(after.revisions.imaging,null,'No acquired-image approval implied');
 let storageCalls=0;
 const stalePacket={catalogScope:before.catalogScope,structureId:target.id,track:'teaching',expectedVersion:0,
  materialHash:before.materialHash,revisionHash:before.revisions.teaching,checklistVersion:before.checklistVersion,draft:current.blankBodyReview(before,'teaching')};
 const request=new Request('https://atlas.example/api/body-review/decisions',{method:'POST',headers:{'oai-authenticated-user-id':'synthetic-reviewer','content-type':'application/json',origin:'https://atlas.example'},body:JSON.stringify(stalePacket)});
 const response=await current.postBodyDecision(request,{prepare(){storageCalls++;throw Error('Stale packet must not touch storage');}});
 assert.equal(response.status,409);assert.equal(storageCalls,0,'Reject stale teaching before storage');
}
for(const s of catalog.structures){
 const before=await previous.bodyReviewMaterial(s.id),after=await current.bodyReviewMaterial(s.id);
 same(after.source,before.source);same(after.topics,before.topics,'All9 topic slots preserved');same(after.guidedTours,before.guidedTours);same(after.fingerprints.source,before.fingerprints.source);
 assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
 if(targets.has(s.id)){assert.equal(before.reasoning,null);assert(after.reasoning);assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);changed++;}
 else{same(after.reasoning,before.reasoning);same(after.fingerprints.teaching,before.fingerprints.teaching);unchanged++;}
 if(previous.reasoningConceptFor(s)){
   same(create(current,catalog.structures,s.id),create(previous,catalog.structures,s.id),'All previous313 actual session questions unchanged');oldQuestions++;
 }
}
assert.equal(changed,12);assert.equal(unchanged,1092);assert.equal(oldQuestions,313);
const report={baseline,teachingSnapshotEpoch:'4b6f0629ffedd99c5529882ed74341d9402e6ef0',currentQuestionBankStillLoaded:true,concepts:176,boundRepresentations:325,newConcepts:6,newRootTargets:12,existingQuestionsPreserved:170,existingBoundQuestionsPreserved:oldQuestions,
 unchangedRootTeaching:1092,unchangedTopicPlacements:9936,sourceMutations,answerCases,malformedPackets,referenceWords:words,
 geometryAndRightsUnchanged:true,clinicalApproval:false,browserAcceptance:false};
await writeFile('docs/lower-venous-reasoning-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
