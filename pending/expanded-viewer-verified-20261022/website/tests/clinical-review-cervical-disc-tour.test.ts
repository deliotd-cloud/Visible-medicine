import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import test from 'node:test';
import {build} from 'esbuild';
import {exactSourceHistoryApi} from '../../atlas/scripts/exact-source-history-api.mjs';
import {exactCervicalHistory} from './cervical-exact-history.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

// Exact-history bundles are dynamically imported test APIs. Keep their boundary
// explicit; the assertions below validate their runtime structures and values.
type HistoryApi=any;
type ReviewPacket=any;
type PinEntry={id:string;fmaId:string;bundle:string};
type PinSet={baseline:string;entries:PinEntry[];contextEntries:PinEntry[];bundles:{id:string}[]};

const atlas=currentAtlasDeliveryRoot();
const beforeRevision='6b6d9bba99985dfc5ca8deb52ca9e2632b837d25';
const introduction='c26ef4bf570f05e4b0e078a620db49ca67922ed9';
const playback='c978ecee3bdddfeaf2995ecbf62d5178e719c4fb';
const currentRevision='509b01da5d72f33bd774e4a59d63e2406af1f2ff';
const trees={
 [beforeRevision]:'a84ecc18997c80b7f68917425164ea24993020dd',
 [introduction]:'72c74532612b9f93705a968fbdd2d7bfd944b2b0',
 [playback]:'5b468123c407a2ffc8eeacd88a42b9a56ef7f688',
 [currentRevision]:'a9a1581bd6a3220b7d4b2554644fe0c56b688430',
};
const frozen='F:/VisibleMedicine/recovery/checkpoints/20261014-cervical-disc-website/website-before-source/source';
const beforeIntegration='656e9b6dd27f273ef962806250140dc49d061fa29edeb2288bd8f715fc5ae56d';
const frozenManifestSha='8bfa2fcfd6be12c8e0434a904217d24711ef201c8f157187680d763427ab68ef';
const tourId='cervical-whole-discs-orientation',tourRevision='cervical-whole-discs-20261014-r1';
const sourcePaths=['lib/cervical-disc-tour.ts','content/cervical-disc-tour-pins.json','lib/regional-tours.ts'];
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const discFmas=['FMA25058','FMA13896','FMA13897','FMA13898','FMA13899','FMA13900'];
const boneFmas=['FMA12520','FMA12521','FMA12522','FMA12523','FMA12524','FMA12525','FMA9165'];
const firstTourIntroductions=[
 'vm:anatomy:body:thigh:right:muscle:right-adductor-brevis',
 'vm:anatomy:body:thigh:right:muscle:right-adductor-magnus',
 'vm:anatomy:body:thigh:right:muscle:right-gracilis',
 'vm:anatomy:body:thigh:right:muscle:right-pectineus',
 'vm:anatomy:body:leg:right:muscle:medial-head-of-right-gastrocnemius',
 'vm:anatomy:body:leg:right:muscle:lateral-head-of-right-gastrocnemius',
 'vm:anatomy:body:leg:right:tendon:right-calcaneal-tendon',
 'vm:anatomy:body:leg:right:vessel:right-anterior-tibial-vein',
 'vm:anatomy:body:leg:right:vessel:right-posterior-tibial-vein',
 'vm:anatomy:body:thigh:right:vessel:right-deep-femoral-vein',
];
const sha=(value:Uint8Array|string):string=>createHash('sha256').update(value).digest('hex');
const json=(path:string):any=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const command=(...args:string[]):Buffer=>execFileSync('git',['--no-replace-objects',...args],
 {cwd:atlas,windowsHide:true,maxBuffer:64e6});
const git=(commit:string,path:string):Buffer=>command('show',`${commit}:${path}`);
const rev=(...args:string[]):string=>command('rev-parse',...args).toString().trim();
const activeAtlas=():string=>{
 assert.equal(command('status','--porcelain=v1','--untracked-files=all').toString().trim(),'','Atlas source checkout must be clean');
 const head=rev('HEAD');assert.match(head,/^[a-f0-9]{40}$/);
 assert.equal(command('merge-base',currentRevision,head).toString().trim(),currentRevision,
  'genuine 509b checkpoint must precede the active source');
 return head;
};
const entry=[
 "export * from './atlas-review/lib/regional-tours';",
 "export * from './atlas-review/lib/body-review-material';",
 "export * from './atlas-review/lib/body-review-response';",
 "export * from './atlas-review/lib/body-review-context';",
 "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
 "export {bodyLesson} from './atlas-review/app/body-content';",
 "export {spineImagingLesson} from './atlas-review/lib/spine-imaging';",
 "export {nestedReviewRows,nestedReviewMaterial} from './atlas-review/lib/nested-review-material';",
 "export {specimenReviewRows,specimenReviewMaterial} from './atlas-review/lib/specimen-review-material';",
].join('\n');
async function imported(root?:string):Promise<HistoryApi>{
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
function pathsChanged(a:any,b:any,path=''):string[]{
 if(isDeepStrictEqual(a,b))return [];
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
  const keys=new Set<string>([...Object.keys(a),...Object.keys(b)]),out:string[]=[];
  for(const key of keys){
   const next=path+'/'+key.replaceAll('~','~0').replaceAll('/','~1');
   if(!Object.hasOwn(a,key)||!Object.hasOwn(b,key))out.push(next);
   else out.push(...pathsChanged(a[key],b[key],next));
  }
  if(Array.isArray(a)&&a.length!==b.length)out.push(path+'/length');
  return out.sort();
 }
 return [path||'/'];
}
function sameExceptDerived(source:unknown,delivery:unknown,expected:string[],label:string):void{
 assert.deepEqual(pathsChanged(source,delivery),expected.slice().sort(),label);
}
const ids=(rows:ReviewPacket[]):Array<[string,string]>=>rows.flatMap((row:ReviewPacket)=>
 row.surfaces.map((surface:ReviewPacket):[string,string]=>[row.key,surface.id]));

test('genuine 6b to c26 cervical introduction preserves prior teaching and refuses forged tour evidence',
 {timeout:600000},async()=>{
 const head=activeAtlas();
 for(const [commit,tree] of Object.entries(trees)){
  assert.equal(rev(`${commit}^{tree}`),tree,commit+' genuine tree');
  assert.equal(command('merge-base',commit,head).toString().trim(),commit,commit+' active-source ancestor');
 }
 const pins:PinSet=JSON.parse(git(introduction,'content/cervical-disc-tour-pins.json').toString());
 assert.deepEqual(git(introduction,'content/cervical-disc-tour-pins.json'),git(currentRevision,'content/cervical-disc-tour-pins.json'));
 assert.equal(pins.baseline,beforeRevision);
 assert.deepEqual(pins.entries.map(s=>s.fmaId),discFmas);
 assert.deepEqual(pins.contextEntries.map(s=>s.fmaId),boneFmas);
 assert.deepEqual(pins.bundles.map(b=>b.id).sort(),['spine-connective-gaps','spine-skeleton']);
 const oldReview=json(frozen+'/atlas-review/manifest.json');
 assert.equal(sha(readFileSync(frozen+'/atlas-review/manifest.json')),frozenManifestSha);
 assert.equal(oldReview.revision,beforeRevision);assert.equal(oldReview.websiteIntegrationSha256,beforeIntegration);
 assert.equal(oldReview.files.length,1449);
 for(const file of oldReview.files){
  assert.equal(sha(readFileSync(frozen+'/atlas-review/'+file.path)),file.importedSha256,`frozen ${file.path}`);
  assert.equal(file.sourceSha256,sha(git(beforeRevision,file.path)),`frozen Git source ${file.path}`);
 }
 assert.deepEqual(git(introduction,catalogPath),git(beforeRevision,catalogPath));
 const glbs=command('ls-tree','-r','--name-only',introduction).toString().trim().split(/\r?\n/).filter(path=>path.endsWith('.glb'));
 assert.equal(glbs.length,146);
 for(const path of glbs)assert.deepEqual(git(introduction,path),git(beforeRevision,path),`unchanged GLB ${path}`);
 assert.deepEqual(git(introduction,'app/whole-body-guided-learning.tsx'),git(beforeRevision,'app/whole-body-guided-learning.tsx'));
 const prior=await exactSourceHistoryApi(beforeRevision,'regional-tour-review');
 const introduced=await exactSourceHistoryApi(introduction,'regional-tour-review');
 const spine=await exactCervicalHistory(introduction,'spine');
 const priorNested=await exactSourceHistoryApi(beforeRevision,'nested-review-security');
 const introNested=await exactSourceHistoryApi(introduction,'nested-review-security');
 const priorSpecimen=await exactCervicalHistory(beforeRevision,'specimen');
 const introSpecimen=await exactCervicalHistory(introduction,'specimen');
 const frozenApi=await imported(frozen);
 const rawCatalog=JSON.parse(git(introduction,catalogPath).toString());
 const catalog=introduced.bodyDisplayCatalog(rawCatalog),oldCatalog=prior.bodyDisplayCatalog(JSON.parse(git(beforeRevision,catalogPath).toString()));
 assert.deepEqual(catalog,oldCatalog);assert.equal(catalog.structures.length,1104);
 assert.deepEqual(frozenApi.bodyDisplayCatalog(json(frozen+'/atlas-review/'+catalogPath)),oldCatalog);
 assert.deepEqual(frozenApi.regionalTours,prior.regionalTours);
 assert.deepEqual(frozenApi.nestedReviewRows,priorNested.nestedReviewRows);
 assert.deepEqual(frozenApi.specimenReviewRows,priorSpecimen.specimenReviewRows);
 const tour=introduced.regionalTours.find((item:ReviewPacket)=>item.id===tourId);assert(tour);
 assert.equal(tour.title,'Cervical spine: whole discs');assert.equal(tour.revision,tourRevision);assert.equal(tour.status,'draft');
 assert.equal(introduced.regionalTours.length,49);
 assert.equal(introduced.regionalTours.reduce((n:number,t:ReviewPacket)=>n+t.steps.length,0),296);
 assert.equal(prior.regionalTours.length,48);
 assert.deepEqual(introduced.regionalTours.filter((t:ReviewPacket)=>t.id!==tourId),prior.regionalTours);
 assert.equal(introduced.regionalTourFor('spine').id,prior.regionalTourFor('spine').id);
 assert.deepEqual(introduced.regionalToursFor('spine').map((t:ReviewPacket)=>t.id),
  [...prior.regionalToursFor('spine').map((t:ReviewPacket)=>t.id),tourId]);
 const structures=introduced.regionalTourStructures(catalog,tour);assert.equal(structures.length,13);
 assert.deepEqual(tour.steps.map((s:ReviewPacket)=>structures.find((x:ReviewPacket)=>x.id===s.selectedId)?.fmaId),discFmas);
 assert.deepEqual(tour.contextIds.map((id:string)=>structures.find((x:ReviewPacket)=>x.id===id)?.fmaId),boneFmas);
 assert.deepEqual(tour.steps.map((s:ReviewPacket)=>s.frameIds),pins.entries.map((disc:PinEntry,i:number)=>[disc.id,pins.contextEntries[i].id,pins.contextEntries[i+1].id]));
 assert(tour.steps.every((step:ReviewPacket)=>step.view==='left'&&step.fadeOthers===true&&step.durationMs===14000));
 assert.equal(introduced.regionalTourStepFrames(catalog,tour)?.length,6);
 const expectedIds=new Set([...pins.entries,...pins.contextEntries].map((s:PinEntry)=>s.id));
 assert.deepEqual(new Set(Object.keys(tour.requiredDisplayBundles)),expectedIds);
 for(const s of structures){const pinned=[...pins.entries,...pins.contextEntries].find((item:PinEntry)=>item.id===s.id);assert(pinned);
  assert.deepEqual(s,pinned);assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);}
 for(const disc of pins.entries){
  const actual=structures.find((s:ReviewPacket)=>s.id===disc.id),old=oldCatalog.structures.find((s:ReviewPacket)=>s.id===disc.id);assert(actual&&old);
  for(const modality of ['ct','mri','xray','ultrasound']){
   const source=spine.spineImagingLesson(actual,modality),imported=introduced.bodyLesson(actual,modality),previous=prior.bodyLesson(old,modality);
   assert.deepEqual(imported,previous,`${disc.fmaId}/${modality}: pre-cervical note preserved`);
   if(source)assert.deepEqual(imported,source,`${disc.fmaId}/${modality}: exact introduction note`);
   else assert.equal(modality,'ultrasound');
  }
 }
 let changed=0,topicPlacements=0;
 for(const structure of catalog.structures){
  const now=await introduced.bodyReviewMaterial(structure.id),old=await prior.bodyReviewMaterial(structure.id);
  const frozenMaterial=await frozenApi.bodyReviewMaterial(structure.id);
  const nowContext=await introduced.bodyReviewContext(structure.id),oldContext=await prior.bodyReviewContext(structure.id);
  assert(now&&old,structure.id);assert.equal(now.topics.length,9);assert.equal(old.topics.length,9);topicPlacements+=9;
  assert(nowContext&&oldContext,`${structure.id}: source context`);
  assert.deepEqual(frozenMaterial,old,`${structure.id}: exact frozen Review material`);
  sameExceptDerived(oldContext,await frozenApi.bodyReviewContext(structure.id),
   ['/rendererHash','/revisions/geometry'],`${structure.id}: frozen Review renderer binding`);
  assert.deepEqual(now.source,old.source,structure.id);assert.deepEqual(now.topics,old.topics,structure.id);
  assert.equal(nowContext.sourceHash,oldContext.sourceHash,`${structure.id}: source context hash`);
  if(expectedIds.has(structure.id)){
   changed++;
   assert.notEqual(nowContext.teachingHash,oldContext.teachingHash,`${structure.id}: introduced teaching hash`);
   const evidence=now.guidedTours.find((item:ReviewPacket)=>item.tour.id===tourId);assert(evidence,structure.id);
   assert.deepEqual(evidence.tour,tour);assert.equal(evidence.stepFrames.length,6);
   assert.deepEqual(evidence.structures,structures);
   assert.deepEqual(evidence.bundles.map((b:ReviewPacket)=>b.id).sort(),['spine-connective-gaps','spine-skeleton']);
   assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.transitionMs,1800);
   assert.equal(now.approval,false);
   assert.equal((await introduced.bodyReviewContext(structure.id))?.revisions.imaging,null);
   assert.equal((await introduced.parseBodyReviewResponse(now,structure.id))?.structureId,structure.id);
   for(const mutate of [
    (p:ReviewPacket)=>{p.guidedTours.find((e:ReviewPacket)=>e.tour.id===tourId).tour.steps[0].frameIds.pop();},
    (p:ReviewPacket)=>{p.guidedTours.find((e:ReviewPacket)=>e.tour.id===tourId).stepFrames[0].min[0]-=1;},
    (p:ReviewPacket)=>{p.guidedTours.find((e:ReviewPacket)=>e.tour.id===tourId).structures[0].sources[0].sha256='f'.repeat(64);},
    (p:ReviewPacket)=>{p.approval=true;},
   ]){const forged=wire(now);mutate(forged);assert.equal(await introduced.parseBodyReviewResponse(forged,structure.id),null);}
  }else{
   assert.deepEqual(now.guidedTours,old.guidedTours,structure.id);
   assert.equal(now.fingerprints.teaching,old.fingerprints.teaching,structure.id);
   assert.equal(nowContext.teachingHash,oldContext.teachingHash,`${structure.id}: preserved teaching context hash`);
  }
 }
 assert.equal(changed,13);assert.equal(catalog.structures.length-changed,1091);assert.equal(topicPlacements,9936);
 assert.deepEqual(introNested.nestedReviewRows,priorNested.nestedReviewRows);
 assert.deepEqual(introSpecimen.specimenReviewRows,priorSpecimen.specimenReviewRows);
 let nested=0,specimen=0;
 for(const [key,id] of ids(introNested.nestedReviewRows)){
  const now=await introNested.nestedReviewMaterial(key,id),old=await priorNested.nestedReviewMaterial(key,id),
   frozenPacket=await frozenApi.nestedReviewMaterial(key,id);assert(now&&old&&frozenPacket);
  assert.deepEqual(frozenPacket.source,old.source);assert.deepEqual(frozenPacket.teaching,old.teaching);
  sameExceptDerived(old.context,frozenPacket.context,['/materialHash','/rendererHash','/revisions/geometry'],
   `${key}/${id}: frozen Review renderer binding`);
  assert.deepEqual(now.source,old.source);assert.deepEqual(now.teaching,old.teaching);
  assert.equal(now.context.sourceHash,old.context.sourceHash);assert.equal(now.context.teachingHash,old.context.teachingHash);
  assert.equal(now.context.revisions.teaching,old.context.revisions.teaching);assert.equal(now.context.revisions.imaging,null);nested++;
 }
 for(const [key,id] of ids(introSpecimen.specimenReviewRows)){
  const now=await introSpecimen.specimenReviewMaterial(key,id),old=await priorSpecimen.specimenReviewMaterial(key,id),
   frozenPacket=await frozenApi.specimenReviewMaterial(key,id);assert(now&&old&&frozenPacket);
  assert.deepEqual(frozenPacket.source,old.source);assert.deepEqual(frozenPacket.teaching,old.teaching);
  sameExceptDerived(old.context,frozenPacket.context,['/materialHash','/rendererHash','/revisions/geometry'],
   `${key}/${id}: frozen Review renderer binding`);
  assert.deepEqual(now.source,old.source);assert.deepEqual(now.teaching,old.teaching);
  assert.equal(now.context.sourceHash,old.context.sourceHash);assert.equal(now.context.teachingHash,old.context.teachingHash);
  assert.equal(now.context.revisions.teaching,old.context.revisions.teaching);assert.equal(now.context.revisions.imaging,null);specimen++;
 }
 assert.deepEqual({nested,specimen},{nested:108,specimen:356});
 const missing=wire(catalog);missing.structures=missing.structures.filter((s:ReviewPacket)=>s.id!==pins.entries[0].id);
 assert.throws(()=>introduced.regionalTourStructures(missing,tour));
 const altered=wire(catalog);altered.structures.find((s:ReviewPacket)=>s.id===pins.entries[0].id).sources[0].sha256='f'.repeat(64);
 assert.throws(()=>introduced.regionalTourStructures(altered,tour));
 const frame=wire(tour);frame.steps[0].frameIds[1]=pins.contextEntries[3].id;
 assert.throws(()=>introduced.regionalTourStructures(catalog,frame));
});

test('immutable 509b checkpoint records every later teaching and playback change since c26',
 {timeout:600000},async()=>{
 activeAtlas();
 assert.equal(rev(`${currentRevision}^{tree}`),trees[currentRevision]);
 const introduced=await exactSourceHistoryApi(introduction,'regional-tour-review');
 const checkpoint=await exactSourceHistoryApi(currentRevision,'regional-tour-review');
 const playbackSource=await exactSourceHistoryApi(playback,'regional-tour-review');
 const introNested=await exactSourceHistoryApi(introduction,'nested-review-security');
 const checkpointNested=await exactSourceHistoryApi(currentRevision,'nested-review-security');
 const introSpecimen=await exactCervicalHistory(introduction,'specimen');
 const checkpointSpecimen=await exactCervicalHistory(currentRevision,'specimen');
 const catalog=checkpoint.bodyDisplayCatalog(JSON.parse(git(currentRevision,catalogPath).toString()));
 assert.deepEqual(git(currentRevision,catalogPath),git(beforeRevision,catalogPath),
  '509b checkpoint retains the pre-cervical model catalog');
 assert.deepEqual(checkpoint.regionalTours,playbackSource.regionalTours,'all 51 checkpoint tours equal genuine playback epoch');
 assert.equal(checkpoint.regionalTours.length,51);
 assert.deepEqual(checkpoint.regionalTours.find((t:ReviewPacket)=>t.id===tourId),
  introduced.regionalTours.find((t:ReviewPacket)=>t.id===tourId),'cervical source tour survives to 509b');
 let bodyTeaching=0,bodyTourLength=0,bodyContinuousInPlace=0,bodyDirectContinuous=0;
 const addedFirstTours=new Set<string>();
 for(const structure of catalog.structures){
  const id=structure.id,now=await checkpoint.bodyReviewMaterial(id),prior=await introduced.bodyReviewMaterial(id),
   nowContext=await checkpoint.bodyReviewContext(id),priorContext=await introduced.bodyReviewContext(id);
  assert(now&&prior&&nowContext&&priorContext,id);
  assert.equal(now.topics.length,9);assert.deepEqual(now.source,prior.source,`${id}: 509b source stays c26 source`);
  assert.equal(nowContext.sourceHash,priorContext.sourceHash,`${id}: 509b source hash stays c26`);
  if(now.fingerprints.teaching!==prior.fingerprints.teaching)bodyTeaching++;
  if(now.guidedTours.length!==prior.guidedTours.length)bodyTourLength++;
  const beforeFirst=prior.guidedTours[0],afterFirst=now.guidedTours[0];
  if(!beforeFirst&&afterFirst){
   assert.notEqual(afterFirst.continuousPlayback,undefined,`${id}: new first tour carries continuous playback`);
   addedFirstTours.add(id);
  }else if(beforeFirst&&afterFirst&&
   !isDeepStrictEqual(afterFirst.continuousPlayback,beforeFirst.continuousPlayback))bodyContinuousInPlace++;
  if(!isDeepStrictEqual(afterFirst?.continuousPlayback,beforeFirst?.continuousPlayback))bodyDirectContinuous++;
 }
 assert.deepEqual([...addedFirstTours],firstTourIntroductions,'exact ten newly present first-tour packet IDs');
 assert.deepEqual({bodyTeaching,bodyTourLength,bodyContinuousInPlace,firstTourIntroductions:addedFirstTours.size,bodyDirectContinuous},
  {bodyTeaching:542,bodyTourLength:17,bodyContinuousInPlace:304,firstTourIntroductions:10,bodyDirectContinuous:314});
 assert.equal(bodyDirectContinuous,bodyContinuousInPlace+addedFirstTours.size,
  'every direct optional-value change is an in-place field change or a new first tour');
 assert.deepEqual(checkpointNested.nestedReviewRows,introNested.nestedReviewRows);
 assert.deepEqual(checkpointSpecimen.specimenReviewRows,introSpecimen.specimenReviewRows);
 let nested=0,nestedTeaching=0,nestedUs=0,nestedContinuous=0;
 for(const [key,id] of ids(checkpointNested.nestedReviewRows)){
  const now=await checkpointNested.nestedReviewMaterial(key,id),prior=await introNested.nestedReviewMaterial(key,id);assert(now&&prior);
  assert.deepEqual(now.source,prior.source);assert.equal(now.context.sourceHash,prior.context.sourceHash);
  if(now.context.teachingHash!==prior.context.teachingHash)nestedTeaching++;
  if(!isDeepStrictEqual(now.teaching.concept?.imaging?.ultrasound,prior.teaching.concept?.imaging?.ultrasound))nestedUs++;
  if(!isDeepStrictEqual(now.teaching.guidedLearning?.continuousPlayback,prior.teaching.guidedLearning?.continuousPlayback))nestedContinuous++;
  nested++;
 }
 let specimen=0,specimenTeaching=0,specimenContinuous=0;
 for(const [key,id] of ids(checkpointSpecimen.specimenReviewRows)){
  const now=await checkpointSpecimen.specimenReviewMaterial(key,id),prior=await introSpecimen.specimenReviewMaterial(key,id);assert(now&&prior);
  assert.deepEqual(now.source,prior.source);assert.equal(now.context.sourceHash,prior.context.sourceHash);
  if(now.context.teachingHash!==prior.context.teachingHash)specimenTeaching++;
  if(!isDeepStrictEqual(now.teaching.guidedDissection?.continuousPlayback,prior.teaching.guidedDissection?.continuousPlayback))specimenContinuous++;
  specimen++;
 }
 assert.deepEqual({nested,nestedTeaching,nestedUs,nestedContinuous,specimen,specimenTeaching,specimenContinuous},
  {nested:108,nestedTeaching:27,nestedUs:4,nestedContinuous:23,specimen:356,specimenTeaching:329,specimenContinuous:329});
});

test('actual current Atlas HEAD and Review preserve the cervical tour and exact delivered source',
 {timeout:600000},async()=>{
 const deliveryRevision=activeAtlas();
 const pins:PinSet=JSON.parse(git(introduction,'content/cervical-disc-tour-pins.json').toString());
 assert.deepEqual(git(deliveryRevision,'content/cervical-disc-tour-pins.json'),
  git(introduction,'content/cervical-disc-tour-pins.json'),'fixed cervical pin source survives later commits');
 const review=json('atlas-review/manifest.json'),viewerBase='public/atlas-review-viewer/',viewer=json(viewerBase+'manifest.json');
 assert.equal(review.revision,deliveryRevision);assert.notEqual(review.websiteIntegrationSha256,beforeIntegration);
 assert.equal(viewer.sourceCommit,deliveryRevision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 const modules=['head-neck','shoulder','female-pelvis','lower-limb'].map(name=>({name,base:`public/atlas-runtime/${name}/`,
  manifest:json(`public/atlas-runtime/${name}/manifest.json`)}));
 for(const {name,base,manifest} of modules){
  assert.equal(manifest.sourceCommit,deliveryRevision,name);
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[flag],false,name+': '+flag);
  const inputs=json(base+'source-inputs.json');
  for(const path of sourcePaths){const input=inputs.find((file:ReviewPacket)=>file.path===path);
   if(name==='head-neck')assert.equal(input?.sha256,sha(git(deliveryRevision,path)));
   else assert.equal(input,undefined,`${name}: unrelated cervical source`);}
 }
 for(const path of sourcePaths){
  const expected=sha(git(deliveryRevision,path)),record=review.files.find((file:ReviewPacket)=>file.path===path);assert(record,path);
  assert.equal(record.sourceSha256,expected);assert.equal(record.importedSha256,expected);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected);
  assert.equal(sha(Buffer.from(readFileSync(atlas+'/'+path).toString().replaceAll('\r\n','\n'))),expected);
  for(const base of ['public/atlas-review/',viewerBase,...modules.map(item=>item.base)])
   assert.equal(existsSync(base+path),false,`no public raw ${base+path}`);
 }
 const rendererPath='content/body-renderer-revision.json',rendererRecord=review.files.find((file:ReviewPacket)=>file.path===rendererPath);assert(rendererRecord);
 const sourceRenderer=JSON.parse(git(deliveryRevision,rendererPath).toString()),
  oldSourceRenderer=JSON.parse(git(beforeRevision,rendererPath).toString());
 const boundRenderer=json('atlas-review/'+rendererPath),oldRenderer=json(frozen+'/atlas-review/'+rendererPath);
 assert.equal(rendererRecord.sourceSha256,sha(git(deliveryRevision,rendererPath)));
 assert.equal(rendererRecord.importedSha256,sha(readFileSync('atlas-review/'+rendererPath)));
 assert.equal(boundRenderer.sourceRendererSha256,sourceRenderer.sha256);
 assert.equal(boundRenderer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(boundRenderer.sha256,sha(JSON.stringify({source:sourceRenderer.sha256,website:review.websiteIntegrationSha256})));
 assert.equal(oldRenderer.sourceRendererSha256,oldSourceRenderer.sha256);
 assert.equal(oldRenderer.websiteIntegrationSha256,beforeIntegration);
 assert.equal(oldRenderer.sha256,sha(JSON.stringify({source:oldSourceRenderer.sha256,website:beforeIntegration})));
 assert.notEqual(sourceRenderer.sha256,oldSourceRenderer.sha256);
 assert.deepEqual(readFileSync('atlas-review/'+catalogPath),git(deliveryRevision,catalogPath));
 const currentHistory=(await import(pathToFileURL(resolve(atlas,'scripts/exact-source-history-api.mjs')).href)).exactSourceHistoryApi;
 const live=await imported(),introduced=await exactSourceHistoryApi(introduction,'regional-tour-review');
 const source=await currentHistory(deliveryRevision,'regional-tour-review');
 const sourceNested=await currentHistory(deliveryRevision,'nested-review-security');
 const sourceSpecimen=await exactCervicalHistory(deliveryRevision,'specimen',atlas);
 const catalog=live.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
 assert.deepEqual(catalog,source.bodyDisplayCatalog(JSON.parse(git(deliveryRevision,catalogPath).toString())));
 const tour=live.regionalTours.find((item:ReviewPacket)=>item.id===tourId),
  introducedTour=introduced.regionalTours.find((item:ReviewPacket)=>item.id===tourId);assert(tour&&introducedTour);
 assert.deepEqual(tour,introducedTour,'cervical tour retains exact c26 source stops and camera');
 assert.deepEqual(live.regionalTours,source.regionalTours,'complete delivered Review tour population matches actual current source');
 const chooser=readFileSync('atlas-review/app/whole-body-guided-learning.tsx');
 assert.match(chooser.toString(),/regionalTours\.filter\(t=>t\.region===region\)/);
 assert.match(chooser.toString(),/region==='whole-body'\?wholeBodyTourOptions/);
 const structures=live.regionalTourStructures(catalog,tour);assert.equal(structures.length,13);
 const introCatalog=introduced.bodyDisplayCatalog(JSON.parse(git(introduction,catalogPath).toString()));
 assert.deepEqual(structures,introduced.regionalTourStructures(introCatalog,introducedTour),
  'all thirteen cervical display sources remain the exact c26 pins');
 assert.deepEqual(tour.steps.map((s:ReviewPacket)=>structures.find((x:ReviewPacket)=>x.id===s.selectedId)?.fmaId),discFmas);
 assert.deepEqual(tour.contextIds.map((id:string)=>structures.find((x:ReviewPacket)=>x.id===id)?.fmaId),boneFmas);
 for(const disc of pins.entries){
  const actual:ReviewPacket=structures.find((s:ReviewPacket)=>s.id===disc.id);assert(actual);
  for(const modality of ['ct','mri','xray','ultrasound']){
   const imported=live.bodyLesson(actual,modality),exact:ReviewPacket=source.bodyLesson(actual,modality);
   assert.deepEqual(imported,exact,`${disc.fmaId}/${modality}: current Review matches Git source`);
   const spine=live.spineImagingLesson(actual,modality);
   if(spine)assert.deepEqual(imported,spine);
   else assert.equal(modality,'ultrasound');
  }
 }
 const emitted=[emittedTeaching(modules[0].base,modules[0].manifest.files,true),emittedTeaching(viewerBase,viewer.files,true)];
 for(const code of emitted)for(const value of [tourId,tour.title,tourRevision,...tour.steps.map((s:ReviewPacket)=>s.title)])
  assert(code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1)),`reachable emitted ${value}`);
 for(const structure of catalog.structures){
  const id=structure.id,material=await live.bodyReviewMaterial(id),exact=await source.bodyReviewMaterial(id);
  const context=await live.bodyReviewContext(id),sourceContext=await source.bodyReviewContext(id);
  assert(material&&exact&&context&&sourceContext,id);
  assert.equal(material.topics.length,9);assert.deepEqual(material,exact,`${id}: all current worksheet fields`);
  assert.equal(context.sourceHash,sourceContext.sourceHash,`${id}: exact delivered source context hash`);
  assert.equal(context.teachingHash,sourceContext.teachingHash,`${id}: exact delivered teaching context hash`);
  sameExceptDerived(sourceContext,context,['/rendererHash','/revisions/geometry'],`${id}: exact Review renderer binding`);
 }
 assert.deepEqual(live.nestedReviewRows,sourceNested.nestedReviewRows);
 assert.deepEqual(live.specimenReviewRows,sourceSpecimen.specimenReviewRows);
 let nested=0;
 for(const [key,id] of ids(live.nestedReviewRows)){
  const current=await live.nestedReviewMaterial(key,id),exact=await sourceNested.nestedReviewMaterial(key,id);
  assert(current&&exact);
  assert.deepEqual(current.source,exact.source);assert.deepEqual(current.teaching,exact.teaching);
  assert.equal(current.context.revisions.imaging,null);
  assert.equal(current.context.sourceHash,exact.context.sourceHash);
  assert.equal(current.context.teachingHash,exact.context.teachingHash);
  sameExceptDerived(exact.context,current.context,['/materialHash','/rendererHash','/revisions/geometry'],`${key}/${id}: Review renderer binding`);
  nested++;
 }
 let specimen=0;
 for(const [key,id] of ids(live.specimenReviewRows)){
  const current=await live.specimenReviewMaterial(key,id),exact=await sourceSpecimen.specimenReviewMaterial(key,id);
  assert(current&&exact);
  assert.deepEqual(current.source,exact.source);assert.deepEqual(current.teaching,exact.teaching);
  assert.equal(current.context.revisions.imaging,null);
  assert.equal(current.context.sourceHash,exact.context.sourceHash);
  assert.equal(current.context.teachingHash,exact.context.teachingHash);
  sameExceptDerived(exact.context,current.context,['/materialHash','/rendererHash','/revisions/geometry'],`${key}/${id}: Review renderer binding`);
  specimen++;
 }
 assert.equal(nested,sourceNested.nestedReviewRows.reduce((n:number,row:ReviewPacket)=>n+row.surfaces.length,0));
 assert.equal(specimen,sourceSpecimen.specimenReviewRows.reduce((n:number,row:ReviewPacket)=>n+row.surfaces.length,0));
 const expectedIds=new Set([...pins.entries,...pins.contextEntries].map((s:PinEntry)=>s.id));
 for(const id of expectedIds){
  const current=await live.bodyReviewMaterial(id);assert(current);
  const originalCervical=await introduced.bodyReviewMaterial(id);assert(originalCervical);
  assert.deepEqual(current.source,originalCervical.source,`${id}: fixed cervical source survives`);
  const evidence=current.guidedTours.find((item:ReviewPacket)=>item.tour.id===tourId);assert(evidence);
  assert.deepEqual(evidence.tour,tour);assert.equal(evidence.stepFrames.length,6);
  assert.deepEqual(evidence.structures,structures);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.transitionMs,1800);
  assert.equal(current.approval,false);assert.equal((await live.bodyReviewContext(id))?.revisions.imaging,null);
  assert.equal((await live.parseBodyReviewResponse(current,id))?.structureId,id);
  for(const mutate of [
   (p:ReviewPacket)=>{p.guidedTours.find((e:ReviewPacket)=>e.tour.id===tourId).tour.steps[0].frameIds.pop();},
   (p:ReviewPacket)=>{p.guidedTours.find((e:ReviewPacket)=>e.tour.id===tourId).stepFrames[0].min[0]-=1;},
   (p:ReviewPacket)=>{p.guidedTours.find((e:ReviewPacket)=>e.tour.id===tourId).structures[0].sources[0].sha256='f'.repeat(64);},
   (p:ReviewPacket)=>{p.approval=true;},
  ]){const forged=wire(current);mutate(forged);assert.equal(await live.parseBodyReviewResponse(forged,id),null);}
 }
 const missing=wire(catalog);missing.structures=missing.structures.filter((s:ReviewPacket)=>s.id!==pins.entries[0].id);
 assert.throws(()=>live.regionalTourStructures(missing,tour));
 const altered=wire(catalog);altered.structures.find((s:ReviewPacket)=>s.id===pins.entries[0].id).sources[0].sha256='f'.repeat(64);
 assert.throws(()=>live.regionalTourStructures(altered,tour));
 const frame=wire(tour);frame.steps[0].frameIds[1]=pins.contextEntries[3].id;
 assert.throws(()=>live.regionalTourStructures(catalog,frame));
});
