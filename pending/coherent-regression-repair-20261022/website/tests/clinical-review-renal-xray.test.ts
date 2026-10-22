import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import {build} from 'esbuild';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const rawSha=(bytes:Buffer):string=>createHash('sha256').update(bytes).digest('hex');
const revisionSha=(value:unknown):string=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids={
 FMA7204:'vm:anatomy:body:abdomen:right:organ:right-kidney',
 FMA7205:'vm:anatomy:body:abdomen:left:organ:left-kidney',
} as const;
const citations=[
 'https://anatomy.ttuhscep.edu/anatomytables/viscera_abdomen.html',
 'https://www.bmj.com/content/345/sbmj.e5375',
 'https://www.radiologyinfo.org/en/info/ivp',
 'https://uroweb.org/guidelines/urolithiasis/chapter/guidelines',
];
const pins=JSON.parse(readFileSync('atlas-review/content/abdominal-organ-imaging-pins.json','utf8'));
const identities:any[]=pins.entries.filter((entry:any)=>Object.hasOwn(ids,entry.identity.fmaId)).map((entry:any)=>entry.identity);
assert.deepEqual(identities.map(identity=>identity.fmaId).sort(),Object.keys(ids).sort());
for(const identity of identities)assert.equal(identity.id,ids[identity.fmaId as keyof typeof ids]);
const bundled=build({stdin:{contents:[
 "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
 "export {abdominalOrganImagingLesson} from './atlas-review/lib/abdominal-organ-imaging';",
 "export {bodyReviewMaterial,bodyReviewSnapshot} from './atlas-review/lib/body-review-material';",
 "export {bodyReviewContext} from './atlas-review/lib/body-review-context';",
 "export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",
].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'})
 .then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')));

test('imported bilateral renal X-ray drafts bind the exact source and current Review worksheet',async()=>{
 const api=await bundled;
 const renderer=JSON.parse(readFileSync('atlas-review/content/body-renderer-revision.json','utf8'));
 for(const identity of identities){
  const lesson=api.abdominalOrganImagingLesson(identity,'xray');
  assert(lesson,identity.id);
  assert.equal(lesson.readiness,'draft');
  assert.equal(lesson.title,`${identity.name} · X-ray orientation · draft`);
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  const {readiness,...shown}=lesson;
  assert.deepEqual(api.bodyContent(identity,'xray'),shown);
  assert.equal(lesson.bullets.length,6);
  assert.equal(new Set(lesson.bullets).size,6);
  assert.deepEqual(lesson.citations,citations);
  assert.match(lesson.body,/renal regions beside the lumbar spine.*psoas margins/i);
  assert.match(lesson.body,/outer shadow is not a view of the internal collecting system/i);
  assert.match(lesson.bullets[1],/patient side, projection and image coverage/i);
  assert.match(lesson.bullets[2],/radiopacity varies with composition/i);
  assert.match(lesson.bullets[3],/intravenous pyelography.*injected iodinated contrast/i);
  assert.match(lesson.bullets[4],/no radiographic attenuation.*stone diagnosis.*renal function/i);
  assert.match(lesson.note,/review pending/i);
  assert.match(lesson.note,/No patient images, scan registration or paid-lecture access/);
  const snapshot=api.bodyReviewSnapshot(identity.id);
  const material=await api.bodyReviewMaterial(identity.id);
  const context=await api.bodyReviewContext(identity.id);
  assert(snapshot&&material&&context);
  assert.equal(material.approval,false);
  assert.deepEqual(material.source.structure,identity);
  assert.deepEqual(snapshot.source.structure,identity);
  assert.deepEqual(snapshot.topics.find((topic:any)=>topic.tab==='xray'),{tab:'xray',...lesson});
  assert.deepEqual(material.topics.find((topic:any)=>topic.tab==='xray'),{tab:'xray',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(material,identity.id),material);
  assert.deepEqual(await api.parseBodyReviewResponse(JSON.parse(JSON.stringify(material)),identity.id),material);
  assert.equal(context.catalogScope,'body-display-catalog');
  assert.equal(context.structureId,identity.id);
  assert.equal(context.structureName,identity.name);
  assert.equal(context.materialHash,material.materialHash);
  assert.equal(context.sourceHash,material.fingerprints.source);
  assert.equal(context.teachingHash,material.fingerprints.teaching);
  assert.equal(context.rendererHash,renderer.sha256);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(context.revisions.teaching,revisionSha({catalogScope:context.catalogScope,structureId:identity.id,
   checklistVersion:context.checklistVersion,source:context.sourceHash,teaching:context.teachingHash,checks:context.checklists.teaching}));
  for(const patch of [{id:identity.id+'-foreign'},{fmaId:'FMA0'},{name:'Foreign'},
   {sources:[...identity.sources,...identity.sources]},{coverageNote:'Foreign'},{foreign:true}])
   assert.equal(api.abdominalOrganImagingLesson({...identity,...patch},'xray'),undefined);
  for(const mutate of [
   (topic:any)=>{topic.body='A plain abdominal radiograph and excretory urography are different examinations. Urography uses contrast to depict the urinary tract; a plain film does not provide that opacification.';},
   (topic:any)=>{topic.bullets[1]+=' foreign';},
   (topic:any)=>{topic.citations[1]='https://foreign.example/';},
   (topic:any)=>{topic.note+=' foreign';},
  ]){
   const stale=structuredClone(material);
   mutate(stale.topics.find((topic:any)=>topic.tab==='xray'));
   assert.equal(await api.parseBodyReviewResponse(stale,identity.id),null,'Stale or forged renal X-ray text must not inherit the current material claim');
  }
 }
});

test('both learner runtimes contain the same renal X-ray source as imported Review',async()=>{
 const api=await bundled,review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const delivery=validateCurrentAtlasDelivery(),atlas=currentAtlasDeliveryRoot();
 assert.equal(review.revision,delivery.source);
 assert.match(review.revision,/^[a-f0-9]{40}$/);
 for(const name of ['head-neck','shoulder']){
  const base=`public/atlas-runtime/${name}/`;
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  assert.equal(learner.sourceCommit,delivery.runtimeSources[name]);
  assert.equal(learner.patientDataIncluded,false);
  assert.equal(learner.clinicalApproved,false);
  for(const path of ['content/abdominal-organ-imaging.ts','lib/abdominal-organ-imaging.ts']){
   const record=review.files.find((file:any)=>file.path===path);
   assert(record,path);
   const committed=(revision:string)=>execFileSync('git',['show',`${revision}:${path}`],
    {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
   assert.equal(record.sourceSha256,rawSha(committed(delivery.source)),`${path}: current Review source`);
   assert.equal(inputs.find((file:any)=>file.path===path)?.sha256,rawSha(committed(delivery.runtimeSources[name])),`${name}: exact family source`);
   assert.equal(rawSha(readFileSync('atlas-review/'+path)),record.importedSha256);
  }
  const js=learner.files.filter((file:any)=>file.path.endsWith('.js')).map((file:any)=>{
   const bytes=readFileSync(base+file.path);
   assert.equal(rawSha(bytes),file.sha256);
   return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }).join('\n');
  for(const identity of identities){
   const lesson=api.bodyLesson(identity,'xray');
   for(const marker of [lesson.body,...lesson.bullets,...lesson.citations])assert(js.includes(marker),name+' '+identity.id);
  }
 }
});
