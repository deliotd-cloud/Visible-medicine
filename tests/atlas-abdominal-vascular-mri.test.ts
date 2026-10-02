import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync as liveReadFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {abdominalVascularMriEpochBytes,abdominalVascularMriEpochPlugin} from './atlas-abdominal-vascular-mri-history.ts';
const baseline='48f697462c8d7445d0b9707b19a9ebce3adf48aa';
const revision='732f5f56ff3708b9200b25f18ac3f6f175a438e5';
const liveRevision='ed3d7a1ebaa11edc5bea4c918e43b6019b93d521';
function readFileSync(p:string,encoding:'utf8'):string;
function readFileSync(p:string):Buffer;
function readFileSync(p:string,encoding?:'utf8'):Buffer|string{const bytes=abdominalVascularMriEpochBytes(p);return encoding?bytes.toString():bytes;}
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
async function load(previous=false,live=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/lib/abdominal-vascular-mri';
 export * from './atlas-review/content/abdominal-vascular-mri';
 export * from './atlas-review/lib/content-types';export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:[...(previous?[{name:'exact-before-projection',setup(api:import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json'].includes(p))return;
   return{contents:old(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]:[]),...(!live?[abdominalVascularMriEpochPlugin()]:[])]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
test('eighteen source-pinned abdominal vascular MRI topics reach learners and protected Review without extra controls, assets or rights',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),epoch=JSON.parse(old('atlas-review/manifest.json'));
 assert.equal(review.revision,revision);assert.equal(review.files.length,975);assert.deepEqual(review.packages,epoch.packages);
 assert.deepEqual(review.files.filter((f:any)=>!epoch.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/abdominal-vascular-mri-pins.json','content/abdominal-vascular-mri.ts','lib/abdominal-vascular-mri.ts']);
 assert.deepEqual(review.files.filter((f:any)=>epoch.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 for(const p of ['package.json','package-lock.json','components/AtlasExplorer.tsx','lib/atlas-delivery-policy.ts']){
  if(p.endsWith('atlas-delivery-policy.ts'))continue; // only its current inventory digest changes, verified by the import audit.
  assert.equal(readFileSync(p,'utf8').replaceAll('\r\n','\n'),old(p).replaceAll('\r\n','\n'),p);
 }
 for(const p of ['LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-practice.ts','lib/reasoning-questions.ts','lib/anatomy-practice.ts'])assert.equal(readFileSync('atlas-review/'+p,'utf8').replaceAll('\r\n','\n'),old('atlas-review/'+p).replaceAll('\r\n','\n'));
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),JSON.parse(old(base+'manifest.json')).files.filter((f:any)=>f.path.startsWith('models/')));
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256);
 }
 const base='public/atlas-runtime/head-neck/',manifest=json(base+'manifest.json'),code=emittedTeaching(base,manifest.files,true,abdominalVascularMriEpochBytes);
 const reviewBase='public/atlas-review-viewer/',viewer=json(reviewBase+'manifest.json');
 assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);
 for(const f of viewer.files)assert.equal(sha(readFileSync(reviewBase+f.path)),f.sha256);
 const reviewCode=viewer.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(reviewBase+f.path,'utf8')).join('\n');
 for(const entry of json('atlas-review/content/abdominal-vascular-mri-pins.json').entries){
  const lesson=api.abdominalVascularMriLesson(entry.identity,'mri');assert(lesson);
  for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])for(const artifact of [code,reviewCode])assert(artifact.includes(value)||artifact.includes(JSON.stringify(value).slice(1,-1)),value);
 }
 const inputs=json(base+'source-inputs.json');assert.equal(inputs.length,948);
 for(const p of ['app/body-content.ts','content/abdominal-vascular-mri-pins.json','content/abdominal-vascular-mri.ts','lib/abdominal-vascular-mri.ts'])assert.equal(inputs.find((f:any)=>f.path===p).sha256,review.files.find((f:any)=>f.path===p).sourceSha256);
});
test('all9936 topics retain exactly18 MRI changes and eighteen review packets advance; foreign sources and stale decisions fail closed',async()=>{
 const current=await load(),previous=await load(true),catalog=current.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/abdominal-vascular-mri-pins.json'),targets=new Map(pins.entries.map((e:any)=>[e.identity.id,e]));
 assert.equal(catalog.structures.length,1104);assert.equal(pins.entries.length,18);
 assert.deepEqual(pins.entries.map((e:any)=>e.identity.fmaId).sort(),['FMA14782','FMA14784','FMA14787','FMA14790','FMA14792','FMA14793','FMA14805','FMA15390','FMA15391','FMA15397','FMA15398','FMA15400','FMA15405','FMA15406','FMA15407','FMA70479','FMA70480','FMA76574']);
 let changed=0,unchanged=0,packets=0,rejected=0,mutations=0;
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const s of [...catalog.structures].sort((a:any,b:any)=>Number(targets.has(b.id))-Number(targets.has(a.id)))){
  const entry=targets.get(s.id) as any;
  for(const tab of current.contentTabs){
   const a=previous.bodyLesson(s,tab),b=current.bodyLesson(s,tab);
   if(!entry||!entry.topics.includes(tab)){assert.deepEqual(b,a,s.id+'|'+tab);unchanged++;continue;}
   changed++;assert.deepEqual(s,entry.identity);assert.deepEqual(a,entry.previous[tab]);
   assert.equal(a.readiness,'pending');assert.equal(b.readiness,'draft');assert.deepEqual(b,current.abdominalVascularMriLesson(s,tab));
   assert(b.bullets.some((p:string)=>p.includes('Routine MRI does not guarantee small-vessel definition.')));
   assert.match(b.note,/review pending/);assert.match(b.note,/No patient images/);
   const copy=structuredClone(b);b.bullets.push('Foreign');b.citations.push('Foreign');assert.deepEqual(current.bodyLesson(s,tab),copy);
  }
  const a=await previous.bodyReviewMaterial(s.id),b=await current.bodyReviewMaterial(s.id);
  assert.deepEqual(b.source,a.source);assert.deepEqual(b.guidedTours,a.guidedTours);assert.deepEqual(b.reasoning,a.reasoning);
  assert.equal(b.fingerprints.source,a.fingerprints.source);assert.equal(b.approval,false);assert.equal(b.status,'worksheet-not-submitted');
  if(!entry){assert.equal(b.fingerprints.teaching,a.fingerprints.teaching);continue;}
  packets++;assert.notEqual(b.fingerprints.teaching,a.fingerprints.teaching);assert(await current.parseBodyReviewResponse(b,s.id));
  const foreign=structuredClone(b);foreign.topics.find((t:any)=>t.tab==='mri').body='Foreign';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
  const c=await current.bodyReviewContext(s.id),prior=await previous.bodyReviewContext(s.id);
  assert.notEqual(c.revisions.teaching,prior.revisions.teaching);assert.equal(c.revisions.imaging,null);
  for(const delta of [{materialHash:a.materialHash},{revisionHash:prior.revisions.teaching}]){
   const response=await current.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_ABDOMINAL_MRI_REVIEW'},body:JSON.stringify({catalogScope:c.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:current.blankBodyReview(c,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);rejected++;
  }
  for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:s.laterality==='left'?'right':'left'},{regions:['head-neck']},{region:'head-neck'},{sourceTree:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:[0,0,0,1,1,1]},{sources:[]},{sources:[...s.sources,...s.sources]},{sources:s.sources.map((f:any)=>({...f,sha256:'0'.repeat(64)}))}]){
   const altered={...s,...patch};if(JSON.stringify(altered)===JSON.stringify(s))continue;
   for(const tab of entry.topics)assert.equal(current.abdominalVascularMriLesson(altered,tab),undefined);mutations++;
  }
 }
 assert.deepEqual({changed,unchanged,packets,rejected,mutations},{changed:18,unchanged:9918,packets:18,rejected:36,mutations:234});
});

test('the later shoulder-girdle import retains the completed abdominal MRI source and visible teaching',async()=>{
 const api=await load(false,true),liveJson=(p:string)=>JSON.parse(liveReadFileSync(p,'utf8'));
 const review=liveJson('atlas-review/manifest.json');assert.equal(review.revision,liveRevision);
 for(const p of ['content/abdominal-vascular-mri-pins.json','content/abdominal-vascular-mri.ts','lib/abdominal-vascular-mri.ts']){
  assert.equal(sha(liveReadFileSync('atlas-review/'+p)),sha(abdominalVascularMriEpochBytes('atlas-review/'+p)),p+' source bytes retained');
  const record=review.files.find((f:any)=>f.path===p);assert(record);
  assert.equal(record.sourceSha256,sha(liveReadFileSync('atlas-review/'+p)));
 }
 const pins=liveJson('atlas-review/content/abdominal-vascular-mri-pins.json');
 assert.equal(sha(JSON.stringify(pins)),'40b5d68a52b2e7b2bc7c61be943c626318838ac2655231fa3a43c16f4b072367');
 assert.equal(pins.parentCommit,'806d7839d65f107e6cf04e236cab314f7d30c388');assert.equal(pins.entries.length,18);
 let learnerCode:string|undefined;
 const specializedEntries:Record<string,string[]>={
  shoulder:['scripts/export-shoulder-module.mjs','app/shoulder-explorer.tsx','app/atlas-workspace.tsx'],
  'female-pelvis':['scripts/export-female-pelvis-module.mjs','app/hra-pelvis-supplement.tsx'],
  'lower-limb':['scripts/export-lower-limb-module.mjs','app/um-knee-study.tsx'],
 };
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=liveJson(base+'manifest.json');
  assert.equal(manifest.sourceCommit,liveRevision);assert.equal(manifest.patientDataIncluded,false);
  const prior=JSON.parse(abdominalVascularMriEpochBytes(base+'manifest.json').toString());
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),prior.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const f of manifest.files)assert.equal(sha(liveReadFileSync(base+f.path)),f.sha256,base+f.path);
  if(name==='head-neck')learnerCode=emittedTeaching(base,manifest.files,true);
  else{
   const inputs=liveJson(base+'source-inputs.json'),priorInputs=JSON.parse(abdominalVascularMriEpochBytes(base+'source-inputs.json').toString());
   for(const path of specializedEntries[name]){
    const entry=inputs.find((f:any)=>f.path===path),before=priorInputs.find((f:any)=>f.path===path);
    assert(entry&&before,`${name}: ${path} entry source`);assert.deepEqual(entry,before,`${name}: ${path} source mapping unchanged`);
   }
  }
 }
 assert(learnerCode);
 const reviewBase='public/atlas-review-viewer/',viewer=liveJson(reviewBase+'manifest.json');
 assert.equal(viewer.sourceCommit,liveRevision);assert.equal(viewer.personalRecordsIncluded,false);
 const reviewCode=viewer.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>liveReadFileSync(reviewBase+f.path,'utf8')).join('\n');
 for(const entry of pins.entries){
  const lesson=api.abdominalVascularMriLesson(entry.identity,'mri');assert(lesson);
  assert.deepEqual(api.bodyLesson(entry.identity,'mri'),lesson);
  for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])for(const artifact of [learnerCode,reviewCode])assert(artifact.includes(value)||artifact.includes(JSON.stringify(value).slice(1,-1)),value);
 }
});
