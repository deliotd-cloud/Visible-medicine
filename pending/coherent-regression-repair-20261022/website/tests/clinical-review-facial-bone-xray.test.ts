import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourceHashes={
 'content/facial-bone-xray.ts':'36c85e89fd2ea01a3960eb0fdd8b082809141d586e465e42568bc51e751dae85',
 'lib/facial-bone-xray.ts':'d821653ad38d73b56eb09e36a6ad42ed25959f656b8eee8c7e4a4dc871fd423f',
} as const;
const expected={
 FMA53650:{id:'vm:anatomy:body:head-neck:left:bone:left-maxilla',name:'Left maxilla',side:'left',file:'FJ3269',sha256:'ba97a37d471d6db65bca375a6413fd09e69e102017fb8a104d07255212d1b576',family:'maxilla'},
 FMA53649:{id:'vm:anatomy:body:head-neck:right:bone:right-maxilla',name:'Right maxilla',side:'right',file:'FJ3375',sha256:'99fde288184e5d9ccb08ff5547fc1a693b2ef0d6a12a80e47b711f51bd3f7906',family:'maxilla'},
 FMA52893:{id:'vm:anatomy:body:head-neck:left:bone:left-zygomatic-bone',name:'Left zygomatic bone',side:'left',file:'FJ3287',sha256:'eb4176b5641daa0f68da7190b1d3e3c26716cdb3b4337b2c8ecd39dfd47618a1',family:'zygomatic'},
 FMA52892:{id:'vm:anatomy:body:head-neck:right:bone:right-zygomatic-bone',name:'Right zygomatic bone',side:'right',file:'FJ3392',sha256:'bda976acce1517ed5349e8a0ad8d71922c148b95bdde18381a5d808f690c3c0f',family:'zygomatic'},
} as const;
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('four facial-bone X-ray drafts bind exact learner and protected Review material',async()=>{
 const review=json('atlas-review/manifest.json');
 const pins=json('atlas-review/content/cranial-bone-imaging-pins.json');
 const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck']});
 const deliveryPin=validateCurrentAtlasDelivery();
 assert.equal(currentRevision,deliveryPin.source,'Review stays bound to current source');
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
  assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);
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
  "export {facialBoneXrayLesson} from './atlas-review/lib/facial-bone-xray';",
  "export {facialBoneXrayTeaching,facialBoneXrayReferences,facialBoneXrayNote} from './atlas-review/content/facial-bone-xray';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.equal(pins.sourceVersion,catalog.sourceVersion);
 assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem);
 assert.deepEqual(pins.bundles,[catalog.bundles.find((bundle:{id:string})=>bundle.id==='head-neck-skeleton')]);
 const bundle=pins.bundles[0];
 const model=learner.files.find((file:{path:string})=>file.path===bundle.url.replace(/^\//,''));
 assert(model,'Pinned model absent from real learner manifest');
 assert.equal(model.bytes,bundle.bytes);
 assert.equal(model.sha256,bundle.sha256);
 assert(learner.modelBundles.some((item:{id:string;sha256:string})=>item.id===bundle.id&&item.sha256===bundle.sha256));
 // Review imports source/catalogue only; model bytes belong to the learner delivery.
 assert.equal(sha(readFileSync(learnerBase+model.path)),bundle.sha256);

 const selected=pins.entries.filter((entry:{identity:{fmaId:string}})=>Object.hasOwn(expected,entry.identity.fmaId));
 assert.equal(selected.length,4);
 assert.deepEqual(new Set(selected.map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId)),new Set(Object.keys(expected)));
 for(const {identity,previous} of selected){
  const bound=expected[identity.fmaId as keyof typeof expected];
  assert.equal(identity.id,bound.id);
  assert.equal(identity.name,bound.name);
  assert.equal(identity.laterality,bound.side);
  assert.equal(identity.region,'head-neck');
  assert.equal(identity.bundle,bundle.id);
  assert.equal(identity.nodeName,identity.fmaId);
  assert.deepEqual(identity.sources,[{file:bound.file,sha256:bound.sha256}]);
  assert(learner.regionalIds.includes(identity.id),`${identity.id}: absent from learner selections`);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
  assert.equal(previous.ct.readiness,'pending');
  assert.equal(previous.mri.readiness,'pending');
  const lesson=api.facialBoneXrayLesson(identity,'xray');
  assert(lesson,identity.id);
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · xray orientation · draft`);
  const teaching=api.facialBoneXrayTeaching[bound.family];
  assert.equal(lesson.body,teaching.body);
  assert.deepEqual(lesson.bullets,teaching.bullets);
  assert.deepEqual(lesson.citations,teaching.citations.map((key:string)=>api.facialBoneXrayReferences[key]));
  assert.equal(lesson.note,api.facialBoneXrayNote);
  assert.match(lesson.note,/revision-bound radiologist sign-off pending/i);
  assert.match(lesson.note,/historical projection reference, not current acquisition or diagnostic advice/i);
  assert.match(lesson.note,/not patient registration or proof of radiographic visibility/i);
  assert.match(lesson.note,/Atlas, case and paid-lecture access remain independent/i);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
   assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${identity.id}: emitted teaching missing ${value}`);

  for(const tab of ['ct','mri','ultrasound','clinical','pathology'])
   assert.equal(api.facialBoneXrayLesson(identity,tab),undefined,`${identity.id}: ${tab}`);
  for(const change of [
   {id:identity.id+'-foreign'},{name:'Foreign'},{fmaId:'FMA0'},
   {laterality:identity.laterality==='left'?'right':'left'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}},
   {coverageNote:'Foreign'},
  ])assert.equal(api.facialBoneXrayLesson({...identity,...change},'xray'),undefined,`${identity.id}: changed identity`);

  const packet=wire(await api.bodyReviewMaterial(identity.id));
  const context=await api.bodyReviewContext(identity.id);
  assert(packet&&context,identity.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='xray'),{tab:'xray',...lesson});
  assert.equal(context.structureId,identity.id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').body+=' foreign';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').bullets[0]+=' foreign';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').citations[0]+='?foreign=1';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const bad=wire(packet);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,identity.id);}
  let storageCalls=0;
  const response=await api.postBodyDecision(new Request('https://review.test/api/body-review/decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},
   body:JSON.stringify({catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
    materialHash:'0'.repeat(64),revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')}),
  }),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
  assert.equal(response.status,409,identity.id);
  assert.equal(storageCalls,0,identity.id);
 }
});
