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
const parent='ff5ff41986f2d87e6b1ecb4d572fb811510461fb';
const sourceHashes:Record<string,string>={
 'content/abdominal-vessel-reasoning-pins.json':'b625100eac15a4b8716a1c54ceecad08e239c78563fc8cac8f97f0d4364c2ce3',
 'lib/abdominal-vessel-reasoning.ts':'07cb5435d884cefb816d6593bd786c42c792972ba2d55f917fc7c9532a9a40d7',
 'lib/reasoning-questions.ts':'c6b053f9b2d199bfcd3cb1508c833f5f6ccf1a7b2331c1ab073aa1a32a117824',
};
const expected=[
 ['abdominal-vessel-celiac-artery','FMA50737','unspecified'],
 ['abdominal-vessel-superior-mesenteric-artery','FMA14749','midline'],
 ['abdominal-vessel-inferior-mesenteric-artery','FMA14750','unspecified'],
 ['abdominal-vessel-hepatic-portal-vein','FMA50735','unspecified'],
 ['abdominal-vessel-abdominal-aorta','FMA3789','midline'],
 ['abdominal-vessel-inferior-vena-cava','FMA10951','unspecified'],
] as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('six abdominal vessel reasoning drafts bind exact learner and protected Review source',async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,CURRENT_ATLAS_REVISION);
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/abdominal-vessel-reasoning-pins.json');
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 assert.equal(pins.parentCommit,parent);
 assert.equal(pins.entries.length,6);
 assert.deepEqual(pins.entries.map((entry:any)=>[entry.key,entry.identity.fmaId,entry.identity.laterality]),expected);
 for(const [path,digest] of Object.entries(sourceHashes)){
  assert.equal(sha(execFileSync('git',['show',`${revision}:${path}`],{cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}})),
   digest,`${path}: 9f Git source`);
  const file=review.files.find((item:{path:string})=>item.path===path);
  assert(file,path);
  assert.equal(file.sourceSha256,digest,path);
  assert.equal(file.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 const learnerInputs=json(learnerBase+'source-inputs.json');
 for(const [path,digest] of Object.entries(sourceHashes))
  assert.equal(learnerInputs.find((file:{path:string})=>file.path===path)?.sha256,digest,`learner ${path}`);
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const manifest=json(`public/atlas-runtime/${module}/manifest.json`);
  assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION,module);
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
  "export * from './atlas-review/lib/abdominal-vessel-reasoning';",
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
 const correction=json('atlas-review/public/models/bodyparts3d/celiac-display/display-correction.json');
 const rawCeliac=raw.structures.find((item:{fmaId:string})=>item.fmaId==='FMA50737');
 const celiac=catalog.structures.find((item:{fmaId:string})=>item.fmaId==='FMA50737');
 assert.deepEqual(rawCeliac,correction.original);
 assert.deepEqual(celiac,correction.replacement);
 assert.deepEqual(pins.entries[0].identity,correction.replacement);
 assert.equal(api.reasoningConceptFor(rawCeliac),undefined,'archived raw celiac record is not a question target');
 assert.equal(api.abdominalVesselReasoningSourceMatches(rawCeliac,pins.entries[0].key),false);
 assert.equal(api.abdominalVesselReasoningSourceMatches(celiac,pins.entries[0].key),true);
 assert.equal(api.reasoningConcepts.slice(0,182).length,182);
 // Count this milestone's original cohort, not later reasoning additions.
 const historicalKeys=new Set(api.reasoningConcepts.slice(0,182).map((c:{key:string})=>c.key));
 assert.equal(historicalKeys.size,182);
 assert.equal(catalog.structures.filter((s:any)=>{const c=api.reasoningConceptFor(s);return c&&historicalKeys.has(c.key);}).length,331);
 assert.deepEqual(api.reasoningConcepts.slice(176,182).map((concept:{key:string})=>concept.key),expected.map(row=>row[0]));
 const loaded=catalog.bundles.map((bundle:{id:string})=>bundle.id);
 const create=(id:string)=>api.createPracticeSession(catalog.structures,loaded,
  {id:1,mode:'reason',sampling:'all',count:1,retryIds:[id]},()=>0.314159);
 for(const entry of pins.entries){
  const identity=entry.identity,id=identity.id;
  const source=catalog.structures.find((item:{id:string})=>item.id===id);
  assert.deepEqual(source,identity,`${entry.key}: complete corrected display identity`);
  const concept=api.reasoningConceptFor(source);
  assert.equal(concept?.key,entry.key);
  assert.equal(concept.readiness,'draft');
  assert.equal(concept.revision,1);
  assert.equal(concept.sourceTissue,'vessel');
  assert.equal(concept.region,'abdomen');
  assert.deepEqual(concept.bindings.map((binding:{side:string})=>binding.side),[identity.laterality]);
  const suffix=' These source surfaces do not establish branch junctions, lumen continuity, flow, perfusion or patient anatomy. Radiologist review pending.';
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
  assert.equal(api.reasoningConceptFor({...source,name:'changed source'}),undefined);
  assert.equal(api.reasoningConceptFor({...source,sources:source.sources.map((item:{file:string;sha256:string},index:number)=>index?item:{...item,sha256:'0'.repeat(64)})}),undefined);

  const packet=wire(await api.bodyReviewMaterial(id));
  const context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
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
