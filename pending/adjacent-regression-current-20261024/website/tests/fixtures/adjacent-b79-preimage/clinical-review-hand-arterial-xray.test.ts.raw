import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {assertRenalPortalPrefixEpoch} from './renal-tour-epoch-admission.mjs';

const atlas=currentAtlasDeliveryRoot();
const revision=CURRENT_ATLAS_REVISION;
const originalRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const completedSource='b9269c83867fbcae73e0de19ae6ca818fefb713a';
const portalSource='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25';
const lowerVenousV2Source='628102945520c98aaca1c9fd9e539839caa1f324';
const baseline='5d34da55a8cab5a9a0751ac0afa56437bee79cb9';
const pinsPath='content/hand-arterial-ultrasound-pins.json';
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const teachingPaths=['content/hand-arterial-xray.ts','lib/hand-arterial-xray.ts'];
const sourcePaths=[pinsPath,...teachingPaths];
const groups={superficialArch:2,deepArch:2,metacarpal:2,princeps:2,
 radialis:2,commonDigital:8,properDigital:10};
const selected=new Set(['superficialArch','deepArch','princeps']);
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const committed=(commit:string,path:string)=>execFileSync('git',['show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));
const pathsWhere=(value:any,predicate:(value:any)=>boolean,path:string[]=[]):string[][]=>[
 ...(predicate(value)?[path]:[]),
 ...(value&&typeof value==='object'?Object.entries(value).flatMap(([key,child])=>
  pathsWhere(child,predicate,[...path,key])):[]),
];
const at=(value:any,path:string[])=>path.reduce((part,key)=>part[key],value);

async function currentApi(){
 const compiled=await build({stdin:{contents:[
  "export {handArterialXrayLesson} from './atlas-review/lib/hand-arterial-xray';",
  "export * from './atlas-review/content/hand-arterial-xray';",
  "export {bodyLesson,bodyContent} from './atlas-review/app/body-content';",
  "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
  "export {contentTabs} from './atlas-review/lib/content-types';",
  "export {regionalTours} from './atlas-review/lib/regional-tours';",
  "export {structures} from './atlas-review/app/anatomy-data';",
  "export {dissectionProfiles} from './atlas-review/app/dissection-data';",
  "export * from './atlas-review/lib/body-review-material';",
  "export * from './atlas-review/lib/body-review-context';",
  "export * from './atlas-review/lib/body-review-response';",
  "export * from './atlas-review/lib/body-review-api';",
  "export * from './atlas-review/lib/body-review-decisions';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm'});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}

test('exact hand arterial X-ray source reaches learner and protected Review',async()=>{
 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,revision);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 const learnerBase='public/atlas-runtime/head-neck/';
 const viewerBase='public/atlas-review-viewer/';
 const learner=json(learnerBase+'manifest.json');
 const viewer=json(viewerBase+'manifest.json');
 const inputs=json(learnerBase+'source-inputs.json');
 assert.equal(learner.sourceCommit,revision);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(learner.patientDataIncluded,false);
 assert.equal(learner.clinicalApproved,false);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const path of sourcePaths){
  const digest=sha(committed(revision,path));
  assert.deepEqual(committed(revision,path),committed(originalRevision,path),
   `${path}: original hand arterial source changed`);
  const record=review.files.find((file:{path:string})=>file.path===path);
  assert(record,`Review missing ${path}`);
  assert.equal(record.sourceSha256,digest,path);
  assert.equal(record.importedSha256,digest,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),digest,`${path}: imported bytes`);
  assert.equal(sha(readFileSync(atlas+'/'+path)),digest,`${path}: source checkout bytes`);
  assert.equal(inputs.find((file:{path:string})=>file.path===path)?.sha256,digest,
   `${path}: emitted learner source input`);
 }
 assert.deepEqual(committed(revision,pinsPath),committed(baseline,pinsPath),'Original hand pins changed');
 assert.deepEqual(committed(revision,catalogPath),committed(baseline,catalogPath),'Source catalogue changed');
 for(const path of teachingPaths)for(const base of ['public/atlas-review/',learnerBase,viewerBase])
  assert.equal(existsSync(base+path),false,`${base+path}: raw source public`);
 const pins=json('atlas-review/'+pinsPath);
 assert.equal(pins.entries.length,28);
 assert.deepEqual(Object.fromEntries(Object.keys(groups).map(group=>
  [group,pins.entries.filter((entry:any)=>entry.group===group).length])),groups);
 assert.equal(new Set(pins.entries.map((entry:any)=>entry.identity.id)).size,28);
 const entries=pins.entries.filter((entry:any)=>selected.has(entry.group));
 assert.equal(entries.length,6);
 assert.equal(pins.entries.filter((entry:any)=>!selected.has(entry.group)).length,22);
 const api=await currentApi();
 const catalog=api.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.equal(catalog.structures.length,1104);
 const scope=learner.regionalScopes.find((item:{region:string})=>item.region==='hand');
 assert(scope,'Hand learner scope');
 const emitted=[emittedTeaching(learnerBase,learner.files,true),
  emittedTeaching(viewerBase,viewer.files,true)];
 const bundles=new Set<string>();
 let refusedIdentities=0;
 for(const {identity,group} of entries){
  assert.equal(identity.region,'hand');
  assert.equal(identity.system,'vessels');
  assert.equal(identity.category,'vessel');
  assert(['right','left'].includes(identity.laterality));
  assert.equal(identity.nodeName,identity.fmaId);
  assert.equal(identity.validation.status,'unvalidated');
  assert.equal(identity.validation.anatomicalReview,false);
  assert(scope.regionalIds.includes(identity.id),`${identity.id}: learner scope`);
  assert.deepEqual(catalog.structures.find((item:{id:string})=>item.id===identity.id),identity);
  bundles.add(identity.bundle);
  const topic=api.handArterialXrayTeaching[group];
  const lesson=api.handArterialXrayLesson(identity,'xray');
  assert.equal(lesson.readiness,'draft');
  assert.deepEqual(api.bodyLesson(identity,'xray'),lesson);
  assert.equal(lesson.title,`${identity.name} · ${topic.title} · draft`);
  assert.equal(lesson.body,topic.body);
  assert.deepEqual(lesson.bullets,[...topic.bullets,`Source limit: ${identity.coverageNote}`]);
  assert.deepEqual(lesson.citations,topic.citations.map((key:string)=>api.handArterialXrayReferences[key]));
  assert.equal(lesson.note,api.handArterialXrayNote);
  assert.deepEqual(api.bodyContent(identity,'xray'),((({readiness,...content})=>content)(lesson)));
  const prose=[lesson.title,lesson.body,...lesson.bullets,lesson.note].join(' ');
  assert.match(prose,/plain.{0,30}radiograph|plain x[- ]ray/i);
  assert.match(prose,/contrast angiograph|contrast angiogram|arteriograph/i);
  assert.match(prose,/projection/i);
  assert.match(prose,/filling/i);
  assert.match(prose,/patency/i);
  assert.match(prose,/complete (?:arterial|vascular|branch)/i);
  assert.match(lesson.note,/revision-bound radiologist review of this exact source and teaching revision/i);
  assert.match(lesson.note,/No imaging study loaded, patient registration or diagnostic decision is supplied/i);
  assert.match(lesson.note,/Atlas, imaging-case and paid-lecture access remain independent/i);
  assert.doesNotMatch(prose,/approved for clinical use|diagnostic threshold is|registered to (?:a )?patient/i);
  if(group==='princeps')assert.match(prose,/thumb|pollicis/i);
  else assert.match(prose,/arch/i);
  const packet=wire(await api.bodyReviewMaterial(identity.id));
  assert.deepEqual(packet.topics.find((item:{tab:string})=>item.tab==='xray'),{tab:'xray',...lesson});
  assert.deepEqual(await api.parseBodyReviewResponse(packet,identity.id),packet);
  for(const code of emitted)for(const value of [lesson.body,...lesson.bullets,
   ...lesson.citations,lesson.note])assert(visible(code,value),`${identity.id}: emitted teaching missing ${value}`);
  const detached=wire(lesson);
  lesson.bullets.push('foreign');lesson.citations.push('https://foreign.example');
  assert.deepEqual(api.handArterialXrayLesson(identity,'xray'),detached,'Lesson must be detached');
  for(const tab of api.contentTabs)if(tab!=='xray')
   assert.equal(api.handArterialXrayLesson(identity,tab),undefined,`${identity.id}: ${tab}`);
  for(const path of pathsWhere(identity,value=>value===null||typeof value!=='object')){
   const changed=wire(identity),parent=at(changed,path.slice(0,-1));
   const key=path.at(-1)!;const original=parent[key];
   parent[key]=typeof original==='string'?original+'-foreign':
    typeof original==='number'?original+0.01:original===null?'foreign':!original;
   assert.equal(api.handArterialXrayLesson(changed,'xray'),undefined,`${identity.id}: ${path.join('.')}`);
   refusedIdentities++;
  }
  for(const path of pathsWhere(identity,Array.isArray)){
   const changed=wire(identity);at(changed,path).push('foreign');
   assert.equal(api.handArterialXrayLesson(changed,'xray'),undefined,`${identity.id}: ${path.join('.')}`);
   refusedIdentities++;
  }
  for(const path of pathsWhere(identity,value=>value&&typeof value==='object'&&!Array.isArray(value))){
   const changed=wire(identity);at(changed,path).unexpected=true;
   assert.equal(api.handArterialXrayLesson(changed,'xray'),undefined,`${identity.id}: ${path.join('.')||'<root>'}`);
   refusedIdentities++;
  }
 }
 assert(refusedIdentities>0);
 for(const bundleId of bundles){
  const descriptor=pins.bundles.find((bundle:{id:string})=>bundle.id===bundleId);
  assert(descriptor,`Existing bundle ${bundleId}`);
  const modelPath='public'+descriptor.url.split('?')[0];
  assert.deepEqual(readFileSync(atlas+'/'+modelPath),committed(baseline,modelPath),
   `${bundleId}: source model bytes unchanged`);
  const publishedPath=descriptor.url.replace(/^\//,'').split('?')[0];
  assert.equal(learner.files.find((file:{path:string})=>file.path===publishedPath)?.sha256,
   descriptor.sha256,`${bundleId}: learner model manifest`);
  assert.equal(sha(readFileSync(learnerBase+publishedPath)),descriptor.sha256,
   `${bundleId}: delivered model bytes`);
 }
});

test('9,936 placements and 1,104 Review packets change only for six hand X-ray drafts',async()=>{
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const [previous,live,portal,lowerVenousV2,current]=await Promise.all([
  exactSourceHistoryApi(baseline,'review-security'),
  exactSourceHistoryApi(completedSource,'review-security'),
  exactSourceHistoryApi(portalSource,'review-security'),
  exactSourceHistoryApi(lowerVenousV2Source,'review-security'),currentApi()]);
 for(const path of sourcePaths)assert.deepEqual(committed(revision,path),committed(completedSource,path),
  `${path}: current hand source remains exact completed epoch`);
 assert.equal(live.regionalTours.length,47);
 assert.equal(live.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),282);
 assert.deepEqual(portal.regionalTours.slice(0,-1),live.regionalTours,
  'Original 47-tour V1 catalogue remains exact in the portal epoch');
 assert.equal(portal.regionalTours.length,48);
 assert.equal(portal.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),290);
 assert.equal(portal.regionalTours.at(-1).id,'portal-hepatic-venous-relationships');
 assert.equal(portal.regionalTours.at(-1).revision,'portal-hepatic-venous-relationships-20261014-r1');
 assertRenalPortalPrefixEpoch(portal.regionalTours,current.regionalTours);
 assert.deepEqual(current.regionalTours[27],lowerVenousV2.regionalTours[27],
  'Current lower venous V2 is exact at its historical source');
 assert.deepEqual(current.regionalTours.slice(28,48),portal.regionalTours.slice(28),
  'Later historical tours remain exact and ordered');
 assert.deepEqual(current.regionalTours.slice(48).map((tour:any)=>tour.id),[
  'cervical-whole-discs-orientation','right-medial-thigh-orientation',
  'right-posterior-calf-achilles-orientation']);
 assert.equal(current.regionalTours.length,51);
 assert.equal(new Set(current.regionalTours.map((tour:any)=>tour.id)).size,51);
 assert.equal(current.regionalTours.reduce((n:number,tour:any)=>n+tour.steps.length,0),309);
 const catalog=live.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,previous.bodyDisplayCatalog(JSON.parse(committed(baseline,catalogPath).toString())));
 assert.deepEqual(live.contentTabs,previous.contentTabs);
 assert.deepEqual(live.regionalTours,previous.regionalTours);
 assert.deepEqual(live.structures,previous.structures);
 assert.deepEqual(live.dissectionProfiles,previous.dissectionProfiles);
 assert.equal(catalog.structures.length,1104);
 assert.equal(live.contentTabs.length,9);
 const pins=json('atlas-review/'+pinsPath);
 const selectedIds=new Set(pins.entries.filter((entry:any)=>selected.has(entry.group))
  .map((entry:any)=>entry.identity.id));
 assert.equal(selectedIds.size,6);
 let placements=0,changed=0,packets=0,changedPackets=0,malformed=0,stale=0,
  forged=0,storageCalls=0,currentStalePackets=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
 const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_HAND_ARTERIAL_XRAY'},body:JSON.stringify(value),
 });
 for(const structure of catalog.structures){
  for(const tab of live.contentTabs){
   const before=previous.bodyLesson(structure,tab),after=live.bodyLesson(structure,tab);
   placements++;
   if(!selectedIds.has(structure.id)||tab!=='xray'){
    assert.deepEqual(after,before,`${structure.id}|${tab}`);
   assert.equal(current.handArterialXrayLesson(structure,tab),undefined,`${structure.id}|${tab}: no leakage`);
    continue;
   }
   changed++;
   assert.equal(before.readiness,'pending',`${structure.id}: previous X-ray`);
   assert.equal(after.readiness,'draft',`${structure.id}: current X-ray`);
   assert.deepEqual(after,current.handArterialXrayLesson(structure,tab));
  }
  const before=wire(await previous.bodyReviewMaterial(structure.id));
  const after=wire(await live.bodyReviewMaterial(structure.id));
  assert(before&&after,structure.id);
  packets++;
  assert.equal(after.approval,false);
  assert.equal(after.status,'worksheet-not-submitted');
  if(!selectedIds.has(structure.id)){
   assert.deepEqual(after,before,`${structure.id}: unrelated Review packet`);
   continue;
  }
  changedPackets++;
  const currentPacket=wire(await current.bodyReviewMaterial(structure.id));
  assert(currentPacket,`${structure.id}: current Review packet`);
  assert.deepEqual(currentPacket.source,after.source,
   `${structure.id}: current hand source preserved`);
  assert.deepEqual(currentPacket.topics.find((topic:{tab:string})=>topic.tab==='xray'),
   after.topics.find((topic:{tab:string})=>topic.tab==='xray'),
   `${structure.id}: hand X-ray teaching preserved`);
  assert.equal(currentPacket.approval,false);
  assert.deepEqual(current.bodyLesson(structure,'xray'),live.bodyLesson(structure,'xray'));
  assert.deepEqual(await current.parseBodyReviewResponse(currentPacket,structure.id),currentPacket);
  if(currentPacket.materialHash!==after.materialHash){
   assert.equal(await current.parseBodyReviewResponse(after,structure.id),null,
    `${structure.id}: older feature packet refused by current Review`);
   currentStalePackets++;
  }else assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after,
   `${structure.id}: unchanged feature packet remains exact`);
  assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
  for(const key of ['source','reasoning','guidedTours','checklist','atlasLink','limits'])
   assert.deepEqual(after[key],before[key],`${structure.id}: ${key}`);
  assert.deepEqual(after.topics.filter((topic:{tab:string})=>topic.tab!=='xray'),
   before.topics.filter((topic:{tab:string})=>topic.tab!=='xray'));
  assert.equal(after.fingerprints.source,before.fingerprints.source);
  assert.notEqual(after.fingerprints.teaching,before.fingerprints.teaching);
  assert.notEqual(after.materialHash,before.materialHash);
  assert.deepEqual(await live.parseBodyReviewResponse(after,structure.id),after);
  assert.equal(await live.parseBodyReviewResponse(before,structure.id),null,
   `${structure.id}: old packet refused`);
  for(const mutate of [
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').body+=' forged';},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').citations=['https://forged.example'];},
   (bad:any)=>{bad.source.structure.sources[0].sha256='0'.repeat(64);},
   (bad:any)=>{bad.topics.find((topic:any)=>topic.tab==='xray').readiness='approved';},
   (bad:any)=>{bad.topics.splice(bad.topics.findIndex((topic:any)=>topic.tab==='xray'),1);},
  ]){
   const altered=wire(after);mutate(altered);
   assert.equal(await live.parseBodyReviewResponse(altered,structure.id),null,
    `${structure.id}: forged packet refused`);
   assert.equal(await current.parseBodyReviewResponse(altered,structure.id),null,
    `${structure.id}: current forged packet refused`);
   malformed++;
  }
  const priorContext=await previous.bodyReviewContext(structure.id);
  const context=await live.bodyReviewContext(structure.id);
  const currentContext=await current.bodyReviewContext(structure.id);
  assert.equal(currentContext.sourceHash,context.sourceHash,`${structure.id}: current source`);
  assert.equal(currentContext.checklistVersion,context.checklistVersion,
   `${structure.id}: current checklist`);
  assert(priorContext&&context,structure.id);
  assert.equal(context.sourceHash,priorContext.sourceHash);
  assert.notEqual(context.revisions.teaching,priorContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  assert(context.teachingTabs.includes('xray'));
  assert.equal(live.bodyReviewStale({catalogScope:context.catalogScope,
   structureId:structure.id,checklistVersion:context.checklistVersion,
   revisionHash:priorContext.revisions.teaching,track:'teaching'},context),true);
  const decision={catalogScope:context.catalogScope,structureId:structure.id,
   track:'teaching',expectedVersion:0,materialHash:context.materialHash,
   revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:live.blankBodyReview(context,'teaching')};
  for(const patch of [{materialHash:priorContext.materialHash,
    revisionHash:priorContext.revisions.teaching},
   {materialHash:priorContext.materialHash},
   {revisionHash:priorContext.revisions.teaching}]){
   assert.equal((await live.postBodyDecision(request({...decision,...patch}),storage)).status,409,
    `${structure.id}: stale decision refused before storage`);
   assert.equal((await current.postBodyDecision(request({...decision,...patch}),storage)).status,409,
    `${structure.id}: current stale decision refused before storage`);
   stale++;
  }
  const forgedApproval=wire(decision);forgedApproval.draft.status='approved';
  assert.equal((await live.postBodyDecision(request(forgedApproval),storage)).status,422,
   `${structure.id}: forged approval refused before storage`);
  const currentDecision={...decision,materialHash:currentContext.materialHash,
   revisionHash:currentContext.revisions.teaching,
   draft:current.blankBodyReview(currentContext,'teaching')};
  const currentForgedApproval=wire(currentDecision);currentForgedApproval.draft.status='approved';
  assert.equal((await current.postBodyDecision(request(currentForgedApproval),storage)).status,422,
   `${structure.id}: current forged approval refused before storage`);
  forged++;
 }
 assert.deepEqual({placements,changed,preserved:placements-changed,packets,changedPackets,
  preservedPackets:packets-changedPackets,malformed,stale,forged,storageCalls},
  {placements:9936,changed:6,preserved:9930,packets:1104,changedPackets:6,
   preservedPackets:1098,malformed:30,stale:18,forged:6,storageCalls:0});
 assert(currentStalePackets>0,'Later teaching must make at least one feature packet stale');
});
