import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const baseline='70da224dc1648d346722f815a7e9c0b0c8049f97';
const revision='aa290176f8bfdb02157f7197e4647508c9c41d87';
const pinsHash='73a6cc4e9f002faa2ad14704e67a22b7912514eb13e1dac08d0b7dc599192ce4';
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const normalized=(s:string)=>s.replaceAll('\r\n','\n');
async function load(previous=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/lib/tarsal-bone-quiz';
 export * from './atlas-review/lib/content-types';export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:previous?[{name:'exact-pre-tarsal-import',setup(api:import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json'].includes(p))return;
   return{contents:old(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('four exact Atlas imports retain assets and independent access; fourteen quick checks reach the regional learner and Review',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),epoch=JSON.parse(old('atlas-review/manifest.json'));
 assert.equal(review.revision,revision);assert.equal(review.files.length,985);assert.equal(epoch.files.length,982);
 assert.deepEqual(review.packages,epoch.packages);
 assert.deepEqual(review.files.filter((f:any)=>!epoch.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/tarsal-bone-quiz-pins.json','content/tarsal-bone-quiz.ts','lib/tarsal-bone-quiz.ts']);
 assert.deepEqual(review.files.filter((f:any)=>epoch.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 const pins=json('atlas-review/content/tarsal-bone-quiz-pins.json');
 assert.equal(sha(JSON.stringify(pins)),pinsHash);assert.equal(pins.parentCommit,'871c57b7729476bb08cbf04d58732b90fc4b52c5');
 assert.equal(pins.entries.length,14);assert.equal(new Set(pins.entries.map((e:any)=>e.group)).size,7);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 for(const p of ['package.json','package-lock.json','components/AtlasExplorer.tsx','components/ImagingAtlasPage.tsx','lib/atlas-delivery-access.ts','lib/lecture-repository.ts'])
  assert.equal(normalized(readFileSync(p,'utf8')),normalized(old(p)),p+' unchanged');
 for(const p of ['LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-practice.ts','lib/reasoning-questions.ts','lib/anatomy-practice.ts'])
  assert.equal(normalized(readFileSync('atlas-review/'+p,'utf8')),normalized(old('atlas-review/'+p)),p+' unchanged');
 let learnerCode='';
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),before=JSON.parse(old(base+'manifest.json'));
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),before.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,base+f.path);
  const inputs=json(base+'source-inputs.json'),prior=JSON.parse(old(base+'source-inputs.json'));
  assert.equal(inputs.length,({'head-neck':958,shoulder:637,'female-pelvis':111,'lower-limb':100} as Record<string,number>)[name]);
  assert.deepEqual(inputs.filter((f:any)=>!prior.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
   name==='head-neck'||name==='shoulder'?['content/tarsal-bone-quiz-pins.json','content/tarsal-bone-quiz.ts','lib/tarsal-bone-quiz.ts']:[]);
  const advanced=new Set(['app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
  for(const p of prior){if(advanced.has(p.path))continue;assert.deepEqual(inputs.find((f:any)=>f.path===p.path),p,`${name}: ${p.path}`);}
  if(name==='head-neck'||name==='shoulder'){
   for(const p of ['app/body-content.ts','content/tarsal-bone-quiz-pins.json','content/tarsal-bone-quiz.ts','lib/tarsal-bone-quiz.ts'])
    assert.equal(inputs.find((f:any)=>f.path===p)?.sha256,review.files.find((f:any)=>f.path===p)?.sourceSha256,p);
  }else assert.equal(inputs.some((f:any)=>f.path==='app/body-content.ts'),false);
  if(name==='head-neck')learnerCode=emittedTeaching(base,manifest.files,true);
  // The dedicated shoulder, pelvis and lower-limb viewers have distinct panels.
 }
 const viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);
 for(const f of viewer.files)assert.equal(sha(readFileSync(viewerBase+f.path)),f.sha256);
 const reviewCode=emittedTeaching(viewerBase,viewer.files,true);
 // An unused teaching chunk must not count as delivery from the Review entry.
 const disconnectedEntry=Buffer.from('<!doctype html><title>Disconnected entry</title>');
 const disconnectedFiles=viewer.files.map((f:any)=>f.path==='index.html'?{...f,sha256:sha(disconnectedEntry)}:f);
 assert.throws(()=>emittedTeaching(viewerBase,disconnectedFiles,true,
  p=>p===viewerBase+'index.html'?disconnectedEntry:readFileSync(p)),/Teaching is reachable through emitted entry imports/);
 for(const entry of pins.entries){const lesson=api.tarsalBoneQuizLesson(entry.identity,'quiz');assert(lesson);
  for(const value of [lesson.body,...lesson.bullets,lesson.correctAnswer,lesson.explanation,...lesson.citations,lesson.note])
   for(const code of [learnerCode,reviewCode])assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);
 }
});

test('exactly fourteen quiz topics and worksheets advance; synthetic stale decisions and altered source are refused',async()=>{
 const current=await load(),previous=await load(true),catalog=current.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/tarsal-bone-quiz-pins.json'),targets=new Map(pins.entries.map((e:any)=>[e.identity.id,e]));
 assert.equal(catalog.structures.length,1104);assert.equal(targets.size,14);
 const identities=new Map([
  ['FMA24498',['FJ3256','left','calcaneus']],['FMA24529',['FJ3258','left','cuboid']],
  ['FMA24524',['FJ3264','left','intermediate-cuneiform']],['FMA24526',['FJ3267','left','lateral-cuneiform']],
  ['FMA24522',['FJ3271','left','medial-cuneiform']],['FMA24483',['FJ3280','left','talus']],
  ['FMA24501',['FJ3307','left','navicular']],['FMA24500',['FJ3308','right','navicular']],
  ['FMA24497',['FJ3360','right','calcaneus']],['FMA24528',['FJ3364','right','cuboid']],
  ['FMA24523',['FJ3370','right','intermediate-cuneiform']],['FMA24525',['FJ3373','right','lateral-cuneiform']],
  ['FMA24521',['FJ3377','right','medial-cuneiform']],['FMA24482',['FJ3385','right','talus']],
 ]);
 assert.deepEqual(pins.entries.map((e:any)=>e.identity.fmaId).sort(),[...identities.keys()].sort());
 for(const e of pins.entries){const [file,side,group]=identities.get(e.identity.fmaId)!;
  assert.equal(e.group,group);assert.equal(e.identity.laterality,side);assert.deepEqual(e.identity.sources.map((s:any)=>s.file),[file]);
  assert.deepEqual(e.topics,['quiz']);assert.deepEqual(catalog.structures.find((s:any)=>s.id===e.identity.id),e.identity);
 }
 for(const bundle of pins.bundles){const matches=catalog.bundles.filter((b:any)=>b.id===bundle.id);assert.equal(matches.length,1);assert.deepEqual(matches[0],bundle);
  const bytes=readFileSync('public/atlas-runtime/head-neck'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const priorTopics=catalog.structures.map((s:any)=>({id:s.id,topics:current.contentTabs.map((tab:string)=>({tab,...previous.bodyLesson(s,tab)}))}));
 assert.equal(sha(JSON.stringify(priorTopics)),pins.previousAllTopicsHash,'Immutable 9936-topic prior baseline');
 let changed=0,preserved=0,changedWorksheets=0,unchangedWorksheets=0,stale=0,mutations=0;
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const s of [...catalog.structures].sort((a:any,b:any)=>Number(targets.has(b.id))-Number(targets.has(a.id)))){
  const entry=targets.get(s.id) as any;
  for(const tab of current.contentTabs){const before=previous.bodyLesson(s,tab),after=current.bodyLesson(s,tab),explicit=current.tarsalBoneQuizLesson(s,tab);
   if(!entry||tab!=='quiz'){assert.equal(explicit,undefined);assert.deepEqual(after,before,s.id+'|'+tab);preserved++;continue;}
   changed++;assert.deepEqual(before,entry.previous.quiz);assert.equal(before.readiness,'generated-identification');
   assert.equal(after.readiness,'draft');assert.deepEqual(after,explicit);assert.equal(after.bullets.length,4);
   assert(after.bullets.includes(after.correctAnswer));assert.match(after.note,/Revision-bound radiologist review is pending/);
   assert.match(after.note,/not patient imaging or clinical validation/);assert.match(after.note,/access remain independent/);
   assert.equal(new Set(after.citations).size,after.citations.length);assert(after.citations.every((url:string)=>new URL(url).protocol==='https:'));
   const copy=structuredClone(after);after.bullets.push('Foreign');after.citations.push('Foreign');assert.deepEqual(current.bodyLesson(s,tab),copy);
  }
  const before=await previous.bodyReviewMaterial(s.id),after=await current.bodyReviewMaterial(s.id);
  assert.deepEqual(after.source,before.source);assert.deepEqual(after.reasoning,before.reasoning);assert.deepEqual(after.guidedTours,before.guidedTours);
  assert.equal(after.fingerprints.source,before.fingerprints.source);assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!entry){assert.equal(after.fingerprints.teaching,before.fingerprints.teaching);unchangedWorksheets++;continue;}
  changedWorksheets++;assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);assert(await current.parseBodyReviewResponse(after,s.id));
  const foreign=structuredClone(after);foreign.topics.find((t:any)=>t.tab==='quiz').body='Foreign';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
  const context=await current.bodyReviewContext(s.id),prior=await previous.bodyReviewContext(s.id);
  assert.notEqual(context.revisions.teaching,prior.revisions.teaching);assert.equal(context.revisions.imaging,null);
  for(const delta of [{materialHash:before.materialHash},{revisionHash:prior.revisions.teaching}]){
   const response=await current.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_TARSAL_REVIEW'},body:JSON.stringify({catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:current.blankBodyReview(context,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);stale++;
  }
  for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:'foreign'},{regions:[]},{region:'foreign'},{system:'foreign'},{category:'foreign'},{sourceTree:'foreign'},{sourceName:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:{min:[0,0,0],max:[1,1,1]}},{anchor:[0,0,0]},{sources:[]},{sources:[...s.sources,...s.sources]},{sources:s.sources.map((f:any)=>({...f,sha256:'0'.repeat(64)}))},{center:[0,0,0]}]){
   assert.equal(current.tarsalBoneQuizLesson({...s,...patch},'quiz'),undefined);mutations++;
  }
 }
 assert.deepEqual({changed,preserved,changedWorksheets,unchangedWorksheets,stale,mutations},
  {changed:14,preserved:9922,changedWorksheets:14,unchangedWorksheets:1090,stale:28,mutations:252});
});
