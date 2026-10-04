import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {atlasExactGitApi} from './atlas-exact-git-api.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

const websiteBaseline='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const sourceBaseline='88cea927d48729769b96ad8fe680b0872b7e6687';
const sourceRevision='cdc6ad23ad5c3c13a2f6588019a057d0a063818f';
const footWebsiteEpoch='7eacbbacc76f4e98288552614ce47e8e823d45a9';
const deliveryRevision='bbe33ea6ffff3503ae9cdabc0dd41350cece28cd';
const atlasSource='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/outputs';
const hash=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const old=path=>execFileSync('git',['show',websiteBaseline+':'+path],{maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sourceAt=path=>execFileSync('git',['show',sourceRevision+':'+path],{cwd:atlasSource,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const common="export {bodyLesson,bodyContent} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {structures} from './atlas-review/app/anatomy-data';export {dissectionProfiles} from './atlas-review/app/dissection-data';export {regionalTours} from './atlas-review/lib/regional-tours';export {reasoningConcepts} from './atlas-review/lib/reasoning-questions';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-context';export * from './atlas-review/lib/body-review-response';export * from './atlas-review/lib/body-review-api';export * from './atlas-review/lib/body-review-decisions';";
const before=await atlasExactGitApi(websiteBaseline,common);
const compiled=await build({stdin:{contents:common+"export * from './atlas-review/lib/foot-surface-imaging';export * from './atlas-review/content/foot-surface-imaging';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
const now=await atlasExactGitApi(footWebsiteEpoch,common+"export * from './atlas-review/lib/foot-surface-imaging';export * from './atlas-review/content/foot-surface-imaging';");
const delivery=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const pins=JSON.parse(readFileSync('atlas-review/content/foot-surface-imaging-pins.json'));
const transition=JSON.parse(sourceAt('content/foot-surface-imaging.transition.json'));
assert.equal(hash(pins),'8dddeb76bd3578bc9c8494ffed9c0d580ebd1ff2c1e11ad6b76f77932f2fda85');
assert.equal(hash(transition),'06521330390060e0b65b6a101ebf58b26183cc1b8d11db3751eacd27ac136bee');
assert.equal(pins.baseline,sourceBaseline);assert.equal(transition.baseline,sourceBaseline);
assert.equal(transition.sourcePinsHash,hash(pins));
assert.deepEqual(readFileSync('atlas-review/content/foot-surface-imaging-pins.json'),sourceAt('content/foot-surface-imaging-pins.json'));
assert.equal(pins.entries.length,8);assert.equal(transition.entries.length,8);
const entries=new Map(pins.entries.map(e=>[e.identity.id,e]));assert.equal(entries.size,8);
const transitions=new Map(transition.entries.map(e=>[e.id+':'+e.tab,e]));assert.equal(transitions.size,8);
assert.deepEqual([...entries.values()].map(e=>[e.family,e.identity.laterality]),[
 ['calcaneus','left'],['calcaneus','right'],['talus','left'],['talus','right'],
 ['navicular','left'],['navicular','right'],['longPlantar','left'],['longPlantar','right']]);

const sourceCatalog=JSON.parse(readFileSync('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
const catalog=now.bodyDisplayCatalog(sourceCatalog);
assert.equal(catalog.structures.length,1104);assert.equal(catalog.bundles.length,109);
assert.deepEqual(catalog,before.bodyDisplayCatalog(JSON.parse(old('atlas-review/public/models/bodyparts3d/full-body/catalog.json'))));
for(const key of ['structures','dissectionProfiles','regionalTours','reasoningConcepts','contentTabs'])assert.deepEqual(now[key],before[key],key);
assert.equal(now.contentTabs.length,9);
assert.equal(pins.sourceVersion,sourceCatalog.sourceVersion);assert.equal(pins.license,sourceCatalog.license);
assert.deepEqual(pins.coordinateSystem,sourceCatalog.coordinateSystem);
const snapshot=api=>({catalog,body:catalog.structures.map(s=>({id:s.id,topics:Object.fromEntries(api.contentTabs.map(t=>[t,api.bodyLesson(s,t)]))})),shoulder:api.structures,recipes:api.dissectionProfiles});
assert.equal(hash(snapshot(before)),pins.beforeAllTeachingSnapshotHash);
const recovered=snapshot(now);
let changed=0,preserved=0,identityRefusals=0,malformed=0,stale=0,storageCalls=0,worksheets=0;
for(const row of recovered.body){
 const entry=entries.get(row.id);
 for(const tab of now.contentTabs){
  const previous=before.bodyLesson(catalog.structures.find(s=>s.id===row.id),tab);
  if(entry&&tab==='ultrasound'){
   assert.deepEqual(previous,entry.previous.ultrasound);assert.equal(previous.readiness,'pending');
   const lesson=now.bodyLesson(entry.identity,tab);
   assert.deepEqual(lesson,now.footSurfaceImagingLesson(entry.identity,tab));
   assert.equal(lesson.readiness,'draft');assert.equal(hash(lesson),transitions.get(row.id+':'+tab)?.draftHash);
   const {readiness,...display}=lesson;assert.deepEqual(now.bodyContent(entry.identity,tab),display);
   row.topics[tab]=previous;changed++;
  }else{assert.deepEqual(row.topics[tab],previous,row.id+':'+tab);preserved++;}
 }
}
assert.equal(changed,8);assert.equal(preserved,9928);assert.equal(hash(recovered),pins.beforeAllTeachingSnapshotHash);
for(const {identity} of pins.entries)assert.deepEqual(delivery.footSurfaceImagingLesson(identity,'ultrasound'),now.footSurfaceImagingLesson(identity,'ultrasound'));
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,part])=>leaves(part,[...path,key]));
const arrays=(value,path=[])=>[
 ...(Array.isArray(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,part])=>arrays(part,[...path,key])):[]),
];
for(const {identity,family} of pins.entries){
 assert.deepEqual(catalog.structures.find(s=>s.id===identity.id),identity);
 const lesson=now.footSurfaceImagingLesson(identity,'ultrasound'),original=structuredClone(lesson);
 assert.equal(lesson.body,now.footSurfaceImagingTeaching[family].ultrasound.body);
 assert.deepEqual(lesson.bullets,[...now.footSurfaceImagingTeaching[family].ultrasound.bullets]);
 assert.deepEqual(lesson.citations,now.footSurfaceImagingTeaching[family].ultrasound.citations.map(k=>now.footSurfaceImagingReferences[k].url));
 assert.match(lesson.note,/revision-bound radiologist review pending/);
 assert.match(lesson.note,/Atlas, case and paid-lecture access remain independent/);
 for(const citation of lesson.citations)assert.equal(new URL(citation).protocol,'https:');
 lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
 assert.deepEqual(now.footSurfaceImagingLesson(identity,'ultrasound'),original);
 for(const path of leaves(identity)){
  const foreign=structuredClone(identity);let target=foreign;for(const key of path.slice(0,-1))target=target[key];
  const key=path.at(-1),value=target[key];target[key]=typeof value==='string'?value+'-foreign':typeof value==='number'?value+.01:value===null?'foreign':!value;
  assert.equal(now.footSurfaceImagingLesson(foreign,'ultrasound'),undefined,identity.id+':'+path.join('.'));identityRefusals++;
 }
 for(const path of arrays(identity)){
  const foreign=structuredClone(identity);let target=foreign;for(const key of path)target=target[key];
  target.push('foreign');
  assert.equal(now.footSurfaceImagingLesson(foreign,'ultrasound'),undefined,identity.id+':'+path.join('.'));identityRefusals++;
 }
 const extra=structuredClone(identity);extra.unexpected=true;
 assert.equal(now.footSurfaceImagingLesson(extra,'ultrasound'),undefined);identityRefusals++;
 for(const tab of now.contentTabs.filter(t=>t!=='ultrasound'))assert.equal(now.footSurfaceImagingLesson(identity,tab),undefined);
 const current=await now.bodyReviewMaterial(identity.id),prior=await before.bodyReviewMaterial(identity.id);
 assert.equal(current.approval,false);assert(await now.parseBodyReviewResponse(current,identity.id));
 for(const key of ['source','reasoning','guidedTours'])assert.deepEqual(current[key],prior[key]);
 assert.deepEqual(current.topics.find(t=>t.tab==='ultrasound'),{tab:'ultrasound',...original});
 for(const edit of [
  x=>{x.topics.find(t=>t.tab==='ultrasound').body+=' foreign';},
  x=>{x.topics.find(t=>t.tab==='ultrasound').readiness='approved';},
  x=>{x.topics.find(t=>t.tab==='ultrasound').citations=['https://foreign.example'];},
  x=>{x.source.structure.sources=[];},
  x=>{x.topics=x.topics.filter(t=>t.tab!=='ultrasound');},
 ]){const foreign=structuredClone(current);edit(foreign);assert.equal(await now.parseBodyReviewResponse(foreign,identity.id),null);malformed++;}
 const priorContext=await before.bodyReviewContext(identity.id),context=await now.bodyReviewContext(identity.id);
 assert.equal(context.sourceHash,priorContext.sourceHash);
 assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
 assert.equal(context.revisions.imaging,null);
 const packet={catalogScope:context.catalogScope,structureId:identity.id,track:'teaching',expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,draft:now.blankBodyReview(context,'teaching')};
 for(const delta of [{materialHash:priorContext.materialHash,revisionHash:priorContext.revisions.teaching},{materialHash:priorContext.materialHash},{revisionHash:priorContext.revisions.teaching}]){
  const response=await now.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_FOOT_ULTRASOUND'},body:JSON.stringify({...packet,...delta})}),{prepare(){storageCalls++;throw Error('Stale decision reached storage');}});
  assert.equal(response.status,409);stale++;
 }
 if(family==='longPlantar')assert.equal(now.bodyLesson(identity,'ct').readiness,'pending');
}
assert.equal(identityRefusals,320);assert.equal(malformed,40);assert.equal(stale,24);assert.equal(storageCalls,0);
for(const s of catalog.structures){
 const prior=await before.bodyReviewMaterial(s.id),current=await now.bodyReviewMaterial(s.id);
 for(const key of ['source','reasoning','guidedTours'])assert.deepEqual(current[key],prior[key]);
 assert.equal(current.approval,false);
 if(entries.has(s.id)){assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching);worksheets++;}
 else{assert.deepEqual(current.topics,prior.topics);assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching);assert.equal(now.footSurfaceImagingLesson(s,'ultrasound'),undefined);}
}
assert.equal(worksheets,8);
const sourceBundles=new Map(sourceCatalog.bundles.map(b=>[b.id,b]));
for(const bundle of sourceCatalog.bundles){
 const path='public/atlas-runtime/head-neck'+bundle.url.split('?')[0],bytes=readFileSync(path);
 assert.equal(bytes.length,bundle.bytes);assert.equal(hash(bytes),bundle.sha256);assert.deepEqual(bytes,old(path));
}
for(const bundle of pins.bundles){
 assert.deepEqual(bundle,sourceBundles.get(bundle.id));
}
for(const path of ['package-lock.json','atlas-review/app/body-explorer.tsx','atlas-review/lib/imaging-sync.ts','atlas-review/lib/didanix-atlas-adapter.ts','atlas-review/lib/independent-study-links.ts'])
 assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),old(path).toString().replaceAll('\r\n','\n'),path);
const review=JSON.parse(readFileSync('atlas-review/manifest.json'));assert.equal(review.revision,deliveryRevision);
for(const file of review.files)assert.equal(hash(readFileSync('atlas-review/'+file.path)),file.importedSha256,file.path);
for(const path of ['lib/foot-surface-imaging.ts','content/foot-surface-imaging.ts','content/foot-surface-imaging-pins.json']){
 const file=review.files.find(f=>f.path===path);assert(file,path);
 assert.equal(hash(readFileSync('atlas-review/'+path)),file.importedSha256);
 assert.equal(file.sourceSha256,hash(sourceAt(path)));
}
for(const name of ['head-neck','shoulder','female-pelvis','lower-limb']){
 const base='public/atlas-runtime/'+name+'/',manifest=JSON.parse(readFileSync(base+'manifest.json'));
 assert.equal(manifest.sourceCommit,deliveryRevision);assert.equal(manifest.patientDataIncluded,false);assert.equal(manifest.clinicalApproved,false);
 for(const file of manifest.files){const bytes=readFileSync(base+file.path);assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);}
 const previous=JSON.parse(old(base+'manifest.json'));
 assert.deepEqual(manifest.files.filter(f=>f.path.startsWith('models/')),previous.files.filter(f=>f.path.startsWith('models/')));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json'));
 for(const path of ['lib/foot-surface-imaging.ts','content/foot-surface-imaging.ts','content/foot-surface-imaging-pins.json']){
  const actual=inputs.find(f=>f.path===path),imported=review.files.find(f=>f.path===path);
  assert.equal(Boolean(actual),name==='head-neck'||name==='shoulder',name+':'+path);
  if(actual)assert.equal(actual.sha256,imported.sourceSha256);
 }
 assert(!inputs.some(f=>f.path==='content/foot-surface-imaging.transition.json'));
 if(name==='head-neck'){
  const emitted=emittedTeaching(base,manifest.files);
  for(const item of pins.entries){const lesson=delivery.footSurfaceImagingLesson(item.identity,'ultrasound');
   for(const text of [item.identity.id,lesson.body,...lesson.bullets,lesson.note,...lesson.citations])
    assert(emitted.includes(text)||emitted.includes(JSON.stringify(text).slice(1,-1)),`learner:${item.identity.id}:${text.slice(0,40)}`);
  }
 }
}
const reviewBase='public/atlas-review-viewer/',reviewManifest=JSON.parse(readFileSync(reviewBase+'manifest.json'));
assert.equal(reviewManifest.sourceCommit,deliveryRevision);assert.equal(reviewManifest.personalRecordsIncluded,false);
assert.equal(reviewManifest.mode,'production');assert.equal(reviewManifest.websiteIntegrationSha256,review.websiteIntegrationSha256);
for(const file of reviewManifest.files)assert.equal(hash(readFileSync(reviewBase+file.path)),file.sha256,'review:'+file.path);
const emittedReview=emittedTeaching(reviewBase,reviewManifest.files,true);
for(const item of pins.entries){const lesson=delivery.footSurfaceImagingLesson(item.identity,'ultrasound');
 for(const text of [item.identity.id,lesson.body,...lesson.bullets,lesson.note,...lesson.citations])
  assert(emittedReview.includes(text)||emittedReview.includes(JSON.stringify(text).slice(1,-1)),`review:${item.identity.id}:${text.slice(0,40)}`);
}
console.log(JSON.stringify({websiteBaseline,sourceRevision,footWebsiteEpoch,deliveryRevision,changed,preserved,identityRefusals,malformedPacketsRefused:malformed,staleRefusalsBeforeStorage:stale,storageCalls,changedTeachingWorksheets:worksheets,verifiedRuntimes:4,clinicalApproval:false,browserAcceptance:false}));
