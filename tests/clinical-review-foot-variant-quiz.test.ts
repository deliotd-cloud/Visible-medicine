import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
// SHA-256 of exact `git show 4233534f:<path>` bytes in the Atlas checkout.
const sourceHashes:Record<string,string>={
 'content/foot-muscle-imaging-pins.json':'0d64ea48081d3141c72effe8e5f637d2784f75032d680f591519d0decc53f533',
 'content/foot-variant-quiz.ts':'303b622326b00a1de4fd95350d1d751c18a082de89557b208fb028f71683ca1a',
 'lib/foot-variant-quiz.ts':'4d071bb249f719eada4ad4df4da016246d026c0346561ac91627d71c100fc89a',
};
const expected:Record<string,{side:string;file:string}>={
 FMA86034:{side:'right',file:'FJ1399'},
 FMA86035:{side:'left',file:'FJ1399M'},
};
const sha=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('two foot variant Quiz drafts reach exact learner and protected Review bindings',async()=>{
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
   else assert.equal(found,undefined,`${module}: unexpected foot quiz dependency ${path}`);
  }
 }
 const learner=json(learnerBase+'manifest.json');
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const path of ['public/atlas-review',
  'public/atlas-runtime/head-neck/content/foot-variant-quiz.ts',
  'public/atlas-runtime/shoulder/content/foot-variant-quiz.ts',
  'public/atlas-review-viewer/content/foot-variant-quiz.ts'])
  assert.equal(existsSync(path),false,`${path}: held source must not be public`);
 const emitted=[emittedTeaching(learnerBase,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {footVariantQuizLesson} from './atlas-review/lib/foot-variant-quiz';",
  "export {footVariantQuizQuestions} from './atlas-review/content/foot-variant-quiz';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/foot-muscle-imaging-pins.json');
 assert.equal(pins.sourceVersion,catalog.sourceVersion);
 assert.deepEqual(pins.coordinateSystem,catalog.coordinateSystem);
 const selected=pins.entries.filter((entry:{group:string})=>entry.group==='opponensDigitiMinimi');
 assert.equal(selected.length,2);
 assert.deepEqual(new Set(selected.map((entry:{identity:{fmaId:string}})=>entry.identity.fmaId)),new Set(Object.keys(expected)));
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='foot');
 assert(scope,'foot learner scope');
 assert.equal(learner.regionalScopes.filter((item:{region:string})=>item.region==='foot').length,1);
 const question:{body:string;choices:readonly string[];correctAnswer:string;explanation:string;references:readonly string[]}=api.footVariantQuizQuestions.opponens;
 for(const {identity,group} of selected){
  const bound=expected[identity.fmaId];
  assert.equal(group,'opponensDigitiMinimi',identity.id);
  assert.equal(identity.region,'foot',identity.id);
  assert.equal(identity.category,'muscle',identity.id);
  assert.equal(identity.laterality,bound.side,identity.id);
  assert.equal(identity.bundle,'foot-muscles',identity.id);
  assert.equal(identity.nodeName,identity.fmaId,identity.id);
  assert.deepEqual(identity.sources.map((source:{file:string})=>source.file),[bound.file],identity.id);
  assert.equal(identity.validation.anatomicalReview,false,identity.id);
  assert.equal(identity.validation.status,'unvalidated',identity.id);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity,identity.id);
  assert(scope.regionalIds.includes(identity.id),`${identity.id}: missing foot selection`);
  const lesson=api.footVariantQuizLesson(identity,'quiz');
  assert(lesson,identity.id);
  assert.deepEqual(api.bodyLesson(identity,'quiz'),lesson,`${identity.id}: dispatch`);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · Foot variant quick check · draft`);
  assert.equal(lesson.body,question.body);
  assert.deepEqual(lesson.bullets,[...question.choices]);
  assert.equal(lesson.bullets.length,4);
  assert.equal(new Set(lesson.bullets).size,4);
  assert.equal(lesson.correctAnswer,question.correctAnswer);
  assert.equal(lesson.bullets.filter((answer:string)=>answer===lesson.correctAnswer).length,1);
  assert.equal(lesson.explanation,question.explanation);
  assert.deepEqual(lesson.citations,[...question.references]);
  assert.match(lesson.note,/revision-bound radiologist review pending/i);
  assert.notStrictEqual(lesson.bullets,question.choices);
  assert.notStrictEqual(lesson.citations,question.references);
  const next=api.footVariantQuizLesson(identity,'quiz');
  assert.notStrictEqual(next.bullets,lesson.bullets);
  assert.notStrictEqual(next.citations,lesson.citations);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,lesson.correctAnswer,
   lesson.explanation,...lesson.citations,lesson.note])
   assert(visible(code,value),`${identity.id}: emitted teaching missing ${value}`);
  for(const tab of ['ct','mri','ultrasound','xray'])
   assert.equal(api.footVariantQuizLesson(identity,tab),undefined,`${identity.id}:${tab}: no foot variant quiz`);
  for(const change of [{id:identity.id+'-foreign'},{name:'Foreign'},{fmaId:'FMA0'},
   {region:'foreign'},{bundle:'foreign'},{laterality:'foreign'},
   {sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},{bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.footVariantQuizLesson({...identity,...change},'quiz'),undefined,
    `${identity.id}: changed identity`);
  const packet=wire(await api.bodyReviewMaterial(identity.id));
  const context=await api.bodyReviewContext(identity.id);
  assert(packet&&context,identity.id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='quiz'),
   {tab:'quiz',...api.bodyLesson(identity,'quiz')},`${identity.id}: Review content`);
  assert.equal(context.structureId,identity.id);
  assert.equal(context.materialHash,packet.materialHash);
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert(context.teachingTabs.includes('quiz'),`${identity.id}: Review revision`);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const field of ['body','correctAnswer','explanation'] as const){
   const bad=wire(packet);
   bad.topics.find((topic:{tab:string})=>topic.tab==='quiz')[field]+=' foreign';
   assert.equal(await api.parseBodyReviewResponse(bad,identity.id),null,`${identity.id}: altered ${field}`);
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
 const bundle=catalog.bundles.find((item:{id:string})=>item.id==='foot-muscles');
 assert(bundle,'foot-muscles bundle');
 const modelPath=bundle.url.replace(/^\//,'').split('?')[0];
 const modelRecord=learner.files.find((file:{path:string})=>file.path===modelPath);
 assert(modelRecord,'foot-muscles learner model');
 assert.equal(modelRecord.bytes,bundle.bytes);
 assert.equal(modelRecord.sha256,bundle.sha256);
 assert.equal(sha(readFileSync(learnerBase+modelPath)),bundle.sha256);
 assert(learner.modelBundles.some((item:{id:string;sha256:string})=>item.id===bundle.id&&item.sha256===bundle.sha256));
});
