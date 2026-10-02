import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync as liveReadFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {thoracoabdominalEpochBytes,thoracoabdominalEpochPlugin} from './atlas-thoracoabdominal-orientation-history.ts';

const baseline='d71bacf180d971cfc98a763414deedd3d8a6b0f0';
const revision='871c57b7729476bb08cbf04d58732b90fc4b52c5';
const pinsHash='79d77062dcb4edc4b3f0633b569a7148657a04e8c10653bd0ffe734a359fcfa6';
function readFileSync(p:string,encoding:'utf8'):string;
function readFileSync(p:string):Buffer;
function readFileSync(p:string,encoding?:'utf8'):Buffer|string{const bytes=thoracoabdominalEpochBytes(p);return encoding?bytes.toString():bytes;}
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const old=(p:string)=>execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:32e6});
const normalized=(s:string)=>s.replaceAll('\r\n','\n');
async function load(previous=false,live=false){
 const result=await build({stdin:{contents:`export * from './atlas-review/app/body-content';
 export * from './atlas-review/lib/thoracoabdominal-orientation';
 export * from './atlas-review/lib/content-types';export * from './atlas-review/lib/body-review-material';
 export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';
 export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';
 export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';`,resolveDir:process.cwd(),loader:'ts'},
 bundle:true,write:false,platform:'node',format:'esm',plugins:[...(previous?[{name:'exact-pre-thoracoabdominal-import',setup(api:import('esbuild').PluginBuild){
  api.onLoad({filter:/\.(?:ts|json)$/},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   if(!['atlas-review/app/body-content.ts','atlas-review/content/body-renderer-revision.json','atlas-review/content/body-review-display-pins.json'].includes(p))return;
   return{contents:old(p),loader:p.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });
 }}]:[]),...(live?[]:[thoracoabdominalEpochPlugin()])]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

test('nine exact-source thoracoabdominal drafts reach regional learner and protected Review without new assets or entitlements',async()=>{
 const api=await load(),review=json('atlas-review/manifest.json'),epoch=JSON.parse(old('atlas-review/manifest.json'));
 assert.equal(review.revision,revision);assert.deepEqual(review.packages,epoch.packages);
 assert.equal(review.files.length,epoch.files.length+3);
 assert.deepEqual(review.files.filter((f:any)=>!epoch.files.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
  ['content/thoracoabdominal-orientation-pins.json','content/thoracoabdominal-orientation.ts','lib/thoracoabdominal-orientation.ts']);
 assert.deepEqual(review.files.filter((f:any)=>epoch.files.some((p:any)=>p.path===f.path&&p.sourceSha256!==f.sourceSha256)).map((f:any)=>f.path).sort(),
  ['app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 for(const f of review.files)assert.equal(sha(readFileSync('atlas-review/'+f.path)),f.importedSha256,f.path);
 const pins=json('atlas-review/content/thoracoabdominal-orientation-pins.json');
 assert.equal(sha(JSON.stringify(pins)),pinsHash);assert.equal(pins.parentCommit,'f0ee3f2457aad7de214079cb50cbac4d28912688');
 assert.equal(pins.entries.length,8);assert.equal(pins.entries.reduce((n:number,e:any)=>n+e.topics.length,0),9);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(old('lib/atlas-model-inventory.json')).models);
 for(const p of ['package.json','package-lock.json','components/AtlasExplorer.tsx','components/ImagingAtlasPage.tsx','lib/atlas-delivery-access.ts','lib/lecture-repository.ts'])
  assert.equal(normalized(readFileSync(p,'utf8')),normalized(old(p)),p+' unchanged');
 for(const p of ['LICENSES/THIRD_PARTY_NOTICES.md','lib/atlas-practice.ts','lib/reasoning-questions.ts','lib/anatomy-practice.ts'])
  assert.equal(normalized(readFileSync('atlas-review/'+p,'utf8')),normalized(old('atlas-review/'+p)),p+' unchanged');
 for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
  const base='public/atlas-runtime/'+name+'/',manifest=json(base+'manifest.json'),before=JSON.parse(old(base+'manifest.json'));
  assert.equal(manifest.sourceCommit,revision);assert.equal(manifest.patientDataIncluded,false);
  assert.deepEqual(manifest.files.filter((f:any)=>f.path.startsWith('models/')),before.files.filter((f:any)=>f.path.startsWith('models/')));
  for(const f of manifest.files)assert.equal(sha(readFileSync(base+f.path)),f.sha256,base+f.path);
  const inputs=json(base+'source-inputs.json'),priorInputs=JSON.parse(old(base+'source-inputs.json'));
  assert.equal(inputs.length,({'head-neck':955,shoulder:634,'female-pelvis':111,'lower-limb':100} as Record<string,number>)[name]);
  assert.deepEqual(inputs.filter((f:any)=>!priorInputs.some((p:any)=>p.path===f.path)).map((f:any)=>f.path).sort(),
   name==='head-neck'||name==='shoulder'
    ? ['content/thoracoabdominal-orientation-pins.json','content/thoracoabdominal-orientation.ts','lib/thoracoabdominal-orientation.ts']
    : []);
  const advanced=new Set(['app/body-content.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
  for(const prior of priorInputs){if(advanced.has(prior.path))continue;
   const now=inputs.find((f:any)=>f.path===prior.path);assert.deepEqual(now,prior,`${name}: existing input ${prior.path}`);
  }
  if(name==='head-neck'||name==='shoulder'){
   for(const p of ['app/body-content.ts','content/thoracoabdominal-orientation-pins.json','content/thoracoabdominal-orientation.ts','lib/thoracoabdominal-orientation.ts'])
    assert.equal(inputs.find((f:any)=>f.path===p)?.sha256,review.files.find((f:any)=>f.path===p)?.sourceSha256,p);
  }
  if(name==='head-neck'){
   const code=emittedTeaching(base,manifest.files,true,thoracoabdominalEpochBytes);
   for(const entry of pins.entries)for(const tab of entry.topics){const lesson=api.thoracoabdominalOrientationLesson(entry.identity,tab);assert(lesson);
    for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
     assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`${name}: ${value}`);
   }
  }
  if(name==='female-pelvis'||name==='lower-limb')assert.equal(inputs.some((f:any)=>f.path==='app/body-content.ts'),false);
  // The dedicated shoulder viewer has a distinct note panel; an emitted but
  // unreachable body-content chunk there is not claimed as visible teaching.
 }
 const reviewBase='public/atlas-review-viewer/',viewer=json(reviewBase+'manifest.json');
 assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.personalRecordsIncluded,false);
 for(const f of viewer.files)assert.equal(sha(readFileSync(reviewBase+f.path)),f.sha256);
 const reviewCode=viewer.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(reviewBase+f.path,'utf8')).join('\n');
 for(const entry of pins.entries)for(const tab of entry.topics){const lesson=api.thoracoabdominalOrientationLesson(entry.identity,tab);assert(lesson);
  for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])
   assert(reviewCode.includes(value)||reviewCode.includes(JSON.stringify(value).slice(1,-1)),value);
 }
});

test('all 9936 topics and 1104 worksheets change only at pinned drafts; stale synthetic decisions fail before storage',async()=>{
 const current=await load(),previous=await load(true),catalog=current.bodyDisplayCatalog(json('public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json'));
 const pins=json('atlas-review/content/thoracoabdominal-orientation-pins.json'),targets=new Map(pins.entries.map((e:any)=>[e.identity.id,e]));
 assert.equal(catalog.structures.length,1104);assert.equal(targets.size,8);
 const identities=new Map([
  ['FMA3988',['FJ1936','right','superior-epigastric-artery']],['FMA4083',['FJ1971','left','superior-epigastric-artery']],
  ['FMA10692',['FJ1969','right','musculophrenic-artery']],['FMA4077',['FJ1979','left','musculophrenic-artery']],
  ['FMA4772',['FJ1996','right','musculophrenic-vein']],['FMA4786',['FJ1988','left','musculophrenic-vein']],
  ['FMA11336',['FJ1448','midline','linea-alba']],['FMA16549',['FJ3397','unspecified','mesoappendix']],
 ]);
 assert.deepEqual(pins.entries.map((e:any)=>e.identity.fmaId).sort(),[...identities.keys()].sort());
 for(const e of pins.entries){const [file,side,group]=identities.get(e.identity.fmaId)!;
  assert.equal(e.group,group);assert.equal(e.identity.laterality,side);assert.deepEqual(e.identity.sources.map((s:any)=>s.file),[file]);
  assert.deepEqual(e.topics,group==='mesoappendix'?['ct','mri']:['mri']);
  assert.deepEqual(catalog.structures.find((s:any)=>s.id===e.identity.id),e.identity);
 }
 for(const bundle of pins.bundles){const matches=catalog.bundles.filter((b:any)=>b.id===bundle.id);assert.equal(matches.length,1);assert.deepEqual(matches[0],bundle);
  const bytes=readFileSync('public/atlas-runtime/head-neck'+bundle.url.split('?')[0]);assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
 }
 const previousTopics=catalog.structures.map((s:any)=>({id:s.id,topics:current.contentTabs.map((tab:string)=>({tab,...previous.bodyLesson(s,tab)}))}));
 assert.equal(sha(JSON.stringify(previousTopics)),pins.previousAllTopicsHash,'Immutable 9936-topic prior baseline');
 let changed=0,preserved=0,changedWorksheets=0,unchangedWorksheets=0,stale=0,mutations=0;
 const storage=new Proxy({},{get(){throw Error('Stale request reached private storage');}});
 for(const s of [...catalog.structures].sort((a:any,b:any)=>Number(targets.has(b.id))-Number(targets.has(a.id)))){
  const entry=targets.get(s.id) as any;
  for(const tab of current.contentTabs){const before=previous.bodyLesson(s,tab),after=current.bodyLesson(s,tab),explicit=current.thoracoabdominalOrientationLesson(s,tab);
   if(!entry||!entry.topics.includes(tab)){assert.equal(explicit,undefined);assert.deepEqual(after,before,s.id+'|'+tab);preserved++;continue;}
   changed++;assert.deepEqual(before,entry.previous[tab]);assert.equal(before.readiness,'pending');assert.equal(after.readiness,'draft');assert.deepEqual(after,explicit);
   assert.match(after.note,/revision-bound radiologist review pending/);assert.match(after.note,/No patient images/);
   assert.match(after.note,/Didanix Education\/light/);assert.match(after.note,/spatial registration/);assert.match(after.note,/Case, Atlas and paid-lecture access remain independent/);
   assert(after.bullets.some((b:string)=>b.includes('Return separation to zero')));
   assert.equal(new Set(after.citations).size,after.citations.length);assert(after.citations.every((url:string)=>new URL(url).protocol==='https:'));
   if(entry.group==='musculophrenic-vein')assert(after.bullets.some((b:string)=>b.includes('complete venous drainage map')));
   if(entry.group==='mesoappendix')assert(after.bullets.some((b:string)=>b.includes('separately visible mesoappendix')));
   const copy=structuredClone(after);after.bullets.push('Foreign');after.citations.push('Foreign');assert.deepEqual(current.bodyLesson(s,tab),copy);
  }
  const before=await previous.bodyReviewMaterial(s.id),after=await current.bodyReviewMaterial(s.id);
  assert.deepEqual(after.source,before.source);assert.deepEqual(after.reasoning,before.reasoning);assert.deepEqual(after.guidedTours,before.guidedTours);
  assert.equal(after.fingerprints.source,before.fingerprints.source);assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
  if(!entry){assert.equal(after.fingerprints.teaching,before.fingerprints.teaching);unchangedWorksheets++;continue;}
  changedWorksheets++;assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);assert(await current.parseBodyReviewResponse(after,s.id));
  const foreign=structuredClone(after);foreign.topics.find((t:any)=>entry.topics.includes(t.tab)).body='Foreign';assert.equal(await current.parseBodyReviewResponse(foreign,s.id),null);
  const context=await current.bodyReviewContext(s.id),prior=await previous.bodyReviewContext(s.id);
  assert.notEqual(context.revisions.teaching,prior.revisions.teaching);assert.equal(context.revisions.imaging,null);
  for(const delta of [{materialHash:before.materialHash},{revisionHash:prior.revisions.teaching}]){
   const response=await current.postBodyDecision(new Request('https://review.test/api/atlas-review/body-review/decisions',{method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_THORACOABDOMINAL_REVIEW'},body:JSON.stringify({catalogScope:context.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:current.blankBodyReview(context,'teaching'),...delta})}),storage);
   assert.equal(response.status,409);stale++;
  }
  for(const patch of [{id:'foreign'},{name:'Foreign'},{fmaId:'FMA0'},{laterality:'foreign'},{regions:[]},{region:'foreign'},{system:'foreign'},{category:'foreign'},{sourceTree:'foreign'},{sourceName:'foreign'},{bundle:'foreign.glb'},{nodeName:'foreign'},{bounds:{min:[0,0,0],max:[1,1,1]}},{anchor:[0,0,0]},{sources:[]},{sources:[...s.sources,...s.sources]},{sources:s.sources.map((f:any)=>({...f,sha256:'0'.repeat(64)}))}])
   for(const tab of entry.topics){assert.equal(current.thoracoabdominalOrientationLesson({...s,...patch},tab),undefined);mutations++;}
 }
 assert.deepEqual({changed,preserved,changedWorksheets,unchangedWorksheets,stale,mutations},
  {changed:9,preserved:9927,changedWorksheets:8,unchangedWorksheets:1096,stale:16,mutations:153});
});

test('current delivery retains all nine thoracoabdominal drafts in reachable learner and Review artifacts',async()=>{
 const current=await load(false,true),epoch=await load(),liveJson=(p:string)=>JSON.parse(liveReadFileSync(p,'utf8'));
 const review=liveJson('atlas-review/manifest.json');assert.equal(review.revision,'aa290176f8bfdb02157f7197e4647508c9c41d87');
 const base='public/atlas-runtime/head-neck/',manifest=liveJson(base+'manifest.json');
 assert.equal(manifest.sourceCommit,review.revision);assert.equal(manifest.patientDataIncluded,false);
 const learnerCode=emittedTeaching(base,manifest.files,true),viewerBase='public/atlas-review-viewer/',viewer=liveJson(viewerBase+'manifest.json');
 assert.equal(viewer.sourceCommit,review.revision);assert.equal(viewer.personalRecordsIncluded,false);
 for(const f of viewer.files)assert.equal(sha(liveReadFileSync(viewerBase+f.path)),f.sha256);
 const reviewCode=viewer.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>liveReadFileSync(viewerBase+f.path,'utf8')).join('\n');
 let topics=0,packets=0;
 for(const entry of liveJson('atlas-review/content/thoracoabdominal-orientation-pins.json').entries){
  for(const tab of entry.topics){
   const lesson=current.thoracoabdominalOrientationLesson(entry.identity,tab);assert(lesson);topics++;
   assert.deepEqual(current.bodyLesson(entry.identity,tab),epoch.bodyLesson(entry.identity,tab));
   assert.deepEqual(current.bodyLesson(entry.identity,tab),lesson);
   for(const value of [lesson.body,...lesson.bullets,...lesson.citations,lesson.note])for(const code of [learnerCode,reviewCode])
    assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),value);
  }
  const before=await epoch.bodyReviewMaterial(entry.identity.id),after=await current.bodyReviewMaterial(entry.identity.id);
  assert.deepEqual(after.fingerprints,before.fingerprints);assert.equal(after.approval,false);assert(await current.parseBodyReviewResponse(after,entry.identity.id));packets++;
 }
 assert.equal(topics,9);assert.equal(packets,8);
});
