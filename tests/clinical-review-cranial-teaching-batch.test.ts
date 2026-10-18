import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
// SHA-256 of bytes from `git show 8bed1346:<path>` in the Atlas checkout.
const sourceHashes:Record<string,string>={
 'content/laryngeal-framework-quiz-pins.json':'6939f949134674656c8bfd05389ba16509c341e85eed03906331e2a1dd42cab1',
 'content/laryngeal-inlet-imaging.ts':'1f47ff04d07534f4924b276e667c2a8547aa5d5e7537fb82a80baa17df8b5b87',
 'lib/laryngeal-inlet-imaging.ts':'b4fe39b81cda6e7770101a9575b03b7e20c2081be544dd87795812eae741a442',
 'content/nasal-cartilage-quiz-pins.json':'c42f02da2a65fcdc4faaad275c049b77aa48754cfae4df7e0f263b8cbea716ae',
 'content/nasal-cartilage-quiz.ts':'b299fd6af4af6dbc93f4e4000d1870ca4cafd8a22f1e5d4e61df6f92865fc53c',
 'lib/nasal-cartilage-quiz.ts':'cc8f5ef81e4d86ba897a180ab9ff7839bb80ced605de247e8bbf82da20eb5373',
 'content/commissural-landmark-quiz-pins.json':'b8cbf4c4b6222903af5f7792c71ed25d176c5dac38863f5348e901c943493f8c',
 'content/commissural-landmark-quiz.ts':'46d762713110bf60bac6d5d39e67b787ed003d2219cce040fe730aa8dd242cd5',
 'lib/commissural-landmark-quiz.ts':'9402263c5cab269f1fa536800224cf0b1d648c361dd1bb343fa7b54a0fb25b86',
};
const expected:Record<string,{group:string;side:string;file:string;bundle:string;family:'laryngeal'|'nasal'|'commissural'}>={
 FMA55115:{group:'corniculate',side:'right',file:'FJ2793',bundle:'head-neck-connective-gaps',family:'laryngeal'},
 FMA55116:{group:'corniculate',side:'left',file:'FJ2776',bundle:'head-neck-connective-gaps',family:'laryngeal'},
 FMA55117:{group:'cuneiform',side:'right',file:'FJ2795',bundle:'head-neck-connective-gaps',family:'laryngeal'},
 FMA55118:{group:'cuneiform',side:'left',file:'FJ2773',bundle:'head-neck-connective-gaps',family:'laryngeal'},
 FMA59503:{group:'septal',side:'midline',file:'FJ2557',bundle:'head-neck-connective-recovery',family:'nasal'},
 FMA59505:{group:'alar',side:'right',file:'FJ2554',bundle:'head-neck-connective-recovery',family:'nasal'},
 FMA59506:{group:'alar',side:'left',file:'FJ2555',bundle:'head-neck-connective-recovery',family:'nasal'},
 FMA59512:{group:'lateral',side:'right',file:'FJ2558',bundle:'head-neck-connective-recovery',family:'nasal'},
 FMA59513:{group:'lateral',side:'left',file:'FJ2556',bundle:'head-neck-connective-recovery',family:'nasal'},
 FMA61970:{group:'forniceal',side:'midline',file:'FJ1741',bundle:'head-neck-nerves-deep-brain',family:'commissural'},
 FMA62072:{group:'posterior',side:'midline',file:'FJ1799',bundle:'head-neck-nerves-deep-brain',family:'commissural'},
};
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('eight laryngeal imaging and seven cranial Quiz drafts reach exact learner and Review bindings',async()=>{
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,revision);
 for(const [path,digest] of Object.entries(sourceHashes)){
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,path);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
 }
 const learnerBase='public/atlas-runtime/head-neck/';
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json'),inputs=json(base+'source-inputs.json');
  assert.equal(manifest.sourceCommit,revision,module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
  for(const [path,digest] of Object.entries(sourceHashes)){
   const found=inputs.find((file:{path:string})=>file.path===path);
   if(module==='head-neck'||module==='shoulder')assert.equal(found?.sha256,digest,`${module}: ${path}`);
   else assert.equal(found,undefined,`${module}: unexpected cranial dependency ${path}`);
  }
 }
 const learner=json(learnerBase+'manifest.json');
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {laryngealInletImagingLesson} from './atlas-review/lib/laryngeal-inlet-imaging';",
  "export {laryngealInletImagingTopics,laryngealInletImagingScope,laryngealInletImagingNote} from './atlas-review/content/laryngeal-inlet-imaging';",
  "export {nasalCartilageQuizLesson} from './atlas-review/lib/nasal-cartilage-quiz';",
  "export {nasalCartilageQuizQuestions} from './atlas-review/content/nasal-cartilage-quiz';",
  "export {commissuralLandmarkQuizLesson} from './atlas-review/lib/commissural-landmark-quiz';",
  "export {commissuralLandmarkQuizQuestions} from './atlas-review/content/commissural-landmark-quiz';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const pinFiles=[
  ['laryngeal','atlas-review/content/laryngeal-framework-quiz-pins.json'],
  ['nasal','atlas-review/content/nasal-cartilage-quiz-pins.json'],
  ['commissural','atlas-review/content/commissural-landmark-quiz-pins.json'],
 ] as const;
 const selected=pinFiles.flatMap(([family,path])=>{
  const pins=json(path);
  assert.equal(catalog.sourceVersion,'4.0',path);
  if(family==='laryngeal'){
   // This older pin format keeps sourceVersion on each identity's provenance.
   assert.equal(pins.parentCommit,'662a1e8c45673c15d7ed3acbebebe912cb0db9b8');
   assert.equal(pins.catalogHash,'f5ec1f9e357d0687adb6edde9ea5a0e9e3d6b6b5251bf2d824f835fd5393a638');
  }else assert.equal(pins.sourceVersion,catalog.sourceVersion,path);
  assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem,path);
  return pins.entries.filter((entry:{identity:{fmaId:string}})=>expected[entry.identity.fmaId]?.family===family)
   .map((entry:any)=>({...entry,family}));
 });
 assert.equal(selected.length,11);
 assert.deepEqual(new Set(selected.map((entry:any)=>entry.identity.fmaId)),new Set(Object.keys(expected)));
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='head-neck');
 assert(scope,'head-neck learner scope');
 assert.equal(learner.regionalScopes.filter((item:{region:string})=>item.region==='head-neck').length,1);
 const bundleIds=new Set<string>();
 for(const {identity,group,family} of selected){
  const bound=expected[identity.fmaId];
  assert.equal(group,bound.group,identity.id);
  assert.equal(identity.region,'head-neck',identity.id);
  assert.equal(identity.category,family==='commissural'?'organ':'cartilage',identity.id);
  assert.equal(identity.laterality,bound.side,identity.id);
  assert.equal(identity.bundle,bound.bundle,identity.id);
  assert.equal(identity.nodeName,identity.fmaId,identity.id);
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[bound.file],identity.id);
  assert.equal(identity.validation.anatomicalReview,false,identity.id);
  assert.equal(identity.validation.status,'unvalidated',identity.id);
  if(family==='laryngeal')assert.equal(identity.provenance.sourceVersion,catalog.sourceVersion,identity.id);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity,identity.id);
  assert(scope.regionalIds.includes(identity.id),`${identity.id}: missing head-neck selection`);
  bundleIds.add(identity.bundle);
  const tabs=family==='laryngeal'?['ct','mri']:['quiz'];
  for(const tab of tabs){
   const helper=family==='laryngeal'?api.laryngealInletImagingLesson:
    family==='nasal'?api.nasalCartilageQuizLesson:api.commissuralLandmarkQuizLesson;
   const lesson=helper(identity,tab);
   assert(lesson,`${identity.id}:${tab}`);
   assert.deepEqual(api.bodyLesson(identity,tab),lesson,`${identity.id}:${tab}`);
   assert.equal(lesson.readiness,'draft');
   if(family==='laryngeal'){
    const original:{body:string;bullets:readonly string[];citations:readonly string[]}=api.laryngealInletImagingTopics[group][tab];
    assert.equal(lesson.title,`${identity.name} · ${tab.toUpperCase()} orientation · draft`);
    assert.equal(lesson.body,original.body);
    assert.deepEqual(lesson.bullets,[...original.bullets,api.laryngealInletImagingScope]);
    assert.deepEqual(lesson.citations,[...original.citations]);
    assert.equal(lesson.note,api.laryngealInletImagingNote);
   }else{
    const original:{body:string;choices:readonly string[];correctAnswer:string;explanation:string;references:readonly string[]}=(family==='nasal'?api.nasalCartilageQuizQuestions:api.commissuralLandmarkQuizQuestions)[group];
    assert.equal(lesson.title,`${identity.name} · ${family==='nasal'?'Nasal cartilage':'Commissural landmark'} quick check · draft`);
    assert.equal(lesson.body,original.body);
    assert.deepEqual(lesson.bullets,[...original.choices]);
    assert.equal(lesson.bullets.length,4);
    assert.equal(new Set(lesson.bullets).size,4);
    assert.equal(lesson.correctAnswer,original.correctAnswer);
    assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
    assert.equal(lesson.explanation,original.explanation);
    assert.deepEqual(lesson.citations,[...original.references]);
   }
   assert.match(lesson.note,/revision-bound radiologist review pending/i);
   for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note,
    ...(family==='laryngeal'?[]:[lesson.correctAnswer,lesson.explanation])])
    assert(visible(code,value),`${identity.id}:${tab}: emitted teaching missing ${value}`);
   for(const change of [{id:identity.id+'-foreign'},{name:'Foreign'},{fmaId:'FMA0'},
    {region:'foreign'},{bundle:'foreign'},{laterality:'foreign'},
    {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},{bounds:{...identity.bounds,min:[0,0,0]}}])
    assert.equal(helper({...identity,...change},tab),undefined,`${identity.id}:${tab}: changed identity`);
  }
  const packet=wire(await api.bodyReviewMaterial(identity.id));
  const context=await api.bodyReviewContext(identity.id);
  assert(packet&&context,identity.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  for(const tab of tabs)assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab===tab),
   {tab,...api.bodyLesson(identity,tab)},`${identity.id}:${tab}: Review content`);
  assert.equal(context.structureId,identity.id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  for(const tab of tabs)assert(context.teachingTabs.includes(tab),`${identity.id}:${tab}: Review revision`);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const tab of tabs){
   const bad=wire(packet);
   bad.topics.find((topic:{tab:string})=>topic.tab===tab).body+=' foreign';
   assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,`${identity.id}:${tab}: altered teaching`);
  }
  const badSource=wire(packet);
  badSource.source.structure.sources[0].sha256='0'.repeat(64);
  assert.equal(await api.parseBodyReviewResponse(badSource,identity.id),null,`${identity.id}: altered source`);
  for(const claim of ['materialHash','revisionHash'] as const){
   let storageCalls=0;
   const payload={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,
    materialHash:context.materialHash,revisionHash:context.revisions.teaching,
    checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
   payload[claim]='0'.repeat(64);
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-reviewer'},
    body:JSON.stringify(payload),
   }),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
   assert.equal(response.status,409,`${identity.id}: stale ${claim}`);
   assert.equal(storageCalls,0,identity.id);
  }
 }
 assert.equal(bundleIds.size,3);
 for(const id of bundleIds){
  const bundle=catalog.bundles.find((item:{id:string})=>item.id===id);
  assert(bundle,id);
  const path=bundle.url.replace(/^\//,'').split('?')[0];
  const record=learner.files.find((file:{path:string})=>file.path===path);
  assert(record,`${id}: learner model missing`);
  assert.equal(record.bytes,bundle.bytes,id);
  assert.equal(record.sha256,bundle.sha256,id);
  assert.equal(sha(readFileSync(learnerBase+path)),bundle.sha256,id);
  assert(learner.modelBundles.some((item:{id:string;sha256:string})=>item.id===id&&item.sha256===bundle.sha256),id);
 }
});
