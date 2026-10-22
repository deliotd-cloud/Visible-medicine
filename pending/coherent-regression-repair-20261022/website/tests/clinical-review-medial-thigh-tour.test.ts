import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const atlas=currentAtlasDeliveryRoot();
const revision='469b2f6874cc3f8209c2f7b36fd830cae18dce9e';
const laterRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const previous='c26ef4bf570f05e4b0e078a620db49ca67922ed9';
const previousIntegration='6e5a56ae8a83d0bc8cd4c5f5ab719c3848d8e9d79ad7b21ce037117aef514a63';
const frozen='F:/VisibleMedicine/recovery/checkpoints/20261015-medial-thigh-website/website-before-source/source';
const introduced='F:/VisibleMedicine/recovery/checkpoints/20261015-medial-thigh-website/website-current-source/source';
const tourId='right-medial-thigh-orientation';
const tourRevision='right-medial-thigh-20261015-r1';
const sourcePaths=['lib/medial-thigh-tour.ts','content/medial-thigh-tour-pins.json','lib/regional-tours.ts'];
const muscleFmas=['FMA22450','FMA22456','FMA22452','FMA22459','FMA43883'];
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(commit:string,path:string)=>execFileSync('git',['--no-replace-objects','show',`${commit}:${path}`],
 {cwd:atlas,windowsHide:true,maxBuffer:64e6});
const entry=[
 "export * from './atlas-review/lib/regional-tours';",
 "export * from './atlas-review/lib/body-review-material';",
 "export * from './atlas-review/lib/body-review-response';",
 "export * from './atlas-review/lib/body-review-context';",
 "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 "export {nestedReviewRows,nestedReviewMaterial} from './atlas-review/lib/nested-review-material';",
 "export {specimenReviewRows,specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';",
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

test('medial-thigh source reaches exact learner and protected Review imports',
 {timeout:600000},async()=>{
 const currentPin=validateCurrentAtlasDelivery();
 assert.equal(currentPin.source,CURRENT_ATLAS_REVISION);
 assert.equal(currentPin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:atlas,windowsHide:true}).toString().trim(),currentPin.source);
 assert.equal(execFileSync('git',['merge-base',revision,laterRevision],{cwd:atlas,windowsHide:true}).toString().trim(),revision);
 assert.equal(execFileSync('git',['merge-base',laterRevision,currentPin.source],{cwd:atlas,windowsHide:true}).toString().trim(),laterRevision);
 const pins=JSON.parse(git(revision,'content/medial-thigh-tour-pins.json').toString());
 const oldReview=json(frozen+'/atlas-review/manifest.json');
 assert.equal(oldReview.revision,previous);
 assert.equal(oldReview.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldReview.files.length,1451);
 // Admit no frozen packet until every recorded imported byte matches its manifest.
 for(const file of oldReview.files)
  assert.equal(sha(readFileSync(frozen+'/atlas-review/'+file.path)),file.importedSha256,`frozen ${file.path}`);
 const introducedManifestBytes=readFileSync(introduced+'/atlas-review/manifest.json');
 assert.equal(sha(introducedManifestBytes),'bc37a2f9057d93ba84d2416e89afdc44d4780743ff5f708346afeff514fcf9d7',
  'exact recovered medial-thigh delivery manifest');
 const review=JSON.parse(introducedManifestBytes.toString());
 const viewerBase='public/atlas-review-viewer/';
 const viewer=json(introduced+'/'+viewerBase+'manifest.json');
 const modules=['head-neck','shoulder','female-pelvis','lower-limb'].map(name=>({name,base:`${introduced}/public/atlas-runtime/${name}/`,
  manifest:json(`${introduced}/public/atlas-runtime/${name}/manifest.json`)}));
 assert.equal(review.revision,revision);
 assert.equal(review.files.length,1453);
 assert.notEqual(review.websiteIntegrationSha256,previousIntegration);
 assert.equal(viewer.sourceCommit,revision);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const {name,base,manifest} of modules){
  assert.equal(manifest.sourceCommit,revision,name);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false,name+': '+flag);
  const inputs=json(base+'source-inputs.json');
  for(const path of sourcePaths){
   const input=inputs.find((file:any)=>file.path===path);
   if(name==='head-neck')assert.equal(input?.sha256,sha(git(revision,path)),`${name}: ${path}`);
   else assert.equal(input,undefined,`${name}: unrelated runtime has ${path}`);
  }
 }
 for(const path of sourcePaths){
  const expected=sha(git(revision,path));
  const record=review.files.find((file:any)=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,expected,path);
  assert.equal(record.importedSha256,expected,path);
  assert.equal(sha(readFileSync(introduced+'/atlas-review/'+path)),expected,path);
  assert.deepEqual(readFileSync(introduced+'/atlas-review/'+path),git(revision,path),
   `${path}: complete independently recovered introduction source`);
  for(const base of [introduced+'/public/atlas-review/',introduced+'/'+viewerBase,...modules.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`no public raw ${base+path}`);
 }
 const rendererPath='content/body-renderer-revision.json';
 const rendererRecord=review.files.find((file:any)=>file.path===rendererPath);assert(rendererRecord);
 const sourceRenderer=JSON.parse(git(revision,rendererPath).toString());
 const oldSourceRenderer=JSON.parse(git(previous,rendererPath).toString());
 const boundRenderer=json(introduced+'/atlas-review/'+rendererPath);
 const oldRenderer=json(frozen+'/atlas-review/'+rendererPath);
 assert.equal(rendererRecord.sourceSha256,sha(git(revision,rendererPath)));
 assert.equal(rendererRecord.importedSha256,sha(readFileSync(introduced+'/atlas-review/'+rendererPath)));
 assert.equal(boundRenderer.sourceRendererSha256,sourceRenderer.sha256);
 assert.equal(boundRenderer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(boundRenderer.sha256,sha(JSON.stringify({source:sourceRenderer.sha256,website:review.websiteIntegrationSha256})));
 assert.equal(oldRenderer.sourceRendererSha256,oldSourceRenderer.sha256);
 assert.equal(oldRenderer.websiteIntegrationSha256,previousIntegration);
 assert.equal(oldRenderer.sha256,sha(JSON.stringify({source:oldSourceRenderer.sha256,website:previousIntegration})));
 assert.notEqual(sourceRenderer.sha256,oldSourceRenderer.sha256);
 const displayPinsPath='content/body-review-display-pins.json';
 const displayPinsRecord=review.files.find((file:any)=>file.path===displayPinsPath);assert(displayPinsRecord);
 assert.equal(displayPinsRecord.sourceSha256,sha(git(revision,displayPinsPath)));
 assert.equal(displayPinsRecord.importedSha256,sha(readFileSync(introduced+'/atlas-review/'+displayPinsPath)));
 assert.deepEqual(JSON.parse(git(revision,displayPinsPath).toString()),json(introduced+'/atlas-review/'+displayPinsPath));
 const glbs=execFileSync('git',['ls-tree','-r','--name-only',revision],{cwd:atlas,windowsHide:true}).toString().trim().split(/\r?\n/).filter(path=>path.endsWith('.glb'));
 assert.equal(glbs.length,146);
 for(const path of glbs)assert.deepEqual(git(revision,path),git(previous,path),`unchanged GLB ${path}`);
 const live=await imported(introduced),before=await imported(frozen);
 const catalog=live.bodyDisplayCatalog(json(introduced+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 const oldCatalog=before.bodyDisplayCatalog(json(frozen+'/atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(catalog,oldCatalog);
 assert.deepEqual(pins.entries.map((s:any)=>s.fmaId),muscleFmas);
 assert.deepEqual(pins.contextEntries.map((s:any)=>s.fmaId),['FMA24474']);
 assert.deepEqual(pins.bundles.map((b:any)=>b.id).sort(),['thigh-muscles','thigh-skeleton']);
 const tour=live.regionalTours.find((item:any)=>item.id===tourId);assert(tour);
 assert.equal(tour.title,'Right thigh: medial muscles');
 assert.equal(tour.revision,tourRevision);assert.equal(tour.status,'draft');
 assert.match(tour.limitations,/Revision-bound radiologist sign-off remains pending/);
 assert.equal(live.regionalTours.length,50);
 assert.equal(live.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),301);
 assert.equal(before.regionalTours.length,49);
 assert.deepEqual(live.regionalTours.filter((t:any)=>t.id!==tourId),before.regionalTours);
 assert.equal(live.regionalTourFor('thigh').id,before.regionalTourFor('thigh').id);
 assert.deepEqual(live.regionalToursFor('thigh').map((t:any)=>t.id),[...before.regionalToursFor('thigh').map((t:any)=>t.id),tourId]);
 const chooser=readFileSync(introduced+'/atlas-review/app/whole-body-guided-learning.tsx');
 assert.deepEqual(chooser,readFileSync(frozen+'/atlas-review/app/whole-body-guided-learning.tsx'));
 assert.match(chooser.toString(),/regionalTours\.filter\(t=>t\.region===region\)/);
 const structures=live.regionalTourStructures(catalog,tour);
 assert.equal(structures.length,6);
 assert.deepEqual(tour.steps.map((s:any)=>structures.find((x:any)=>x.id===s.selectedId)?.fmaId),muscleFmas);
 assert.deepEqual(tour.contextIds.map((id:string)=>structures.find((x:any)=>x.id===id)?.fmaId),['FMA24474']);
 assert.deepEqual(tour.steps.map((s:any)=>s.frameIds),pins.entries.map((muscle:any)=>[muscle.id]));
 assert.deepEqual(tour.steps.map((s:any)=>s.view),['anterior','anterior','left','posterior','left']);
 assert(tour.steps.every((step:any)=>step.fadeOthers===true&&step.durationMs===14000&&step.references.length>0));
 assert.equal(live.regionalTourStepFrames(catalog,tour)?.length,5);
 const expectedIds=new Set([...pins.entries,...pins.contextEntries].map((s:any)=>s.id));
 assert.deepEqual(new Set(Object.keys(tour.requiredDisplayBundles)),expectedIds);
 for(const s of structures){
  const pinned=[...pins.entries,...pins.contextEntries].find((item:any)=>item.id===s.id);assert(pinned);
  assert.deepEqual(s,pinned);assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
 }
 const emitted=[emittedTeaching(modules[0].base,modules[0].manifest.files,true),emittedTeaching(introduced+'/'+viewerBase,viewer.files,true)];
 for(const code of emitted)for(const value of [tourId,tour.title,tourRevision,...tour.steps.flatMap((s:any)=>[s.title,s.caption])])
  assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`reachable emitted ${value}`);
 let changed=0,retained=0;
 for(const structure of catalog.structures){
  const current=await live.bodyReviewMaterial(structure.id),prior=await before.bodyReviewMaterial(structure.id);
  assert(current&&prior,structure.id);
  assert.deepEqual(current.source,prior.source,structure.id);
  assert.deepEqual(current.topics,prior.topics,structure.id);
  assert.deepEqual(current.reasoning,prior.reasoning,structure.id);
  assert.equal(current.topics.length,9,structure.id);
  if(expectedIds.has(structure.id)){
   changed++;
   const evidence=current.guidedTours.find((item:any)=>item.tour.id===tourId);assert(evidence,structure.id);
   assert.equal(current.guidedTours.filter((item:any)=>item.tour.id===tourId).length,1,structure.id);
   assert.deepEqual(current.guidedTours.filter((item:any)=>item.tour.id!==tourId),prior.guidedTours,structure.id);
   assert.equal(current.fingerprints.source,prior.fingerprints.source,structure.id);
   assert.notEqual(current.fingerprints.teaching,prior.fingerprints.teaching,structure.id);
   assert.deepEqual(evidence.tour,tour);assert.deepEqual(evidence.structures,structures);
   assert.deepEqual(evidence.bundles.map((b:any)=>b.id).sort(),['thigh-muscles','thigh-skeleton']);
   assert.equal(evidence.stepFrames.length,5);assert.equal(evidence.transition,'quintic-orbit');
   assert.equal(evidence.transitionMs,1800);assert.equal(evidence.separation,0);
   assert.equal(current.approval,false);
   const currentContext=await live.bodyReviewContext(structure.id);
   const priorContext=await before.bodyReviewContext(structure.id);
   assert(currentContext&&priorContext,structure.id);
   assert.equal(currentContext.sourceHash,priorContext.sourceHash,structure.id);
   assert.notEqual(currentContext.teachingHash,priorContext.teachingHash,structure.id);
   assert.notEqual(currentContext.revisions.teaching,priorContext.revisions.teaching,structure.id);
   assert.equal(currentContext.revisions.imaging,null);
   assert.equal((await live.parseBodyReviewResponse(current,structure.id))?.structureId,structure.id);
   for(const mutate of [
    (p:any)=>{p.guidedTours.find((e:any)=>e.tour.id===tourId).tour.steps[0].frameIds.push(pins.contextEntries[0].id);},
    (p:any)=>{p.guidedTours.find((e:any)=>e.tour.id===tourId).stepFrames[0].min[0]-=1;},
    (p:any)=>{p.guidedTours.find((e:any)=>e.tour.id===tourId).structures[0].sources[0].sha256='f'.repeat(64);},
    (p:any)=>{p.approval=true;},
   ]){const forged=wire(current);mutate(forged);assert.equal(await live.parseBodyReviewResponse(forged,structure.id),null);}
  }else{
   retained++;
   assert.deepEqual(current.guidedTours,prior.guidedTours,structure.id);
   assert.equal(current.fingerprints.teaching,prior.fingerprints.teaching,structure.id);
  }
 }
 assert.deepEqual({changed,retained},{changed:6,retained:1098});
 assert.equal(catalog.structures.length*9,9936);
 assert.deepEqual(live.nestedReviewRows,before.nestedReviewRows);
 assert.deepEqual(live.specimenReviewRows,before.specimenReviewRows);
 let nested=0,specimen=0;
 for(const row of live.nestedReviewRows)for(const surface of row.surfaces){
  const current=await live.nestedReviewMaterial(row.key,surface.id),prior=await before.nestedReviewMaterial(row.key,surface.id);
  assert(current&&prior,`nested ${row.key}/${surface.id}`);
  assert.deepEqual(current.source,prior.source);assert.deepEqual(current.teaching,prior.teaching);
  assert.equal(current.context.teachingHash,prior.context.teachingHash);nested++;
 }
 for(const row of live.specimenReviewRows)for(const surface of row.surfaces){
  const current=await live.specimenReviewMaterial(row.key,surface.id),prior=await before.specimenReviewMaterial(row.key,surface.id);
  assert(current&&prior,`specimen ${row.key}/${surface.id}`);
  assert.deepEqual(current.source,prior.source);assert.deepEqual(current.teaching,prior.teaching);
  assert.equal(current.context.teachingHash,prior.context.teachingHash);specimen++;
 }
 assert.deepEqual({nested,specimen},{nested:108,specimen:356});
 const missing=wire(catalog);missing.structures=missing.structures.filter((s:any)=>s.id!==pins.entries[0].id);
 assert.throws(()=>live.regionalTourStructures(missing,tour));
 const altered=wire(catalog);altered.structures.find((s:any)=>s.id===pins.entries[0].id).sources[0].sha256='f'.repeat(64);
 assert.throws(()=>live.regionalTourStructures(altered,tour));
 const frame=wire(tour);frame.steps[0].frameIds[0]=pins.contextEntries[0].id;
 assert.throws(()=>live.regionalTourFrame(catalog,frame,0));
});

test('checked source190 retains the historical medial-thigh tour and current Review bindings',async()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 assert.equal(pin.runtimeSources.shoulder,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 const review=json('atlas-review/manifest.json'),learner=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(review.revision,pin.source);
 const delivered=await imported(),historical=await imported(introduced);
 const currentTour=delivered.regionalTours.find((item:any)=>item.id===tourId);
 const oldTour=historical.regionalTours.find((item:any)=>item.id===tourId);
 assert(currentTour,'current source190 contains the named medial-thigh tour');
 assert(oldTour,'introduction snapshot contains the named medial-thigh tour');
 assert.deepEqual(currentTour,oldTour,'all five source stops remain exact');
 for(const path of sourcePaths){
  const source=git(pin.source,path),record=review.files.find((file:any)=>file.path===path);
  assert(record,path);assert.equal(record.sourceSha256,sha(source),path);
  assert.equal(record.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
  assert.equal(learner.find((file:any)=>file.path===path)?.sha256,sha(source),path);
  if(path!=='lib/regional-tours.ts')assert.deepEqual(source,git(revision,path),`${path}: immutable feature source`);
  else assert.notDeepEqual(source,git(revision,path),'later tours advance the whole regional source');
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,pin.source);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
});
