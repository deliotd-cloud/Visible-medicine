import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const baseline='c22c42edc7a663be4cce788d882edb0a83b752fd';
const revision='628102945520c98aaca1c9fd9e539839caa1f324';
const laterRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const frozen='F:/VisibleMedicine/recovery/checkpoints/20261015-leg-venous-xray/website-current-source/source';
const introduced='F:/VisibleMedicine/recovery/checkpoints/20261015-lower-venous-tour-v2/website-current-source/source';
const tourId='right-lower-limb-venous-orientation';
const tourRevision=tourId+'-v2';
const sourcePaths=['lib/lower-venous-tour.ts','content/lower-venous-tour-v2-pins.json','lib/regional-tours.ts'];
const names=['small','popliteal','anterior','posterior','femoral','deep','great','external','common'];
const fmas=['FMA44334','FMA44328','FMA44336','FMA44338','FMA21188','FMA51042','FMA21379','FMA18885','FMA21387'];
const boneFmas=['FMA16586','FMA24474','FMA24477','FMA24480'];
const bundles=['pelvis-skeleton','thigh-skeleton','leg-skeleton','pelvis-vessels-recovery',
 'thigh-vessels-recovery','leg-vessels-recovery','deep-leg-veins'];
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(commit:string,path:string)=>execFileSync('git',['--no-replace-objects','show',commit+':'+path],
 {cwd:atlas,windowsHide:true,maxBuffer:64e6});
const entry=[
 "export * from './atlas-review/lib/regional-tours';",
 "export * from './atlas-review/lib/body-review-material';",
 "export * from './atlas-review/lib/body-review-response';",
 "export * from './atlas-review/lib/body-review-context';",
 "export * from './atlas-review/lib/body-review-api';",
 "export * from './atlas-review/lib/body-review-decisions';",
 "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 "export {bodyLesson} from './atlas-review/app/body-content';",
 "export {contentTabs} from './atlas-review/lib/content-types';",
].join('\n');
async function imported(root?:string){
 const compiled=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm',loader:{'.css':'empty'},nodePaths:[resolve(process.cwd(),'node_modules')],
  ...(root?{plugins:[{name:'frozen-review-only',setup(api:any){
   api.onResolve({filter:/^\.\/atlas-review\//},(args:any)=>{
    const stem=resolve(root,args.path.slice(2));
    for(const suffix of ['.ts','.tsx','.js','.json'])if(existsSync(stem+suffix))return {path:stem+suffix};
    throw Error('Missing frozen Review module: '+args.path);
   });
  }}]}:{})});
 return import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
}
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

test('right lower limb venous v2 is an exact source-bound draft in learners and protected Review',
 {timeout:600000},async()=>{
 assert.match(revision,/^[a-f0-9]{40}$/,'Main must pin __ATLAS_COMMIT__ after integration');
 const currentPin=validateCurrentAtlasDelivery();
 assert.equal(currentPin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),currentPin.source);
 assert.equal(execFileSync('git',['merge-base',revision,laterRevision],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 assert.equal(execFileSync('git',['merge-base',laterRevision,currentPin.source],{cwd:atlas,windowsHide:true}).toString().trim(),laterRevision);
 const oldManifest=json(frozen+'/atlas-review/manifest.json');
 assert.equal(oldManifest.revision,baseline);assert.equal(oldManifest.files.length,1459);
 const recoveryManifestPath=resolve(frozen,'../manifest.json');
 assert.equal(sha(readFileSync(recoveryManifestPath)),'aca9c8c417d90800265f8b0bde64afa5b7eb1417760272821da0d29c9b6c9315');
 const recoveryManifest=json(recoveryManifestPath);
 for(const file of oldManifest.files){
  const path='atlas-review/'+file.path,record=recoveryManifest.files.find((row:any)=>row.path===path);assert(record,path);
  const actual=sha(readFileSync(frozen+'/'+path));assert.equal(actual,record.sha256,path);assert.equal(actual,file.importedSha256,path);
 }
 for(const path of ['lib/lower-venous-tour.ts','lib/regional-tours.ts',
   'public/models/bodyparts3d/full-body/catalog.json']){
  const record=oldManifest.files.find((file:any)=>file.path===path);assert(record,path);
  const bytes=readFileSync(frozen+'/atlas-review/'+path);
  assert.equal(record.importedSha256,sha(bytes),path);
  assert.equal(record.sourceSha256,sha(git(baseline,path)),path);
  assert.equal(bytes.toString().replaceAll('\r\n','\n'),git(baseline,path).toString().replaceAll('\r\n','\n'),path);
 }
 const introducedManifestBytes=readFileSync(introduced+'/atlas-review/manifest.json');
 assert.equal(sha(introducedManifestBytes),'348fa0fc7733d609ea557e42e985acee3a8e7eedb536902ff6cf29d55cb915',
  'exact recovered venous-v2 delivery manifest');
 const review=JSON.parse(introducedManifestBytes.toString()),viewerBase='public/atlas-review-viewer/';
 const viewer=json(introduced+'/'+viewerBase+'manifest.json');
 const modules=['head-neck','shoulder','female-pelvis','lower-limb'].map(name=>({
  name,base:introduced+'/public/atlas-runtime/'+name+'/',
  manifest:json(introduced+'/public/atlas-runtime/'+name+'/manifest.json'),
 }));
 assert.equal(review.revision,revision);assert.equal(review.files.length,1460);
 assert.deepEqual(review.files.filter((file:any)=>!oldManifest.files.some((old:any)=>old.path===file.path))
   .map((file:any)=>file.path),['content/lower-venous-tour-v2-pins.json']);
 assert.notEqual(review.websiteIntegrationSha256,oldManifest.websiteIntegrationSha256);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const {name,base,manifest} of modules){
  assert.equal(manifest.sourceCommit,revision,name);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])
   assert.equal(manifest[flag],false,name+': '+flag);
  const inputs=json(base+'source-inputs.json');
  for(const path of sourcePaths){
   const input=inputs.find((file:any)=>file.path===path);
   if(name==='head-neck')assert.equal(input?.sha256,sha(git(revision,path)),name+': '+path);
   else assert.equal(input,undefined,name+': unrelated source '+path);
  }
 }
 for(const path of sourcePaths){
  const bytes=git(revision,path),record=review.files.find((file:any)=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,sha(bytes),path);
  assert.equal(record.importedSha256,sha(readFileSync(introduced+'/atlas-review/'+path)),path);
  assert.equal(readFileSync(introduced+'/atlas-review/'+path).toString().replaceAll('\r\n','\n'),
   bytes.toString().replaceAll('\r\n','\n'),path);
  for(const base of [introduced+'/public/atlas-review/',introduced+'/'+viewerBase,...modules.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,'no public raw source: '+base+path);
 }
 const pins=json(introduced+'/atlas-review/content/lower-venous-tour-v2-pins.json');
 assert.equal(pins.baseline,baseline);assert.equal(pins.tourRevision,tourRevision);
 assert.deepEqual(pins.entries.map((entry:any)=>entry.fmaId),fmas);
 assert.deepEqual(pins.contextEntries.map((entry:any)=>entry.fmaId),boneFmas);
 assert.deepEqual(pins.bundles.map((bundle:any)=>bundle.id).sort(),bundles.slice().sort());
 const current=await imported(introduced),before=await imported(frozen),live=await boundLiveAtlasHistory(revision);
 const catalog=current.bodyDisplayCatalog(json(introduced+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const oldCatalog=before.bodyDisplayCatalog(json(frozen+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(catalog,oldCatalog);
 assert.equal(catalog.structures.length,1104);
 assert.deepEqual(await live.bodyReviewMaterial(pins.entries[0].id),
  await current.bodyReviewMaterial(pins.entries[0].id));
 const tour=current.regionalTours.find((item:any)=>item.id===tourId);assert(tour);
 const prior=before.regionalTours.find((item:any)=>item.id===tourId);assert(prior);
 assert.equal(prior.steps.length,6);assert.equal(tour.steps.length,9);
 assert.equal(tour.revision,tourRevision);assert.equal(tour.region,'whole-body');assert.equal(tour.status,'draft');
 assert.deepEqual(tour.steps.map((step:any)=>step.id),names);
 assert.deepEqual(tour.steps.map((step:any)=>step.selectedId),pins.entries.map((entry:any)=>entry.id));
 assert.deepEqual(tour.contextIds,pins.contextEntries.map((entry:any)=>entry.id));
 assert.deepEqual(tour.scopeRegions,[...new Set([...pins.entries,...pins.contextEntries].flatMap((entry:any)=>entry.regions))]);
 assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),
  [...pins.entries,...pins.contextEntries].map((entry:any)=>entry.id).sort());
 assert(tour.steps.every((step:any)=>step.frameIds.includes(step.selectedId)&&
  step.frameIds.every((id:string)=>pins.entries.some((entry:any)=>entry.id===id))&&
  step.durationMs===14000&&step.fadeOthers===true&&step.references.length>0));
 assert.match(tour.limitations,/two source parts/i);
 assert.match(tour.limitations,/not separately validated companion veins/i);
 assert.match(tour.limitations,/revision-bound radiologist sign-off/i);
 assert.match(tour.steps[4].caption,/deep thigh system/i);
 assert.match(tour.steps[5].caption,/separate deep-thigh tributary/i);
 assert.equal(current.regionalTours.length,50);
 assert.equal(current.regionalTours.reduce((sum:number,item:any)=>sum+item.steps.length,0),304);
 assert.deepEqual(current.regionalTours.filter((item:any)=>item.id!==tourId),
  before.regionalTours.filter((item:any)=>item.id!==tourId));
 const structures=current.regionalTourStructures(catalog,tour);
 assert.deepEqual(structures.map((item:any)=>item.id),
  [...pins.contextEntries,...pins.entries].map((entry:any)=>entry.id));
 for(const structure of structures){
  const pin=[...pins.entries,...pins.contextEntries].find((item:any)=>item.id===structure.id);assert(pin);
  assert.deepEqual(structure,pin);
  assert.equal(tour.requiredDisplayBundles[structure.id],structure.bundle);
 }
 const evidence=current.regionalTourEvidence(catalog,pins.entries[0].id).find((item:any)=>item.tour.id===tourId);
 assert(evidence);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.transitionMs,1800);
 assert.equal(evidence.separation,0);assert.equal(evidence.stepFrames.length,9);
 assert.deepEqual(evidence.bundles.map((item:any)=>item.id).sort(),bundles.slice().sort());
 const emitted=[emittedTeaching(modules[0].base,modules[0].manifest.files,true),
  emittedTeaching(introduced+'/'+viewerBase,viewer.files,true)];
 for(const code of emitted)for(const value of [tourId,tourRevision,tour.title,
  ...tour.steps.flatMap((step:any)=>[step.title,step.caption])])
  assert(visible(code,value),'emitted tour text: '+value);
 for(const bundle of pins.bundles){
  const path='public'+bundle.url.split('?')[0];
  assert.equal(bundle.sha256,sha(git(baseline,path)),path);
  assert.deepEqual(git(revision,path),git(baseline,path),path);
 }
 let changed=0,retained=0,placements=0,packets=0,storageCalls=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
 for(const structure of catalog.structures){
  const relevant=structures.some((item:any)=>item.id===structure.id);
  for(const tab of current.contentTabs){
   assert.deepEqual(current.bodyLesson(structure,tab),before.bodyLesson(structure,tab),
    structure.id+': '+tab);placements++;
  }
  const packet=wire(await current.bodyReviewMaterial(structure.id));
  const priorPacket=wire(await before.bodyReviewMaterial(structure.id));
  assert(packet&&priorPacket,structure.id);packets++;
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  if(!relevant){retained++;assert.deepEqual(packet,priorPacket,structure.id);continue;}
  changed++;
  for(const field of ['source','topics','reasoning','atlasLink','limits'])
   assert.deepEqual(packet[field],priorPacket[field],structure.id+': '+field);
  const expectedChecklist=wire(priorPacket.checklist);
  if(priorPacket.guidedTours.length===0)expectedChecklist.teaching.push(
   'Review the entire displayed guided tour, all context surfaces, captions, references, target selections and camera transitions; record framing or teaching corrections.');
  assert.deepEqual(packet.checklist,expectedChecklist,structure.id+': exact first-tour review disclosure');
  assert.equal(packet.fingerprints.source,priorPacket.fingerprints.source);
  assert.notEqual(packet.fingerprints.teaching,priorPacket.fingerprints.teaching);
  assert.equal(packet.guidedTours.filter((item:any)=>item.tour.id===tourId).length,1);
  assert.deepEqual(packet.guidedTours.filter((item:any)=>item.tour.id!==tourId),
   priorPacket.guidedTours.filter((item:any)=>item.tour.id!==tourId));
  assert.deepEqual(packet.guidedTours.find((item:any)=>item.tour.id===tourId),evidence);
  assert.deepEqual(await current.parseBodyReviewResponse(packet,structure.id),packet);
  assert.equal(await current.parseBodyReviewResponse(priorPacket,structure.id),null);
  const context=await current.bodyReviewContext(structure.id);
  const oldContext=await before.bodyReviewContext(structure.id);
  assert.equal(context.sourceHash,oldContext.sourceHash);
  assert.notEqual(context.revisions.teaching,oldContext.revisions.teaching);
  assert.equal(context.revisions.imaging,null);
  for(const mutate of [
   (bad:any)=>{bad.guidedTours.find((item:any)=>item.tour.id===tourId).tour.steps.reverse();},
   (bad:any)=>{bad.guidedTours.find((item:any)=>item.tour.id===tourId).tour.steps[0].frameIds.push(pins.contextEntries[0].id);},
   (bad:any)=>{bad.guidedTours.find((item:any)=>item.tour.id===tourId).structures[0].sources[0].sha256='f'.repeat(64);},
   (bad:any)=>{bad.guidedTours.find((item:any)=>item.tour.id===tourId).stepFrames[0].min[0]-=1;},
  ]){const forged=wire(packet);mutate(forged);
   assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);}
  const decision={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',
   expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,
   checklistVersion:context.checklistVersion,draft:current.blankBodyReview(context,'teaching')};
  const save=(body:any)=>current.postBodyDecision(new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
    'oai-authenticated-user-id':'synthetic-lower-venous-reviewer'},body:JSON.stringify(body),
  }),storage);
  assert.equal((await save({...decision,materialHash:priorPacket.materialHash})).status,409);
  assert.equal((await save({...decision,revisionHash:oldContext.revisions.teaching})).status,409);
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await save(forged)).status,422);
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await save(approval)).status,422);
 }
 assert.deepEqual({changed,retained,placements,packets,storageCalls},
  {changed:13,retained:1091,placements:9936,packets:1104,storageCalls:0});
 const missing=wire(catalog);missing.structures=missing.structures.filter((item:any)=>item.id!==pins.entries[0].id);
 assert.throws(()=>current.regionalTourStructures(missing,tour));
 const alias=wire(catalog);alias.structures.push({...alias.structures[0],id:'vm:forged:alias',fmaId:pins.entries[0].fmaId});
 assert.throws(()=>current.regionalTourStructures(alias,tour));
 const changedSource=wire(catalog);
 changedSource.structures.find((item:any)=>item.id===pins.entries[0].id).sources[0].sha256='f'.repeat(64);
 assert.throws(()=>current.regionalTourStructures(changedSource,tour));
 const frame=wire(tour);frame.steps[0].frameIds[0]=pins.contextEntries[0].id;
 assert.throws(()=>current.regionalTourFrame(catalog,frame,0));
});

test('checked source190 retains the historical venous v2 tour and exact current bindings',async()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 const review=json('atlas-review/manifest.json'),learner=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision,pin.source);
 const current=await imported(),historical=await imported(introduced);
 const currentTour=current.regionalTours.find((item:any)=>item.id===tourId);
 const oldTour=historical.regionalTours.find((item:any)=>item.id===tourId);
 assert(currentTour,'current source190 contains the named lower-venous v2 tour');
 assert(oldTour,'introduction snapshot contains the named lower-venous v2 tour');
 assert.deepEqual(currentTour,oldTour,'the full nine-stop v2 source tour survives later tour additions');
 for(const path of sourcePaths){
  const source=git(pin.source,path),record=review.files.find((file:any)=>file.path===path);
  assert(record,path);assert.equal(record.sourceSha256,sha(source),path);
  const importedBytes=readFileSync('atlas-review/'+path);
  assert.equal(record.importedSha256,sha(importedBytes),path);
  assert.equal(learner.find((file:any)=>file.path===path)?.sha256,sha(source),path);
  if(path!=='lib/regional-tours.ts')assert.deepEqual(source,git(revision,path),`${path}: immutable v2 feature source`);
  else assert.notDeepEqual(source,git(revision,path),'later tours advance the whole regional source');
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,pin.source);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
});
