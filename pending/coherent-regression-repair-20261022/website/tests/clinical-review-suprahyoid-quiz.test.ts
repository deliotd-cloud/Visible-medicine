import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const revision='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const historicalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const previous='29d0738781d1acff7e2feb097d7ff9a10f35376e';
const atlas=currentAtlasDeliveryRoot();
const base='public/atlas-runtime/head-neck/';
const paths=['content/suprahyoid-muscle-quiz-pins.json','content/suprahyoid-muscle-quiz.ts','lib/suprahyoid-muscle-quiz.ts'];
const expected=[
 ['FMA46293','left','digastric','left-digastric'],
 ['FMA46292','right','digastric','right-digastric'],
 ['FMA46327','left','geniohyoid','left-geniohyoid'],
 ['FMA46322','left','mylohyoid','left-mylohyoid'],
 ['FMA45827','left','stylohyoid','left-stylohyoid'],
 ['FMA46326','right','geniohyoid','right-geniohyoid'],
 ['FMA46321','right','mylohyoid','right-mylohyoid'],
 ['FMA45826','right','stylohyoid','right-stylohyoid'],
] as const;
const questions={
 digastric:['Which pairing supplies the two digastric bellies?',
  ['Anterior: mylohyoid nerve (V3); posterior: facial nerve (VII)','Anterior: facial nerve (VII); posterior: mylohyoid nerve (V3)','Both: hypoglossal nerve (XII)','Both: facial nerve (VII)'],
  'Anterior: mylohyoid nerve (V3); posterior: facial nerve (VII)'],
 geniohyoid:['Which spinal nerve supplies geniohyoid via fibers carried with XII?',
  ['C2','C1','C3','C4'],'C1'],
 mylohyoid:['Where does mylohyoid originate on the mandible?',
  ['Mental spine','Digastric fossa','Mylohyoid line','Coronoid process'],'Mylohyoid line'],
 stylohyoid:['Which feature is the origin of stylohyoid?',
  ['Mastoid notch','Mental spine','Mylohyoid line','Posterior side of the styloid process'],
  'Posterior side of the styloid process'],
} as const;
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const source=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6});
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('eight exact suprahyoid questions reach the learner and protected Review as draft',async()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.runtimeSources.shoulder,revision);
 const learner=json(base+'manifest.json'),review=json('atlas-review/manifest.json');
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 const inputs=json(base+'source-inputs.json');
 assert.equal(learner.sourceCommit,pin.runtimeSources['head-neck']);
 assert.equal(review.revision,pin.source);
 assert.equal(viewer.sourceCommit,pin.source);
 assert.equal(learner.patientDataIncluded,false);
 assert.equal(learner.clinicalApproved,false);
 assert.equal(viewer.personalRecordsIncluded,false);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 for(const path of paths){
  const original=source(revision,path),digest=sha(original);
  assert.deepEqual(original,source(historicalRevision,path),path+' exact 9f quiz source');
  assert.deepEqual(source(pin.source,path),original,path+' exact current Review quiz source');
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
  assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,digest,path);
  assert.deepEqual(readFileSync('atlas-review/'+path).toString().replace(/\r\n/g,'\n'),
   original.toString().replace(/\r\n/g,'\n'),path);
 }
 const dispatch=review.files.find((file:{path:string})=>file.path==='app/body-content.ts');assert(dispatch);
 assert.equal(sha(source(historicalRevision,'app/body-content.ts')),'92add5e49675680abd55f687c08e7d4bbcfcb0ab34e1e0f611cc3da74c3fef9f');
 assert.equal(sha(source(revision,'app/body-content.ts')),'3deda6b748ed897afcd980ff24256aa20b165f8c1615fdc1e2f887211d69c1d2');
 const currentDispatch=sha(source(pin.source,'app/body-content.ts'));
 assert.equal(currentDispatch,'26320b064b5648f4f5b6ca8c123806a02dedefb761b894935707559d530882fc');
 assert.equal(dispatch.sourceSha256,currentDispatch);
 assert.equal(dispatch.importedSha256,sha(readFileSync('atlas-review/app/body-content.ts')));
 assert.equal(inputs.find((file:{path:string})=>file.path==='app/body-content.ts')?.sha256,currentDispatch);
 const pins=json('atlas-review/'+paths[0]);
 assert.equal(pins.parentCommit,'6d3de0ae013103a2eaf06e1263ecef21c10f0672');
 assert.equal(pins.entries.length,8);
 assert.deepEqual(pins.entries.map((entry:{identity:{fmaId:string;laterality:string;id:string};group:string})=>[
  entry.identity.fmaId,entry.identity.laterality,entry.group,entry.identity.id.split(':').at(-1),
 ]),expected);
 assert.equal(new Set(pins.entries.map((entry:{identity:{id:string}})=>entry.identity.id)).size,8);
 assert.deepEqual(pins.bundles.map((bundle:{id:string})=>bundle.id),['head-neck-muscles']);
 for(const bundle of pins.bundles){
  const path=bundle.url.slice(1),record=learner.files.find((file:{path:string})=>file.path===path);
  assert(record,path);assert.equal(record.sha256,bundle.sha256);
  assert.equal(sha(readFileSync(base+path)),bundle.sha256);
 }
 const compiled=await build({stdin:{contents:[
  "export {bodyLesson} from './atlas-review/app/body-content';",
  "export {suprahyoidMuscleQuizLesson} from './atlas-review/lib/suprahyoid-muscle-quiz';",
  "export {suprahyoidMuscleQuizQuestions} from './atlas-review/content/suprahyoid-muscle-quiz';",
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
  "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 assert.deepEqual(Object.keys(api.suprahyoidMuscleQuizQuestions).sort(),Object.keys(questions).sort());
 const emitted=[emittedTeaching(base,learner.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 for(const entry of pins.entries){
  const {identity,group}=entry,id=identity.id,q=api.suprahyoidMuscleQuizQuestions[group];
  assert.deepEqual([q.body,[...q.choices],q.correctAnswer],questions[group as keyof typeof questions]);
  assert.deepEqual(q.references,['https://anatomy.ttuhscep.edu/anatomytables/muscles_head_neck.html']);
  assert.equal(identity.region,'head-neck');assert.equal(identity.category,'muscle');
  assert.equal(identity.bundle,'head-neck-muscles');assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert.equal(entry.previous.readiness,'generated-identification');
  const lesson=api.bodyLesson(identity,'quiz');
  assert.deepEqual(lesson,api.suprahyoidMuscleQuizLesson(identity,'quiz'));
  assert.equal(lesson.readiness,'draft');assert.equal(lesson.body,q.body);
  assert.deepEqual(lesson.bullets,[...q.choices]);assert.equal(lesson.correctAnswer,q.correctAnswer);
  assert.equal(lesson.explanation,q.explanation);assert.deepEqual(lesson.citations,[...q.references]);
  assert.equal(lesson.bullets.filter((choice:string)=>choice===lesson.correctAnswer).length,1);
  assert.match(lesson.note,/revision-bound radiologist review pending/);
  assert.match(lesson.note,/No diagnosis or patient-specific interpretation/);
  assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,lesson.explanation,lesson.note])
   assert(visible(code,value),`${id}: emitted teaching missing ${value}`);
  assert.equal(api.suprahyoidMuscleQuizLesson(identity,'anatomy'),undefined);
  for(const change of ['id','side','source','bounds','approval']){
   const altered=wire(identity);
   if(change==='id')altered.id+='-copy';
   if(change==='side')altered.laterality='other';
   if(change==='source')altered.sources[0].sha256='0'.repeat(64);
   if(change==='bounds')altered.bounds.min[0]+=1;
   if(change==='approval')altered.validation.anatomicalReview=true;
   assert.equal(api.suprahyoidMuscleQuizLesson(altered,'quiz'),undefined,`${id}: ${change}`);
  }
  const packet=wire(await api.bodyReviewMaterial(id)),context=await api.bodyReviewContext(id);
  assert(packet&&context,id);assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet.source.structure,identity);
  assert.deepEqual(packet.topics.find((topic:{tab:string})=>topic.tab==='quiz'),{tab:'quiz',...lesson});
  assert.equal(context.sourceHash,packet.fingerprints.source);
  assert.equal(context.teachingHash,packet.fingerprints.teaching);
  assert(context.teachingTabs.includes('quiz'));
  assert.deepEqual(await api.parseBodyReviewResponse(packet,id),packet);
  for(const change of ['prior','question','answer','source']){
   const stale=wire(packet),index=stale.topics.findIndex((topic:{tab:string})=>topic.tab==='quiz');
   if(change==='prior')stale.topics[index]={tab:'quiz',...entry.previous};
   if(change==='question')stale.topics[index].body='Stale question';
   if(change==='answer')stale.topics[index].correctAnswer='Foreign answer';
   if(change==='source')stale.source.structure.sources[0].sha256='0'.repeat(64);
   assert.equal(await api.parseBodyReviewResponse(stale,id),null,`${id}: ${change}`);
  }
 }
 // The source milestone changes teaching only; model bytes remain identical across revisions.
 const models=(commit:string)=>execFileSync('git',['ls-tree','-r',commit,'--','public/models'],
  {cwd:atlas,windowsHide:true,maxBuffer:32e6}).toString().replace(/\r\n/g,'\n');
 assert.equal(models(revision),models(previous));
});
