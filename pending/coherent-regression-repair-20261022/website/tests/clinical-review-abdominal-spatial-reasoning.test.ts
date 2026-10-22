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
const parent='f89b6c01aec40fba4de81e26ec433ef4fe2b5e96';
const priorConceptsSha256='2c3f4292985e5e5e30ec1394eeb4262aeb3565ed9676e1c97589d3048a15db62';
const sourceHashes:Record<string,string>={
 'content/abdominal-spatial-reasoning-pins.json':'d9c0cebf0c7b85102a3738e8e80bb3efdf05c0f0a874643a8979fbcb1377cce1',
 'lib/abdominal-spatial-reasoning.ts':'c0b181982c21c1efe893ec8f9be9f3382809fbd6ed9770508309d50c358d94d4',
 'lib/reasoning-questions.ts':'c6b053f9b2d199bfcd3cb1508c833f5f6ccf1a7b2331c1ab073aa1a32a117824',
 'lib/atlas-practice.ts':'cee0a9436adbfa68d784d40fbf464d0b685c297b502128db20609db95b26fd68',
 'lib/anatomy-practice.ts':'6cc60a21919341e2dda7b56305c595f02e23eeb499b06191646e763de916a051',
 'public/models/bodyparts3d/full-body/catalog.json':'109ad372060f36fba1658a9968415884f279531eb5a3ecf047908bd6a6d6b0a7',
};
const expected=[
 ['abdominal-spatial-liver','FMA7197','unpaired',57,'abdomen-organs'],
 ['abdominal-spatial-pancreas','FMA7198','unpaired',3,'pancreas-corrected-parent'],
 ['abdominal-spatial-kidney','FMA7204','right',1,'abdomen-organs'],
 ['abdominal-spatial-kidney','FMA7205','left',1,'abdomen-organs'],
 ['abdominal-spatial-adrenal','FMA15629','right',1,'abdomen-organs'],
 ['abdominal-spatial-adrenal','FMA15630','left',1,'abdomen-organs'],
] as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('six exact abdominal spatial roots reach all learners and protected Review as draft questions',async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,CURRENT_ATLAS_REVISION);
 const sourceBytes=execFileSync('git',['show',`${revision}:content/abdominal-spatial-reasoning-pins.json`],
  {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
 assert.equal(sha(sourceBytes),sourceHashes['content/abdominal-spatial-reasoning-pins.json']);
 const sourcePin=JSON.parse(sourceBytes.toString());
 const pins=json('atlas-review/content/abdominal-spatial-reasoning-pins.json');
 assert.deepEqual(pins,sourcePin,'Review must import the exact immutable Atlas pin');
 assert.equal(pins.parentCommit,parent);
 assert.deepEqual(pins.entries.map((entry:any)=>[
  entry.key,entry.identity.fmaId,entry.identity.laterality,entry.identity.sources.length,entry.identity.bundle,
 ]),expected);
 assert.deepEqual(pins.entries[1].identity.sources.map((source:{file:string})=>source.file),
  ['FJ1895','FJ1896','FJ2630']);
 assert.equal(pins.entries[1].identity.sources.some((source:{file:string})=>source.file==='FJ2629'),false);

 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),
   digest,`${path}: 9f Git source`);
  const file=review.files.find((item:{path:string})=>item.path===path);
  assert(file,`Review missing ${path}`);
  assert.equal(file.sourceSha256,digest,path);
  assert.equal(file.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,admission.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  if(module==='head-neck'){
   const inputs=json(base+'source-inputs.json');
   for(const path of ['content/abdominal-spatial-reasoning-pins.json','lib/abdominal-spatial-reasoning.ts',
    'lib/reasoning-questions.ts'])
    assert.equal(inputs.find((item:{path:string})=>item.path===path)?.sha256,sourceHashes[path],`${module}: ${path}`);
  }
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 const learner=json(learnerBase+'manifest.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];

 const compiled=await build({stdin:{contents:[
  "export * from './atlas-review/lib/reasoning-questions';",
  "export * from './atlas-review/lib/abdominal-spatial-reasoning';",
  "export * from './atlas-review/lib/atlas-practice';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-decisions';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-api';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.equal(catalog.sourceVersion,pins.sourceVersion);
 assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
 for(const bundle of pins.bundles){
  assert.deepEqual(catalog.bundles.find((item:{id:string})=>item.id===bundle.id),bundle);
  const path=bundle.url.replace(/^\//,'').split('?')[0];
  const file=learner.files.find((item:{path:string})=>item.path===path);
  assert(file,`Learner missing ${path}`);
  assert.equal(file.bytes,bundle.bytes);
  assert.equal(file.sha256,bundle.sha256);
  const bytes=readFileSync(learnerBase+path);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(sha(bytes),bundle.sha256);
 }
 assert.equal(api.reasoningConcepts.length,190);
 assert.equal(sha(JSON.stringify(api.reasoningConcepts.slice(0,186))),priorConceptsSha256);
 assert.deepEqual(api.reasoningConcepts.slice(186).map((concept:{key:string})=>concept.key),[
  'abdominal-spatial-liver','abdominal-spatial-pancreas','abdominal-spatial-kidney','abdominal-spatial-adrenal',
 ]);
 assert.equal(catalog.structures.filter(api.reasoningConceptFor).length,343);
 const loaded=catalog.bundles.map((bundle:{id:string})=>bundle.id);
 const create=(id:string,items=catalog.structures,bundles=loaded)=>api.createPracticeSession(items,bundles,
  {id:1,mode:'reason',sampling:'all',count:1,retryIds:[id]},()=>0.314159);

 for(const entry of pins.entries){
  const identity=entry.identity,id=identity.id;
  const source=catalog.structures.find((item:{id:string})=>item.id===id);
  assert.deepEqual(source,identity,`${entry.key}: complete displayed identity`);
  assert.equal(api.abdominalSpatialReasoningSourceMatches(source,entry.key),true);
  const concept=api.reasoningConceptFor(source);
  assert.equal(concept?.key,entry.key);
  assert.equal(concept.region,'abdomen');
  assert.equal(concept.sourceTissue,'organ');
  assert.equal(concept.sourceTree,identity.sourceTree);
  assert.equal(concept.readiness,'draft');
  assert.equal(concept.revision,1);
  assert(concept.bindings.some((binding:{fma:string;side:string;file?:string;files?:string[]})=>
   binding.fma===identity.fmaId&&binding.side===identity.laterality&&
   JSON.stringify(binding.files??[binding.file])===JSON.stringify(identity.sources.map((item:{file:string})=>item.file))));
  assert.match(concept.explanation,/Radiologist review pending/);
  const limit=' This source identifies supplied gross-anatomy groups, not internal passages or a patient examination. Radiologist review pending.';
  assert(concept.explanation.endsWith(limit));
  for(const code of emitted)for(const value of [entry.key,concept.prompt,concept.explanation.slice(0,-limit.length),limit,
   ...concept.references.map((ref:{url:string})=>ref.url)])
   assert(visible(code,value),`${entry.key}: emitted teaching missing ${value}`);

  const session=create(id);
  assert(session,entry.key);
  const question=session.questions[0];
  assert.equal(question.target,id);
  assert.equal(question.reasoning.key,entry.key);
  assert.equal(question.reasoning.prompt,concept.prompt);
  assert.equal(question.reasoning.explanation,concept.explanation);
  assert.equal(question.choices.length,identity.laterality==='unpaired'?4:3);
  assert.equal(new Set(question.choices).size,question.choices.length);
  assert(question.choices.every((choice:string)=>catalog.structures.some((item:{id:string;laterality:string})=>
   item.id===choice&&item.laterality===identity.laterality)));
  const action={sessionId:session.id,index:0};
  assert.equal(api.practiceScore(api.practiceReducer(session,{type:'answer',...action,chosen:id})),1);
  const wrongId=question.choices.find((choice:string)=>choice!==id);
  const wrong=api.practiceReducer(session,{type:'answer',...action,chosen:wrongId});
  assert.equal(api.practiceScore(wrong),0);
  assert.deepEqual(api.missedPracticeIds(api.practiceReducer(wrong,{type:'next',...action}).responses),[id]);
  assert.equal(create(id,catalog.structures.filter((item:{id:string})=>item.id!==id)),null);
  assert.equal(create(id,catalog.structures,loaded.filter((bundle:string)=>bundle!==identity.bundle)),null);
  assert.equal(create(id,[source]),null,'same-side distractors are required');
  for(const changed of [
   {...source,name:'changed source'},
   {...source,sources:source.sources.map((item:{sha256:string},index:number)=>index?item:{...item,sha256:'0'.repeat(64)})},
  ]){
   assert.equal(api.abdominalSpatialReasoningSourceMatches(changed,entry.key),false);
   assert.equal(api.reasoningConceptFor(changed),undefined);
  }

  const packet=wire(await api.bodyReviewMaterial(id));
  const context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.equal(packet.reasoning?.key,entry.key);
  assert.equal(packet.reasoning.readiness,'draft');
  assert.equal(packet.reasoning.answerId,id);
  assert.equal(packet.reasoning.prompt,concept.prompt);
  assert.equal(packet.reasoning.explanation,concept.explanation);
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
   assert.equal(await api.parseBodyReviewResponse(altered,id),null,`${entry.key}: tampered Review packet accepted`);
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
