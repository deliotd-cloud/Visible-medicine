import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
import {validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
// SHA-256 of LF bytes from `git show <revision>:<path>` in the Atlas checkout.
const sourceHashes={
 'content/hand-venous-imaging-pins.json':'ecd70dc7b7a394882324b624b4b24ef31499f7aaabfa06e736c8ac917f7554ff',
 'content/dorsal-hand-ultrasound.ts':'44e9e88ed5d6c97898287102e6f1c4154db77fa734812ade516b34927f95ca8a',
 'lib/dorsal-hand-ultrasound.ts':'45784812cc4fc4343960fb9c3c494d5694caed41c3cfbf38cfc2df6a796c875a',
} as const;
const expected={
 FMA62506:{side:'right',id:'vm:anatomy:body:hand:right:vessel:dorsal-venous-network-of-right-hand',file:'FJ2280',sha256:'58c25d369779e6a50757cd89d1deefb7da82d5790e1242cea4b9b7e3d5e77759'},
 FMA62507:{side:'left',id:'vm:anatomy:body:hand:left:vessel:dorsal-venous-network-of-left-hand',file:'FJ2228',sha256:'f7ae1f851f00eb4378438f6de6a4bb9e109a9e2086a4475b9779cbe808e71d3e'},
} as const;
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('two exact dorsal hand ultrasound drafts reach learner and protected Review',async()=>{
 const review=json('atlas-review/manifest.json');
 const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck','shoulder']});
 const deliveryPin=validateCurrentAtlasDelivery();
 assert.equal(deliveryPin.source,currentRevision);
 assert.equal(review.revision,currentRevision);
 const pins=json('atlas-review/content/hand-venous-imaging-pins.json');
 for(const [path,digest] of Object.entries(sourceHashes)){
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  const inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,digest] of Object.entries(sourceHashes)){
   const actual=inputs.find((file:{path:string})=>file.path===path)?.sha256;
   if(module==='head-neck'||module==='shoulder')assert.equal(actual,digest,`${module}: ${path}`);
   else assert.equal(actual,undefined,`${module}: unexpected hand teaching dependency ${path}`);
  }
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 const learner=json(learnerBase+'manifest.json');
 const handScope=learner.regionalScopes.find((scope:{region:string})=>scope.region==='hand');
 assert(handScope,'shared hand regional scope');
 assert.equal(learner.regionalScopes.filter((scope:{region:string})=>scope.region==='hand').length,1);
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,currentRevision);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {dorsalHandUltrasoundLesson} from './atlas-review/lib/dorsal-hand-ultrasound';",
  "export {dorsalHandUltrasoundTeaching} from './atlas-review/content/dorsal-hand-ultrasound';",
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
 const selected=pins.entries.filter((entry:{identity:{fmaId:string}})=>Object.hasOwn(expected,entry.identity.fmaId));
 assert.equal(selected.length,2);
 assert.deepEqual(new Set(selected.map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId)),new Set(Object.keys(expected)));
 const bundle=pins.bundles.find((item:{id:string})=>item.id==='hand-vessels-hand-venous');
 assert(bundle);
 assert.deepEqual(catalog.bundles.find((item:{id:string})=>item.id===bundle.id),bundle);
 const model=learner.files.find((file:{path:string})=>file.path===bundle.url.replace(/^\//,''));
 assert(model);
 assert.equal(model.sha256,bundle.sha256);
 assert.equal(model.bytes,bundle.bytes);
 assert.equal(sha(readFileSync(learnerBase+model.path)),bundle.sha256);
 assert(learner.modelBundles.some((item:{id:string;sha256:string})=>item.id===bundle.id&&item.sha256===bundle.sha256));

 for(const {identity,group} of selected){
  const bound=expected[identity.fmaId as keyof typeof expected];
  assert.equal(group,'dorsal-hand-venous-detail');
  assert.equal(identity.id,bound.id);
  assert.equal(identity.laterality,bound.side);
  assert.equal(identity.region,'hand');
  assert.equal(identity.bundle,bundle.id);
  assert.equal(identity.nodeName,identity.fmaId);
  assert.deepEqual(identity.sources,[{file:bound.file,sha256:bound.sha256}]);
  assert.equal(identity.validation.anatomicalReview,false);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
  assert(handScope.regionalIds.includes(identity.id),`${identity.id}: absent from shared hand regional scope`);
  const lesson=api.dorsalHandUltrasoundLesson(identity,'ultrasound');
  assert(lesson,identity.id);
  assert.deepEqual(api.bodyLesson(identity,'ultrasound'),lesson);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · Ultrasound orientation · draft`);
  assert.equal(lesson.body,api.dorsalHandUltrasoundTeaching.body);
  assert.deepEqual(lesson.bullets,api.dorsalHandUltrasoundTeaching.bullets);
  assert.deepEqual(lesson.citations,api.dorsalHandUltrasoundTeaching.references);
  assert.equal(lesson.note,api.dorsalHandUltrasoundTeaching.note);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.match(lesson.body,/compressible veins from gliding tendons/i);
  assert(lesson.bullets.some((line:string)=>/tourniquet enhancement or near-infrared illumination, not ultrasound/i.test(line)));
  assert(lesson.bullets.some((line:string)=>/Palmar arches and digital or metacarpal vein groups are separate source identities/i.test(line)));
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
   assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${identity.id}: emitted teaching missing ${value}`);
  for(const tab of ['anatomy','function','ct','mri','xray','quiz','clinical','pathology'])
   assert.equal(api.dorsalHandUltrasoundLesson(identity,tab),undefined,`${identity.id}: ${tab}`);
  for(const change of [
   {id:identity.id+'-foreign'},{name:'Foreign'},{fmaId:'FMA0'},
   {laterality:identity.laterality==='left'?'right':'left'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {bounds:{...identity.bounds,min:[0,0,0]}},{coverageNote:'Foreign'},
  ])assert.equal(api.dorsalHandUltrasoundLesson({...identity,...change},'ultrasound'),undefined,`${identity.id}: changed identity`);

  const packet=wire(await api.bodyReviewMaterial(identity.id));
  const context=await api.bodyReviewContext(identity.id);
  assert(packet&&context,identity.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='ultrasound'),{tab:'ultrasound',...lesson});
  assert.equal(context.structureId,identity.id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('ultrasound'));
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='ultrasound').body+=' foreign';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='ultrasound').bullets[0]+=' foreign';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='ultrasound').citations[0]+='?foreign=1';},
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
