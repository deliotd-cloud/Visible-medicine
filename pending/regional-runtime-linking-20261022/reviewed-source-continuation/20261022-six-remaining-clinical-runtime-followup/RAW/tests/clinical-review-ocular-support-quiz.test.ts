import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';

const historicalFeature='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
// SHA-256 of the committed Atlas Git blobs, whose LF bytes are imported by the pipeline.
const sourceHashes={
 'content/orbital-support-mri-pins.json':'51bb8a5fa92edb063e1003f503dc445f029ae6289ea1e6fb7fe81d0d185e55b0',
 'content/ocular-support-quiz.ts':'a91ac3791306aaae657e176cabc4c3b95f84ebaeb53b23165131fe8f57767ba2',
 'lib/ocular-support-quiz.ts':'63988d589594f50e1cdb358af25444e1b9a6e538d294349264cdad43db6d4999',
} as const;
const expected={
 FMA49144:{id:'vm:anatomy:body:head-neck:right:ligament:check-ligament-of-right-lateral-rectus',side:'right',file:'FJ1334',sha256:'d9ca3ac16a64fce45856a1bc9efcc1b69e64bd1d13476c8d7a3a761922610f00',bundle:'head-neck-connective-gaps',group:'check'},
 FMA49145:{id:'vm:anatomy:body:head-neck:left:ligament:check-ligament-of-left-lateral-rectus',side:'left',file:'FJ1284',sha256:'2bf9ca79c9454eb0b81d30f20d6b889343a6c3e974e19719233932052cf98708',bundle:'head-neck-connective-gaps',group:'check'},
 FMA49147:{id:'vm:anatomy:body:head-neck:right:ligament:check-ligament-of-right-medial-rectus',side:'right',file:'FJ1335',sha256:'d9e9be9082e35951f08cc43a0300f94145b8f99c7aaf049a8b773e2d9ad9a73e',bundle:'head-neck-connective-gaps',group:'check'},
 FMA49148:{id:'vm:anatomy:body:head-neck:left:ligament:check-ligament-of-left-medial-rectus',side:'left',file:'FJ1292',sha256:'1f1eae3eee17d09c5ae914f223b842bdd1a8bcf0c051953404ce09dff1693ed9',bundle:'head-neck-connective-gaps',group:'check'},
 FMA59091:{id:'vm:anatomy:body:head-neck:right:connective-tissue:tarsal-plate-of-right-upper-eyelid',side:'right',file:'FJ1375',sha256:'752358970eb428283dadd2db88fbb3de3d08b7b876a9e346a84c21cb90a5e70a',bundle:'head-neck-connective-ocular-detail',group:'tarsal'},
 FMA59092:{id:'vm:anatomy:body:head-neck:left:connective-tissue:tarsal-plate-of-left-upper-eyelid',side:'left',file:'FJ1324',sha256:'eeb0db9872f49810b69d7865328602d6419327b2f46fda388cd76f8960f5f188',bundle:'head-neck-connective-ocular-detail',group:'tarsal'},
 FMA59089:{id:'vm:anatomy:body:head-neck:right:connective-tissue:tarsal-plate-of-right-lower-eyelid',side:'right',file:'FJ1379',sha256:'fd33c2b682d289f26dc00f99cab43a8a835e15b5722d75850739a540517e4ff2',bundle:'head-neck-connective-ocular-detail',group:'tarsal'},
 FMA59090:{id:'vm:anatomy:body:head-neck:left:connective-tissue:tarsal-plate-of-left-lower-eyelid',side:'left',file:'FJ1328',sha256:'c3ba07f82baf4e55563d9736653ef768cb047bbf277a079aacbcfa780096d322',bundle:'head-neck-connective-ocular-detail',group:'tarsal'},
} as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('eight ocular support Quiz drafts bind exact learner and protected Review material',async()=>{
 const currentRevision=admitPreservedClinicalReview({revision:historicalFeature,sourceHashes,learnerModules:['head-neck','shoulder']});
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/orbital-support-mri-pins.json');
 assert.equal(review.revision,currentRevision);
 for(const [path,digest] of Object.entries(sourceHashes)){
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const manifest=json(`public/atlas-runtime/${module}/manifest.json`);
  assert.equal(manifest.sourceCommit,currentRevision,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
 }
 const learner=json(learnerBase+'manifest.json');
 const inputs=json(learnerBase+'source-inputs.json');
 for(const [path,digest] of Object.entries(sourceHashes))
  assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,digest,path);
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,currentRevision);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {ocularSupportQuizLesson} from './atlas-review/lib/ocular-support-quiz';",
  "export {ocularSupportQuizQuestions} from './atlas-review/content/ocular-support-quiz';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.ocularSupportQuizQuestions),['check','tarsal']);
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.equal(pins.sourceVersion,catalog.sourceVersion);
 assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem);
 const selected=pins.entries.filter((entry:{identity:{fmaId:string}})=>Object.hasOwn(expected,entry.identity.fmaId));
 assert.equal(selected.length,8);
 assert.deepEqual(new Set(selected.map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId)),new Set(Object.keys(expected)));
 const bundles=new Map<string,{id:string;url:string;bytes:number;sha256:string}>(catalog.bundles.map((bundle:{id:string;url:string;bytes:number;sha256:string})=>[bundle.id,bundle]));
 assert.deepEqual(new Set(pins.bundles.map((item:{id:string})=>item.id)),new Set(['head-neck-connective-gaps','head-neck-connective-head-detail','head-neck-connective-ocular-detail']));
 for(const pinned of pins.bundles){
  const id=pinned.id;
  const bundle=bundles.get(id);
  assert(bundle,id);
  assert.deepEqual(pinned,bundle);
  const model=learner.files.find((file:{path:string})=>file.path===bundle.url.replace(/^\//,''));
  assert(model,`${id}: model absent from learner manifest`);
  assert.equal(model.bytes,bundle.bytes,id);
  assert.equal(model.sha256,bundle.sha256,id);
  assert(learner.modelBundles.some((item:{id:string;sha256:string})=>item.id===id&&item.sha256===bundle.sha256),id);
  assert.equal(sha(readFileSync(learnerBase+model.path)),bundle.sha256,id);
 }

 for(const {identity} of selected){
  const bound=expected[identity.fmaId as keyof typeof expected];
  assert.equal(identity.id,bound.id);
  assert.equal(identity.laterality,bound.side);
  assert.equal(identity.region,'head-neck');
  assert.equal(identity.bundle,bound.bundle);
  assert.equal(identity.nodeName,identity.fmaId);
  assert.deepEqual(identity.sources,[{file:bound.file,sha256:bound.sha256}]);
  assert.equal(identity.validation.anatomicalReview,false);
  assert(learner.regionalIds.includes(identity.id),`${identity.id}: absent from learner selections`);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
  const lesson=api.ocularSupportQuizLesson(identity,'quiz');
  assert(lesson,identity.id);
  assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson);
  const question=api.ocularSupportQuizQuestions[bound.group];
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · Ocular support quick check · draft`);
  assert.equal(lesson.body,question.body);
  assert.deepEqual(lesson.bullets,[...question.choices]);
  assert.equal(lesson.bullets.length,4);
  assert.equal(new Set(lesson.bullets).size,4);
  assert.equal(lesson.correctAnswer,question.correctAnswer);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.equal(lesson.explanation,question.explanation);
  assert.deepEqual(lesson.citations,[...question.references]);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.note,/does not validate attachments, source geometry or patient registration/i);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,lesson.correctAnswer,lesson.explanation,...lesson.citations,lesson.note])
   assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${identity.id}: emitted teaching missing ${value}`);
  for(const tab of ['anatomy','function','ct','mri','xray','ultrasound','clinical','pathology'])
   assert.equal(api.ocularSupportQuizLesson(identity,tab),undefined,`${identity.id}: ${tab}`);
  for(const change of [
   {id:identity.id+'-foreign'},{name:'Foreign'},{fmaId:'FMA0'},
   {laterality:identity.laterality==='left'?'right':'left'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}},{coverageNote:'Foreign'},
  ])assert.equal(api.ocularSupportQuizLesson({...identity,...change},'quiz'),undefined,`${identity.id}: changed identity`);

  const packet=wire(await api.bodyReviewMaterial(identity.id));
  const context=await api.bodyReviewContext(identity.id);
  assert(packet&&context,identity.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='quiz'),{tab:'quiz',...lesson});
  assert.equal(context.structureId,identity.id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('quiz'));
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='quiz').body+=' foreign';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='quiz').bullets[0]+=' foreign';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='quiz').correctAnswer='Foreign answer';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='quiz').explanation+=' foreign';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='quiz').citations[0]+='?foreign=1';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const bad=wire(packet);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,identity.id);}
  for(const claim of ['materialHash','revisionHash'] as const){
   let storageCalls=0;
   const payload={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
   payload[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-review/decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},
    body:JSON.stringify(payload),
   }),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
   assert.equal(response.status,409,`${identity.id}: stale ${claim}`);
   assert.equal(storageCalls,0,identity.id);
  }
 }
});
