import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const atlas=currentAtlasDeliveryRoot();
const parent='456e6d7358e0648b8d7bc8f0f706a4c74f14c5bd';
const previousConceptsSha256='498088c471b51653f283eaf9dc28e71dbb443e0cb7765b7821e84a3fa1c01586';
const sourceHashes:Record<string,string>={
 'content/brain-connections-reasoning-pins.json':'2b2431ad4188a30211a200a3d162c8bc2aa57102d77a24f790b35134449592b7',
 'lib/brain-connections-reasoning.ts':'80d760e245f31e563b4038ffe3dddf468d669052541109d6e25fb132ce417ea4',
 'lib/reasoning-questions.ts':'c6b053f9b2d199bfcd3cb1508c833f5f6ccf1a7b2331c1ab073aa1a32a117824',
 'lib/atlas-practice.ts':'cee0a9436adbfa68d784d40fbf464d0b685c297b502128db20609db95b26fd68',
 'lib/anatomy-practice.ts':'6cc60a21919341e2dda7b56305c595f02e23eeb499b06191646e763de916a051',
 'public/models/bodyparts3d/full-body/catalog.json':'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
};
// 9f is the immutable brain-connections feature source. The current delivery
// also includes later reasoning cohorts, so its aggregator has a second identity.
const currentReasoningSha256='462883b2806932ec7a58585cc56078758e01f52b8f0b08b42fd732edd25352ee';
const expected=[
 ['brain-connections-amygdala','FMA72832','right','FJ1829'],
 ['brain-connections-amygdala','FMA72833','left','FJ1753'],
 ['brain-connections-fornix','FMA72924','right','FJ1804'],
 ['brain-connections-fornix','FMA72925','left','FJ1756'],
 ['brain-connections-anterior-commissure','FMA61961','midline','FJ1734'],
 ['brain-connections-corpus-callosum','FMA86464','midline','FJ1742'],
] as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('brain connection reasoning drafts retain prior practice and bind exact learner and Review source',async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,CURRENT_ATLAS_REVISION);
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/brain-connections-reasoning-pins.json');
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 assert.equal(pins.parentCommit,parent);
 assert.equal(pins.entries.length,6);
 assert.deepEqual(pins.entries.map((entry:any)=>[
  entry.key,entry.identity.fmaId,entry.identity.laterality,entry.identity.sources[0]?.file,
 ]),expected);
 assert.equal(new Set(pins.entries.map((entry:any)=>entry.identity.id)).size,6);
 for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),
   digest,`${path}: 9f Git source`);
  const deliveredDigest=path==='lib/reasoning-questions.ts'?currentReasoningSha256:digest;
  assert.equal(sha(execFileSync('git',['show',`${admission.source}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),
   deliveredDigest,`${path}: current Git source`);
  const file=review.files.find((item:{path:string})=>item.path===path);
  assert(file,path);
  assert.equal(file.sourceSha256,deliveredDigest,path);
  assert.equal(file.importedSha256,deliveredDigest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),deliveredDigest,path);
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 const learnerInputs=json(learnerBase+'source-inputs.json');
 for(const [path,digest] of Object.entries(sourceHashes))
  assert.equal(learnerInputs.find((file:{path:string})=>file.path===path)?.sha256,
   path==='lib/reasoning-questions.ts'?currentReasoningSha256:digest,`learner ${path}`);
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const manifest=json(`public/atlas-runtime/${module}/manifest.json`);
  assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
 }
 const learner=json(learnerBase+'manifest.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];

 const compiled=await build({stdin:{contents:[
  "export * from './atlas-review/lib/reasoning-questions';",
  "export * from './atlas-review/lib/brain-connections-reasoning';",
  "export * from './atlas-review/lib/atlas-practice';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-decisions';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-api';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const raw=json('atlas-review/public/models/bodyparts3d/full-body/catalog.json');
 const catalog=api.bodyDisplayCatalog(raw);
 assert.equal(pins.sourceVersion,catalog.sourceVersion);
 assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem);
 for(const bundle of pins.bundles){
  assert.deepEqual(catalog.bundles.find((item:{id:string})=>item.id===bundle.id),bundle);
  const path=bundle.url.replace(/^\//,'');
  const file=learner.files.find((item:{path:string})=>item.path===path);
  assert(file,`Learner manifest missing ${path}`);
  assert.equal(file.bytes,bundle.bytes);
  assert.equal(file.sha256,bundle.sha256);
  const bytes=readFileSync(learnerBase+path);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(sha(bytes),bundle.sha256);
 }
 assert(api.reasoningConcepts.length>=190);
 assert.equal(sha(JSON.stringify(api.reasoningConcepts.slice(0,182))),previousConceptsSha256);
 const originalCohortKeys=new Set(api.reasoningConcepts.slice(0,190).map((concept:{key:string})=>concept.key));
 assert.equal(originalCohortKeys.size,190);
 assert.deepEqual(api.reasoningConcepts.slice(182,186).map((concept:{key:string})=>concept.key),[
  'brain-connections-amygdala','brain-connections-fornix',
  'brain-connections-anterior-commissure','brain-connections-corpus-callosum',
 ]);
 assert.equal(catalog.structures.filter((structure:{id:string})=>{
  const concept=api.reasoningConceptFor(structure);
  return concept&&originalCohortKeys.has(concept.key);
 }).length,343);
 const loaded=catalog.bundles.map((bundle:{id:string})=>bundle.id);
 const create=(id:string)=>api.createPracticeSession(catalog.structures,loaded,
  {id:1,mode:'reason',sampling:'all',count:1,retryIds:[id]},()=>0.314159);
 const newIds=new Set(pins.entries.map((entry:any)=>entry.identity.id));
 // Preserve this historical 331-root cohort; the six later abdominal roots
 // have their own exact-identity and session regression test.
 const abdominalPins=json('atlas-review/content/abdominal-spatial-reasoning-pins.json');
 const laterIds=new Set(abdominalPins.entries.map((entry:any)=>entry.identity.id));
 assert.equal(laterIds.size,6);
 let priorQuestions=0,topicPlacements=0;
 for(const structure of catalog.structures){
  const material=await api.bodyReviewMaterial(structure.id);
  assert(material,structure.id);
  topicPlacements+=material.topics.length;
  assert.equal(material.approval,false);
  assert.equal(material.status,'worksheet-not-submitted');
  const priorConcept=api.reasoningConceptFor(structure);
  if(!newIds.has(structure.id)&&!laterIds.has(structure.id)&&priorConcept&&originalCohortKeys.has(priorConcept.key)){
   const session=create(structure.id);
   assert(session,`Prior practice session missing: ${structure.id}`);
   assert.equal(session.questions[0].target,structure.id);
   priorQuestions++;
  }
 }
 assert.equal(priorQuestions,331);
 assert.equal(topicPlacements,9936);

 for(const entry of pins.entries){
  const identity=entry.identity,id=identity.id;
  const source=catalog.structures.find((item:{id:string})=>item.id===id);
  assert.deepEqual(source,identity,`${entry.key}: complete display identity`);
  assert.equal(api.brainConnectionsReasoningSourceMatches(source,entry.key),true);
  const concept=api.reasoningConceptFor(source);
  assert.equal(concept?.key,entry.key);
  assert.equal(concept.readiness,'draft');
  assert.equal(concept.revision,1);
  assert.equal(concept.sourceTissue,'neural-organ');
  assert.equal(concept.region,'head-neck');
  assert(concept.bindings.some((binding:{fma:string;side:string;file:string})=>
   binding.fma===identity.fmaId&&binding.side===identity.laterality&&binding.file===identity.sources[0].file));
  const suffix=' Source surfaces do not trace axons or establish patient registration. Radiologist review pending.';
  assert(concept.explanation.endsWith(suffix),entry.key);
  for(const code of emitted)for(const value of [entry.key,concept.prompt,concept.explanation.slice(0,-suffix.length),suffix,...concept.references.map((ref:{url:string})=>ref.url)])
   assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${entry.key}: emitted teaching missing ${value}`);

  const session=create(id);
  assert(session,entry.key);
  const question=session.questions[0];
  assert.equal(question.target,id);
  assert.equal(question.reasoning.key,entry.key);
  assert.equal(question.reasoning.prompt,concept.prompt);
  assert.equal(question.reasoning.explanation,concept.explanation);
  assert.equal(question.choices.length,identity.laterality==='midline'?2:4);
  assert.equal(new Set(question.choices).size,question.choices.length);
  assert(question.choices.every((choice:string)=>catalog.structures.some((item:{id:string;laterality:string})=>item.id===choice&&item.laterality===identity.laterality)));
  const action={sessionId:session.id,index:0};
  const right=api.practiceReducer(session,{type:'answer',...action,chosen:id});
  assert.equal(api.practiceScore(right),1);
  const wrongId=question.choices.find((choice:string)=>choice!==id);
  const wrong=api.practiceReducer(session,{type:'answer',...action,chosen:wrongId});
  assert.equal(api.practiceScore(wrong),0);
  assert.deepEqual(api.missedPracticeIds(api.practiceReducer(wrong,{type:'next',...action}).responses),[id]);
  for(const changed of [
   {...source,name:'changed source'},
   {...source,sources:source.sources.map((item:{sha256:string},index:number)=>index?item:{...item,sha256:'0'.repeat(64)})},
  ]){
   assert.equal(api.brainConnectionsReasoningSourceMatches(changed,entry.key),false);
   assert.equal(api.reasoningConceptFor(changed),undefined);
  }

  const packet=wire(await api.bodyReviewMaterial(id));
  const context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.deepEqual(packet.source.structure,identity);
  assert.equal(packet.reasoning?.key,entry.key);
  assert.equal(packet.reasoning.readiness,'draft');
  assert.equal(packet.reasoning.answerId,id);
  assert.equal(packet.reasoning.prompt,question.reasoning.prompt);
  assert.equal(packet.reasoning.explanation,question.reasoning.explanation);
  assert.equal(packet.reasoning.choices.length,question.choices.length);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const edit of [
   (copy:any)=>{copy.source.structure.name+=' changed';},
   (copy:any)=>{copy.reasoning.prompt+=' changed';},
   (copy:any)=>{copy.reasoning.choices.find((choice:{id:string})=>choice.id===id).sources[0].sha256='0'.repeat(64);},
   (copy:any)=>{copy.reasoning.answerId=wrongId;},
  ]){
   const altered=wire(packet);edit(altered);
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${entry.key}: changed Review packet accepted`);
  }
  let storageCalls=0;
  const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:'0'.repeat(64),checklistVersion:context.checklistVersion,
   draft:api.blankBodyReview(context,'teaching')};
  const response=await api.postBodyDecision(new Request('https://review.test/api/body-review/decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},
   body:JSON.stringify(decision)}),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
  assert.equal(response.status,409,entry.key);
  assert.equal(storageCalls,0,entry.key);
 }
});
