import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const atlas=currentAtlasDeliveryRoot();
const sourcePaths=[
 'content/central-vessel-imaging-pins.json',
 'content/abdominal-arterial-xray.ts',
 'lib/abdominal-arterial-xray.ts',
];
const expected=[
 ['abdominal-aorta','FMA3789',['FJ1932']],
 ['celiac','FMA50737',['FJ1846','FJ2013']],
 ['sma','FMA14749',['FJ1928','FJ2011']],
 ['ima','FMA14750',['FJ3442']],
] as const;
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const source=(path:string)=>execFileSync('git',['show',`${revision}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const normalized=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replace(/\r\n/g,'\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('four exact abdominal arterial X-ray drafts reach regional learner and protected Review',async()=>{
 const admission=validateCurrentAtlasDelivery();
 assert.equal(admission.source,CURRENT_ATLAS_REVISION);
 const review=json('atlas-review/manifest.json');
 const learnerBase='public/atlas-runtime/head-neck/';
 const learner=json(learnerBase+'manifest.json');
 const inputs=json(learnerBase+'source-inputs.json');
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(viewerBase+'manifest.json');
 assert.equal(review.revision,CURRENT_ATLAS_REVISION);
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(viewer.sourceCommit,CURRENT_ATLAS_REVISION);
 assert.equal(learner.patientDataIncluded,false);
 assert.equal(learner.clinicalApproved,false);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const path of sourcePaths){
  const committed=source(path);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,sha(committed),path);
  const imported=readFileSync('atlas-review/'+path);
  assert.equal(record.importedSha256,sha(imported),path);
  assert.equal(normalized(imported),normalized(committed),`${path}: imported source changed`);
  const checkedOut=readFileSync(`${atlas}/${path}`);
  assert.equal(normalized(checkedOut),normalized(committed),`${path}: Atlas checkout differs from source`);
  assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,
   sha(checkedOut),`regional learner input: ${path}`);
 }
 const pins=json('atlas-review/'+sourcePaths[0]);
 const entries=pins.entries.filter((entry:{group:string})=>expected.some(([group])=>group===entry.group));
 assert.deepEqual(entries.map((entry:{group:string;identity:{fmaId:string;sources:{file:string}[]}})=>[
  entry.group,entry.identity.fmaId,entry.identity.sources.map(part=>part.file),
 ]),expected);
 const ids=entries.map((entry:{identity:{id:string}})=>entry.identity.id);
 assert.equal(new Set(ids).size,4);
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='abdomen');
 assert(scope&&ids.every((id:string)=>scope.regionalIds.includes(id)));
 const emitted=[emittedTeaching(learnerBase,learner.files,true),
  emittedTeaching(viewerBase,viewer.files,true)];
 for(const path of sourcePaths.slice(1))for(const base of ['public/atlas-review/',learnerBase,viewerBase])
  assert.equal(existsSync(base+path),false,`${base+path}: source must not be public`);

 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {abdominalArterialXrayLesson} from './atlas-review/lib/abdominal-arterial-xray';",
  "export {abdominalArterialXrayTopics} from './atlas-review/content/abdominal-arterial-xray';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {celiacTeachingIdentity} from './atlas-review/lib/body-display-catalog';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
  "export {parseBodyDecisionPage} from './atlas-review/lib/body-review-client';",
  "export {bodyReviewStale} from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.abdominalArterialXrayTopics).sort(),expected.map(row=>row[0]).sort());
 const catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(catalog.coordinateSystem,pins.coordinateSystem);
 const celiacCorrection=json('atlas-review/public/models/bodyparts3d/celiac-display/display-correction.json');
 for(const {group,identity} of entries){
  const id=identity.id,topic=api.abdominalArterialXrayTopics[group];
  const display=catalog.structures.find((item:{id:string})=>item.id===id);
  assert.deepEqual(display,group==='celiac'?celiacCorrection.replacement:identity);
  if(group==='celiac'){
   assert.deepEqual(identity,celiacCorrection.original);
   assert.deepEqual(api.celiacTeachingIdentity(display),identity);
  }
  assert.equal(identity.region,'abdomen');
  assert.equal(identity.system,'vessels');
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  const lesson=api.abdominalArterialXrayLesson(display,'xray');
  assert.deepEqual(api.bodyLesson(display,'xray'),lesson);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.body,topic.body);
  assert.deepEqual(lesson.bullets.slice(1,1+topic.bullets.length),[...topic.bullets]);
  for(const citation of topic.citations)assert(lesson.citations.includes(citation),`${id}: missing reference`);
  assert.match(lesson.bullets.at(-2),/plain abdominal radiography, CT angiography and MR angiography are different examinations/);
  assert.match(lesson.bullets.at(-1),/do not reproduce a patient projection, lumen, flow or disease measurement/);
  assert.match(lesson.note,/revision-bound radiologist review pending/);
  assert.match(lesson.note,/No acquired angiogram.*patient scan.*clinical approval/);
  assert.match(lesson.note,/patient-space registration/);
  assert.match(lesson.note,/Atlas, Education case and paid-lecture access remain independent/);
  for(const code of emitted)for(const value of [topic.body,...topic.bullets,...topic.citations,
   ...lesson.bullets,lesson.note])assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
  for(const tab of ['anatomy','ct','mri','ultrasound','clinical'])
   assert.equal(api.abdominalArterialXrayLesson(display,tab),undefined,`${id}: ${tab}`);
  for(const changed of [{...display,name:'forged name'},
   {...display,sources:[{file:'FJ0',sha256:'0'.repeat(64)}]},
   {...display,bounds:{...display.bounds,min:[0,0,0]}}])
   assert.equal(api.abdominalArterialXrayLesson(changed,'xray'),undefined,`${id}: changed identity`);

  const packet=wire(await api.bodyReviewMaterial(id));
  const context=await api.bodyReviewContext(id);
  assert(packet&&context,id);
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,display);
  assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='xray'),{tab:'xray',...lesson});
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(context.revisions.imaging,null);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  assert.equal(await api.parseBodyReviewResponse(packet,ids.find((other:string)=>other!==id)),null,
   `${id}: foreign review identity`);
  const page={scope:'private-to-signed-in-user',context,reviews:[],history:[],
   track:'teaching',nextBefore:null};
  assert.deepEqual(api.parseBodyDecisionPage(page,id,packet.materialHash,'teaching').context,context);
  assert.throws(()=>api.parseBodyDecisionPage({...page,context:{...context,materialHash:'0'.repeat(64)}},
   id,packet.materialHash,'teaching'),/worksheet and current review material differ/);
  const savedIdentity={catalogScope:context.catalogScope,structureId:id,
   checklistVersion:context.checklistVersion,revisionHash:context.revisions.teaching,track:'teaching'};
  assert.equal(api.bodyReviewStale(savedIdentity,context),false);
  assert.equal(api.bodyReviewStale({...savedIdentity,revisionHash:'0'.repeat(64)},context),true,
   `${id}: stale teaching revision`);
  assert.equal(api.bodyReviewStale({...savedIdentity,structureId:ids.find((other:string)=>other!==id)},context),true,
   `${id}: foreign saved identity`);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((item:any)=>item.tab==='xray').citations[0]='https://forged.example';},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
  ]){const bad=wire(packet);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,id),null);}
 }
});
