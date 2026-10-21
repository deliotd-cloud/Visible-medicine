import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const previous='5432e508f974703d817cfd02024e98803a7eaa72';
const atlas='F:/VisibleMedicine/atlas';
const sourcePaths=[
 'content/iliac-arterial-imaging-pins.json',
 'content/iliac-arterial-xray.ts',
 'lib/iliac-arterial-xray.ts',
];
const expected=[
 ['FMA14765','right','common','FJ3565'],
 ['FMA14766','left','common','FJ3464'],
 ['FMA18806','right','external','FJ3567'],
 ['FMA18807','left','external','FJ3466'],
 ['FMA18809','right','internal','FJ3569'],
 ['FMA18810','left','internal','FJ3468'],
] as const;
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const source=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6});
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('six exact iliac arterial X-ray drafts reach the pelvis learner and protected Review',async()=>{
 const review=json('atlas-review/manifest.json');
 const learnerBase='public/atlas-runtime/head-neck/';
 const learner=json(learnerBase+'manifest.json');
 const inputs=json(learnerBase+'source-inputs.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(review.revision,revision);
 assert.equal(learner.sourceCommit,revision);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(learner.patientDataIncluded,false);
 assert.equal(learner.clinicalApproved,false);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const path of sourcePaths){
  const committed=source(revision,path);
  const digest=sha(committed);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,path);
  // These three source files have exact LF bytes in both the checked-out source
  // and immutable Git objects; the learner must match without normalization.
  assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,
   digest,`learner: ${path}`);
 }
 assert.deepEqual(source(previous,sourcePaths[0]),source(revision,sourcePaths[0]),'existing pins changed');
 const pins=json('atlas-review/'+sourcePaths[0]);
 assert.deepEqual(pins.entries.map((entry:{identity:{fmaId:string;laterality:string;sources:{file:string}[]};group:string})=>[
  entry.identity.fmaId,entry.identity.laterality,entry.group,entry.identity.sources[0].file,
 ]),expected);
 assert.equal(new Set(pins.entries.map((entry:{identity:{id:string}})=>entry.identity.id)).size,6);
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='pelvis');
 assert(scope&&pins.entries.every((entry:{identity:{id:string}})=>scope.regionalIds.includes(entry.identity.id)));
 const emitted=[emittedTeaching(learnerBase,learner.files,true),
  emittedTeaching(viewerBase,viewer.files,true)];
 for(const path of sourcePaths.slice(1))for(const base of ['public/atlas-review/',learnerBase,viewerBase])
  assert.equal(existsSync(base+path),false,`${base+path}: source must not be public`);

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {iliacArterialXrayLesson} from './atlas-review/lib/iliac-arterial-xray';",
  "export {iliacArterialXrayTopics} from './atlas-review/content/iliac-arterial-xray';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {postBodyDecision} from './atlas-review/lib/body-review-api';",
  "export {blankBodyReview} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.iliacArterialXrayTopics).sort(),['common','external','internal']);
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
 assert.deepEqual(catalog.bundles.find((bundle:{id:string})=>bundle.id===pins.bundles[0].id),pins.bundles[0]);
 const bundlePath=pins.bundles[0].url.replace(/^\//,'').split('?')[0];
 const bundleFile=learner.files.find((file:{path:string})=>file.path===bundlePath);
 assert.equal(bundleFile?.sha256,pins.bundles[0].sha256);
 assert.equal(sha(readFileSync(learnerBase+bundlePath)),pins.bundles[0].sha256);
 for(const {identity,group} of pins.entries){
  const id=identity.id,topic=api.iliacArterialXrayTopics[group];
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===id),identity);
  assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.region,'pelvis');
  assert.equal(identity.category,'vessel');
  assert.equal(identity.bundle,pins.bundles[0].id);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  const lesson=api.iliacArterialXrayLesson(identity,'xray');
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.body,topic.body);
  assert.deepEqual(lesson.bullets.slice(1,1+topic.bullets.length),[...topic.bullets]);
  assert.deepEqual(lesson.citations,[...topic.citations]);
  assert.match(lesson.bullets[0],/contrast X-ray angiography, not a routine pelvic radiograph/);
  assert.match(lesson.bullets[0],/CT angiography and MR angiography are separate examinations/);
  assert.match(lesson.bullets.at(-1),/do not reproduce an acquired projection, vessel lumen, flow or disease measurement/);
  assert.match(lesson.note,/revision-bound radiologist review pending/);
  assert.match(lesson.note,/No angiogram, publisher image, patient scan, procedural instructions or clinical approval/);
  assert.match(lesson.note,/No patient-space registration/);
  assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/);
  for(const code of emitted)for(const value of [topic.body,...topic.bullets,...topic.citations,
   ...lesson.bullets,lesson.note])assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
  for(const tab of ['anatomy','ct','mri','ultrasound','clinical'])
   assert.equal(api.iliacArterialXrayLesson(identity,tab),undefined,`${id}: ${tab}`);
  for(const changed of [{...identity,name:'forged name'},
   {...identity,sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {...identity,bounds:{...identity.bounds,min:[0,0,0]}}])
   assert.equal(api.iliacArterialXrayLesson(changed,'xray'),undefined,`${id}: changed identity`);

  const packet=wire(await api.bodyReviewMaterial(id));
  const context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='xray'),{tab:'xray',...lesson});
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').citations[0]='https://forged.example';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const bad=wire(packet);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,id),null);}
  const base={catalogScope:context.catalogScope,structureId:id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,
   checklistVersion:context.checklistVersion,draft:api.blankBodyReview(context,'teaching')};
  for(const claim of ['materialHash','revisionHash'] as const){
   let storageCalls=0;
   const response=await api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
     'oai-authenticated-user-id':'synthetic-reviewer'},
    body:JSON.stringify({...base,[claim]:'0'.repeat(64)}),
   }),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
   assert.equal(response.status,409,`${id}: stale ${claim}`);
   assert.equal(storageCalls,0);
  }
  const forged=wire(base);
  forged.draft.checks.foreign=true;
  let storageCalls=0;
  const rejected=await api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
    'oai-authenticated-user-id':'synthetic-reviewer'},body:JSON.stringify(forged),
  }),{prepare(){storageCalls++;throw Error('Forged decision reached storage');}});
  assert.equal(rejected.status,422,`${id}: forged decision`);
  assert.equal(storageCalls,0);
 }
});
