import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {build} from 'esbuild';
import {regionalSpreadMilestoneBytes,withoutLumbarSacralNotice} from './atlas-lumbar-sacral-history.ts';
import {lumbarSacralMilestoneBytes} from './atlas-wrist-ultrasound-history.ts';

const revision='732f5f56ff3708b9200b25f18ac3f6f175a438e5';
const baseline='968f502957088c8d53c9bac025db0746d4c1424a';
const sourceParent='e3849b6a31eac0ae8e556d753d4fe86e5e19c90a';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function api(previous=false,lumbarMilestone=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/content/lumbar-sacral-quiz';export * from './atlas-review/lib/lumbar-sacral-quiz';
 export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';
 export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-decisions';export * from './atlas-review/lib/body-review-api';
 export * from './atlas-review/lib/nested-review-material';export * from './atlas-review/lib/nested-review';export * from './atlas-review/lib/nested-review-api';`,
 resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:previous||lumbarMilestone?[{name:'exact-lumbar-website-epochs',setup(p){
  for(const file of ['app/body-content.ts','content/body-renderer-revision.json'])p.onLoad({filter:file.endsWith('.ts')?/[\\/]app[\\/]body-content\.ts$/:/[\\/]content[\\/]body-renderer-revision\.json$/},args=>({contents:(lumbarMilestone?lumbarSacralMilestoneBytes:regionalSpreadMilestoneBytes)('atlas-review/'+file).toString(),loader:file.endsWith('.ts')?'ts':'json',resolveDir:dirname(args.path)}));
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('six exact lumbar/sacral questions reach lazy learner teaching and protected review as unsigned drafts',async()=>{
 const review=json('atlas-review/manifest.json'),prior=JSON.parse(regionalSpreadMilestoneBytes('atlas-review/manifest.json').toString());
 assert.equal(review.revision,revision);assert.equal(review.files.length,975);assert.deepEqual(review.packages,prior.packages);
 // Retain the original six-question editorial delta at its saved epoch. The
 // wrist regression separately proves the current eight Ultrasound additions.
 const lumbarEpoch=JSON.parse(lumbarSacralMilestoneBytes('atlas-review/manifest.json').toString());
 assert.deepEqual(lumbarEpoch.files.filter((f:any)=>!prior.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),['content/lumbar-sacral-quiz-pins.json','content/lumbar-sacral-quiz.ts','lib/lumbar-sacral-quiz.ts']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 const pins=json('atlas-review/content/lumbar-sacral-quiz-pins.json');assert.equal(pins.parentCommit,sourceParent);assert.equal(pins.entries.length,6);
 assert.deepEqual(pins.entries.map((e:any)=>e.identity.fmaId),['FMA13072','FMA13073','FMA13074','FMA13075','FMA13076','FMA16202']);
 const now=await api(),runtime=json('public/atlas-runtime/head-neck/manifest.json'),inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(inputs.length,948);assert.equal(runtime.sourceCommit,revision);
 const lazy=runtime.files.filter((f:any)=>/^assets\/body-content-[\w-]+\.js$/.test(f.path));assert.equal(lazy.length,1);
 const bytes=readFileSync('public/atlas-runtime/head-neck/'+lazy[0].path);assert.equal(sha(bytes),lazy[0].sha256);const text=bytes.toString();
 for(const entry of pins.entries){
  const lesson=now.bodyLesson(entry.identity,'quiz'),question=now.lumbarSacralQuizQuestions[entry.group];
  assert.equal(lesson.readiness,'draft');assert.deepEqual(lesson.bullets,question.choices);assert.equal(new Set(lesson.bullets).size,4);
  assert.equal(lesson.bullets.filter((choice:string)=>choice===lesson.correctAnswer).length,1);
  for(const field of ['body','correctAnswer','explanation']){assert.equal(lesson[field],question[field]);assert(text.includes(question[field]));}
  assert.deepEqual(lesson.citations,[question.reference]);assert(text.includes(question.reference));
  assert.match(lesson.note,/Radiologist review pending/);assert.match(lesson.note,/not patient imaging or registered CT\/MRI/);assert.match(lesson.note,/access remain independent/);
  const {readiness:_readiness,...shown}=lesson;assert.deepEqual(now.bodyContent(entry.identity,'quiz'),shown);
  const packet=await now.bodyReviewMaterial(entry.identity.id);assert.equal(packet.approval,false);assert.deepEqual(packet.source.structure,entry.identity);
  assert.deepEqual(packet.topics.find((t:any)=>t.tab==='quiz'),{tab:'quiz',...lesson});assert.deepEqual(await now.parseBodyReviewResponse(packet,entry.identity.id),packet);
  for(const field of ['correctAnswer','explanation','body']){const altered=structuredClone(packet);altered.topics.find((t:any)=>t.tab==='quiz')[field]+=' foreign';assert.equal(await now.parseBodyReviewResponse(altered,entry.identity.id),null);}
  const context=await now.bodyReviewContext(entry.identity.id);assert(context.teachingTabs.includes('quiz'));assert.equal(context.revisions.imaging,null);assert(context.blockers.imaging.length);
  assert.equal(now.lumbarSacralQuizLesson({...entry.identity,nodeName:'foreign'},'quiz'),undefined);
 }
 const oldPins=JSON.parse(regionalSpreadMilestoneBytes('atlas-review/content/body-review-display-pins.json').toString()),newPins=JSON.parse(lumbarSacralMilestoneBytes('atlas-review/content/body-review-display-pins.json').toString());
 const oldMap=new Map(oldPins.pins.map((p:any)=>[p.structureId,p.sha256]));assert.equal(newPins.pins.length,oldPins.pins.length);
 assert.deepEqual(newPins.pins.filter((p:any)=>p.sha256!==oldMap.get(p.structureId)).map((p:any)=>p.structureId).sort(),pins.entries.map((e:any)=>e.identity.id).sort());
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(execFileSync('git',['show',baseline+':lib/atlas-model-inventory.json'],{maxBuffer:32e6}).toString()).models);
 for(const name of ['head-neck','shoulder','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),old=JSON.parse(regionalSpreadMilestoneBytes(base+'manifest.json').toString());
  assert.equal(manifest.sourceCommit,revision);assert.equal(json(base+'source-inputs.json').length,({'head-neck':948,shoulder:628,'lower-limb':100} as Record<string,number>)[name]);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),old.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.deepEqual(manifest[flag],old[flag]);
  assert.equal(withoutLumbarSacralNotice(readFileSync(base+'LICENSES/THIRD_PARTY_NOTICES.md','utf8')),regionalSpreadMilestoneBytes(base+'LICENSES/THIRD_PARTY_NOTICES.md').toString());
  assert.deepEqual(readFileSync(base+'bundled-dependencies.json'),regionalSpreadMilestoneBytes(base+'bundled-dependencies.json'));
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
});

test('only six quiz topics change; unchanged teaching, nested scope and stale submission gates are retained',async()=>{
 const now=await api(false,true),before=await api(true),targets=new Set(json('atlas-review/content/lumbar-sacral-quiz-pins.json').entries.map((e:any)=>e.identity.id));
 assert.deepEqual(now.bodyReviewSummaries,before.bodyReviewSummaries);assert.equal(now.bodyReviewSummaries.length,1104);
 const storage=new Proxy({},{get(){throw Error('Stale or unsigned request reached storage');}});
 const request=(body:any)=>new Request('https://review.test/api/review',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_LUMBAR_QUIZ_TEST'},body:JSON.stringify(body)});
 let changed=0,unchanged=0,rejected=0,nested=0;
 for(const row of now.bodyReviewSummaries){
  const n=now.bodyReviewSnapshot(row.id),b=before.bodyReviewSnapshot(row.id),target=targets.has(row.id);assert.deepEqual(n.source,b.source);assert.deepEqual(n.reasoning,b.reasoning);assert.deepEqual(n.guidedTours,b.guidedTours);
  for(const topic of n.topics){const prior=b.topics.find((t:any)=>t.tab===topic.tab);if(target&&topic.tab==='quiz'){assert.equal(prior.readiness,'generated-identification');assert.equal(topic.readiness,'draft');changed++;}else{assert.deepEqual(topic,prior);unchanged++;}}
  const nc=await now.bodyReviewContext(row.id),bc=await before.bodyReviewContext(row.id);assert.equal(nc.sourceHash,bc.sourceHash);assert.equal(nc.revisions.imaging,null);assert.deepEqual(nc.checklists,bc.checklists);assert.deepEqual(nc.blockers,bc.blockers);assert.notEqual(nc.revisions.geometry,bc.revisions.geometry);
  if(!target){assert.equal(nc.teachingHash,bc.teachingHash);assert.equal(nc.revisions.teaching,bc.revisions.teaching);}
  else{assert.notEqual(nc.teachingHash,bc.teachingHash);assert.notEqual(nc.revisions.teaching,bc.revisions.teaching);}
  for(const track of target?['geometry','teaching']:['geometry']){
   const body={catalogScope:nc.catalogScope,structureId:row.id,track,expectedVersion:0,materialHash:nc.materialHash,revisionHash:bc.revisions[track],checklistVersion:nc.checklistVersion,draft:now.blankBodyReview(nc,track)};
   assert.equal((await now.postBodyDecision(request(body),storage)).status,409);rejected++;
  }
 }
 assert.deepEqual(now.nestedReviewRows,before.nestedReviewRows);
 for(const group of now.nestedReviewRows)for(const row of group.surfaces){const n=await now.nestedReviewMaterial(group.key,row.id),b=await before.nestedReviewMaterial(group.key,row.id),c=n.context,p=b.context;
  assert.deepEqual(n.source,b.source);assert.deepEqual(n.teaching,b.teaching);assert.equal(n.atlasLink,b.atlasLink);assert.equal(c.teachingHash,p.teachingHash);assert.equal(c.sourceHash,p.sourceHash);assert.equal(c.revisions.teaching,p.revisions.teaching);assert.equal(c.revisions.imaging,null);
  for(const[track,delta]of [['teaching',{materialHash:p.materialHash}],['geometry',{materialHash:p.materialHash}],['geometry',{revisionHash:p.revisions.geometry}]] as const){
   const body={catalogScope:c.catalogScope,nestedKey:c.nestedKey,structureId:c.structureId,sourceFrame:c.sourceFrame,materialHash:c.materialHash,revisionHash:c.revisions[track],checklistVersion:c.checklistVersion,track,expectedVersion:0,draft:now.blankNestedReview(c,track),...(delta as Record<string,string>)};
   assert.equal((await now.postNestedReview(request(body),storage)).status,409);rejected++;
  }nested++;
 }
 assert.deepEqual({changed,unchanged,nested,rejected},{changed:6,unchanged:9930,nested:108,rejected:1434});
});

test('historical notice replay refuses modified or duplicate additions and retains suffixes',()=>{
 const current=readFileSync('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md','utf8'),previous=regionalSpreadMilestoneBytes('atlas-review/LICENSES/THIRD_PARTY_NOTICES.md').toString();
 assert.equal(withoutLumbarSacralNotice(current),previous);
 assert.equal(withoutLumbarSacralNotice(current+'DEPENDENCY LICENCE SUFFIX'),previous+'DEPENDENCY LICENCE SUFFIX');
 assert.throws(()=>withoutLumbarSacralNotice(current.replace('Six original draft questions','Six changed draft questions')),/Altered/);
 assert.throws(()=>withoutLumbarSacralNotice(current+'\n## Lumbar and sacral structure checks — 2 October 2026\n'),/Duplicate/);
});
