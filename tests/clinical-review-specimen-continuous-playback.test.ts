import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve,relative,isAbsolute} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const atlas='F:/VisibleMedicine/atlas';
const baseline='787993e4497fe1de282569e3f4f611baff061206';
// Preserve the immutable playback source separately from current delivery.
const playbackCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const liveCommit=CURRENT_ATLAS_REVISION;
const paths=['lib/guided-playback.ts','lib/specimen-guided-dissection.ts',
 'lib/um-limb-guided-dissection.ts','lib/abdominal-guided-dissection.ts',
 'lib/back-guided-dissection.ts','lib/hra-renal-guided-dissection.ts',
 'lib/hra-pelvic-guided-dissection.ts','lib/specimen-review-material.ts',
 'lib/specimen-review.ts','lib/specimen-review-api.ts','app/um-knee-study.tsx',
 'app/review/specimens/workspace.tsx','content/body-renderer-revision.json'];
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const normalized=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
const visible=(code:string,value:string)=>code.includes(value)||code.includes(JSON.stringify(value).slice(1,-1));

async function boundCurrentAtlasHistory(revision:string){
  assert.equal(revision,CURRENT_ATLAS_REVISION);
  const root=currentAtlasDeliveryRoot();
  const source=(path:string)=>execFileSync('git',['show',`${revision}:${path}`],{cwd:root,windowsHide:true,maxBuffer:32e6,
    env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const manifest=json('atlas-review/manifest.json');assert.equal(manifest.revision,revision);
  const path='content/body-renderer-revision.json',originalBytes=source(path);
  const original=JSON.parse(originalBytes.toString()),importedBytes=readFileSync('atlas-review/'+path),bound=JSON.parse(importedBytes.toString());
  const file=manifest.files.find((item:{path:string})=>item.path===path);assert(file);
  assert.equal(file.sourceSha256,sha(originalBytes));assert.equal(file.importedSha256,sha(importedBytes));
  assert.equal(bound.sourceRendererSha256,original.sha256);
  assert.equal(bound.websiteIntegrationSha256,manifest.websiteIntegrationSha256);
  assert.equal(bound.sha256,sha(JSON.stringify({source:original.sha256,website:manifest.websiteIntegrationSha256})));
  const restored={...bound,sha256:original.sha256};delete restored.sourceRendererSha256;delete restored.websiteIntegrationSha256;
  assert.deepEqual(restored,original,'Only declared website renderer binding may differ');
  const integration=json('atlas-review/integration-inputs.json');
  assert.equal(integration.sourceCommit,revision);assert.equal(integration.sha256,manifest.websiteIntegrationSha256);
  assert.equal(sha(JSON.stringify(integration.inputs)),integration.sha256);
  assert.equal(new Set(integration.inputs.map((item:{path:string})=>item.path)).size,integration.inputs.length);
  for(const input of integration.inputs){
    assert(typeof input.path==='string'&&!isAbsolute(input.path));
    assert(!input.path.split('/').some((part:string)=>!part||part==='.'||part==='..'));
    const target=resolve(process.cwd(),input.path),local=relative(process.cwd(),target);
    assert(local&&!local.startsWith('..')&&!isAbsolute(local));
    assert.equal(sha(readFileSync(target)),input.sha256,input.path);
  }
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  return exactSourceHistoryApi(revision,'specimen-continuous-epoch',{[path]:importedBytes});
}


async function importedApi(){
 const built=await build({stdin:{contents:[
  "export * from './atlas-review/lib/guided-playback';",
  "export * from './atlas-review/lib/specimen-guided-dissection';",
  "export * from './atlas-review/lib/specimen-review-material';",
  "export * from './atlas-review/lib/specimen-review';",
  "export * from './atlas-review/lib/specimen-review-api';",
  "export * from './atlas-review/lib/specimen-review-client';",
  "export {limbDefinitions} from './atlas-review/lib/um-limb-studies';",
  "export {umLimbGuidedDissection} from './atlas-review/lib/um-limb-guided-dissection';",
  "export {abdominalWallDefinition} from './atlas-review/lib/abdominal-wall';",
  "export {abdominalGuidedDissection} from './atlas-review/lib/abdominal-guided-dissection';",
  "export {backLayersDefinition} from './atlas-review/lib/back-layers';",
  "export {backGuidedDissection} from './atlas-review/lib/back-guided-dissection';",
  "export {hraRenalDefinition} from './atlas-review/lib/hra-renal';",
  "export {hraRenalGuidedDissection} from './atlas-review/lib/hra-renal-guided-dissection';",
  "export {hraPelvisDefinition} from './atlas-review/lib/hra-pelvis';",
  "export {hraPelvicGuidedDissection} from './atlas-review/lib/hra-pelvic-guided-dissection';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
  platform:'node',format:'esm',metafile:true});
 for(const path of paths.filter(path=>path.startsWith('lib/')))
  assert(Object.keys(built.metafile.inputs).some(input=>input.replaceAll('\\','/').endsWith(path)),
   `Imported closure omits ${path}`);
 return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

const guides=(api:any)=>[
 ...Object.values(api.limbDefinitions).map((definition:any)=>[definition,api.umLimbGuidedDissection(definition)]),
 [api.abdominalWallDefinition,api.abdominalGuidedDissection(api.abdominalWallDefinition)],
 [api.backLayersDefinition,api.backGuidedDissection(api.backLayersDefinition)],
 [api.hraRenalDefinition,api.hraRenalGuidedDissection(api.hraRenalDefinition)],
 [api.hraPelvisDefinition,api.hraPelvicGuidedDissection(api.hraPelvisDefinition)],
] as [any,any][];

test('nine independent guides and all four emitted learners bind to the committed shared policy',
 {timeout:180000},async()=>{
 const sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:sourceRoot}).toString().trim(),liveCommit);
 assert.equal(git(['merge-base',baseline,playbackCommit]).toString().trim(),baseline);
 assert.equal(git(['merge-base',playbackCommit,liveCommit]).toString().trim(),playbackCommit);
 assert.equal(git(['rev-parse',`${playbackCommit}^{tree}`]).toString().trim(),
  '1bd327fb20a52b35bec584675c457173c548e24b');
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
 const viewer=json('public/atlas-review-viewer/manifest.json');
 assert.equal(viewer.sourceCommit,liveCommit);
 assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
 assert.equal(viewer.personalRecordsIncluded,false);
 for(const path of paths){
  const record=review.files.find((item:any)=>item.path===path);assert(record,path);
  assert.equal(record.sourceSha256,sha(committed(liveCommit,path)),path);
  assert.equal(record.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
  if(path.startsWith('lib/'))assert.equal(normalized(readFileSync('atlas-review/'+path)),
   normalized(committed(liveCommit,path)),`${path}: exact source modulo CRLF`);
 }
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const before=await exactSourceHistoryApi(baseline,'specimen-continuous-epoch');
 const playback=await exactSourceHistoryApi(playbackCommit,'specimen-continuous-epoch');
 const source=await boundCurrentAtlasHistory(liveCommit);
 const current=await importedApi();
 assert.equal(current.GUIDED_SWEEP_MS,8000);
 assert.equal(current.GUIDED_MIN_STEP_MS,24000);
 assert.equal(current.GUIDED_CAPTION_WORDS_PER_MINUTE,180);
 const oldGuides=guides(before),playbackGuides=guides(playback),liveGuides=guides(source),importedGuides=guides(current);
 assert.equal(oldGuides.length,9);assert.equal(playbackGuides.length,9);assert.equal(liveGuides.length,9);
 let stops=0;
 for(let index=0;index<9;index++){
  const [oldDefinition,oldGuide]=oldGuides[index],[definition,guide]=liveGuides[index];
  assert(oldGuide&&guide,`guide ${index}`);
  assert.deepEqual(importedGuides[index],liveGuides[index],`${guide.id}: imported exact source`);
  assert.deepEqual(liveGuides[index],playbackGuides[index],`${guide.id}: immutable playback guide held`);
  assert.deepEqual(definition,oldDefinition,`${guide.id}: source definition held`);
  const {continuousPlayback:_,...withoutPlayback}=guide;
  assert.deepEqual(withoutPlayback,oldGuide,`${guide.id}: captions, order, IDs, views and camera bounds held`);
  assert.deepEqual(guide.continuousPlayback,current.guidedPlaybackEvidence(guide.steps));
  assert.deepEqual(guide.continuousPlayback,source.guidedPlaybackEvidence(guide.steps));
  assert.equal(guide.continuousPlayback.transitionMs,8000);
  assert.equal(guide.continuousPlayback.minimumStepMs,24000);
  assert.equal(guide.continuousPlayback.captionWordsPerMinute,180);
  assert.equal(guide.continuousPlayback.start,'explicit-play-full-tour');
  assert.equal(guide.continuousPlayback.final,'hold');
  assert.equal(guide.continuousPlayback.reducedMotion,'no-camera-sweep');
  for(const [stepIndex,step] of guide.steps.entries()){
   stops++;
   const words=step.caption.trim().split(/\s+/u).filter(Boolean).length;
   assert.equal(guide.continuousPlayback.stepDurationsMs[stepIndex],
    Math.max(24000,8000+Math.ceil(words*60000/180)),`${guide.id}:${step.id} reading time`);
  }
 }
 assert.equal(stops,73);
 for(const name of ['head-neck','shoulder','lower-limb','female-pelvis']){
  const base=`public/atlas-runtime/${name}/`,manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,liveCommit,name);
  assert.equal(manifest.patientDataIncluded,false,name);
  assert.equal(manifest.clinicalApproved,false,name);
  const inputs=json(base+'source-inputs.json');
  for(const path of paths.filter(path=>path.startsWith('lib/'))){
   const input=inputs.find((item:any)=>item.path===path);
   if(input)assert.equal(input.sha256,sha(committed(liveCommit,path)),`${name}:${path}`);
  }
  assert.equal(inputs.find((item:any)=>item.path==='lib/guided-playback.ts')?.sha256,
   sha(committed(liveCommit,'lib/guided-playback.ts')),`${name}: shared policy input`);
  const host=inputs.find((item:any)=>item.path==='app/um-knee-study.tsx');
  const emitted=manifest.files.filter((item:any)=>item.path.endsWith('.js'))
   .map((item:any)=>{const bytes=readFileSync(base+item.path);
    assert.equal(sha(bytes),item.sha256,`${name}:${item.path}`);return bytes.toString();}).join('\n');
  if(host){
   assert.equal(host?.sha256,sha(committed(liveCommit,'app/um-knee-study.tsx')));
   for(const phrase of ['Play full tour','explicit-play-full-tour','no-camera-sweep'])
    assert(visible(emitted,phrase),`${name}: ${phrase}`);
   const selected=name==='head-neck'?importedGuides:
    name==='lower-limb'?importedGuides.slice(0,5):
    name==='female-pelvis'?importedGuides.filter(([definition],index)=>
     index<5||definition.key===current.hraPelvisDefinition.key):[];
   for(const [,guide] of selected)for(const step of guide.steps)
    assert(visible(emitted,step.caption),`${name}: ${step.id} caption`);
  }else assert.equal(name,'shoulder',`${name}: unexpected absent specimen host`);
 }
});

test('all 356 specimen Review rows retain source identity and reject stale or forged teaching before storage',
 {timeout:300000},async()=>{
 const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
 const before=await exactSourceHistoryApi(baseline,'specimen-continuous-epoch');
 const playback=await exactSourceHistoryApi(playbackCommit,'specimen-continuous-epoch');
 const source=await boundCurrentAtlasHistory(liveCommit);
 const current=await importedApi();
 assert.deepEqual(current.specimenReviewRows,source.specimenReviewRows);
 assert.deepEqual(source.specimenReviewRows,before.specimenReviewRows);
 assert.deepEqual(playback.specimenReviewRows,before.specimenReviewRows);
 const renderer=json('atlas-review/content/body-renderer-revision.json');
 const guideByKey=new Map(guides(source).map(([definition,guide])=>[definition.key,guide]));
 let rows=0,participating=0,unaffected=0,storageCalls=0,stale=0,forged=0,approvals=0;
 const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
 const request=(payload:any)=>new Request('https://review.test/api/atlas-review/specimen-review',{
  method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
   'oai-authenticated-user-id':'SYNTHETIC_SPECIMEN_PLAYBACK_REVIEWER'},body:JSON.stringify(payload)});
 for(const row of current.specimenReviewRows)for(const surface of row.surfaces){
  rows++;
  const label=`${row.key}/${surface.id}`;
  const old=wire(await before.specimenReviewMaterial(row.key,surface.id));
  const atPlayback=wire(await playback.specimenReviewMaterial(row.key,surface.id));
  const live=wire(await source.specimenReviewMaterial(row.key,surface.id));
  const imported=wire(await current.specimenReviewMaterial(row.key,surface.id));
  assert(old&&atPlayback&&live&&imported,label);
  assert.deepEqual(live.teaching,atPlayback.teaching,`${label}: immutable playback teaching held`);
  assert.deepEqual(imported,live,`${label}: exact imported/source packet`);
  assert.deepEqual(live.source,old.source,`${label}: source held`);
  assert.equal(live.context.sourceHash,old.context.sourceHash,`${label}: source hash held`);
  assert.deepEqual(live.atlasLink,old.atlasLink,`${label}: exact study link held`);
  assert.deepEqual(live.context.checklists.geometry,old.context.checklists.geometry,label);
  assert.deepEqual(live.context.checklists.imaging,old.context.checklists.imaging,label);
  assert.equal(live.context.rendererHash,renderer.sha256,`${label}: current renderer bound`);
  assert.notEqual(live.context.rendererHash,old.context.rendererHash,`${label}: renderer changed`);
  assert.notEqual(live.context.revisions.geometry,old.context.revisions.geometry,
   `${label}: geometry revision requires re-review`);
  assert.equal(live.context.revisions.imaging,old.context.revisions.imaging,label);
  assert.notEqual(live.context.materialHash,old.context.materialHash,
   `${label}: material revision requires re-review`);
  assert.deepEqual(live.context.blockers,old.context.blockers,`${label}: blockers held`);
  assert.deepEqual(live.context.teachingTabs,old.context.teachingTabs,`${label}: teaching tabs held`);
  const guide=guideByKey.get(row.key);
  const changed=!!guide?.steps.some((step:any)=>step.ids.includes(surface.id));
  if(!changed){
   unaffected++;
   assert.deepEqual(live.teaching,old.teaching,`${label}: unaffiliated teaching held`);
   assert.equal(live.context.teachingHash,old.context.teachingHash,label);
   assert.equal(live.context.revisions.teaching,old.context.revisions.teaching,label);
   assert.deepEqual(live.context.checklists.teaching,old.context.checklists.teaching,label);
   continue;
  }
  participating++;
  assert.deepEqual(live.teaching.guidedDissection,guide,label);
  const {continuousPlayback:_,...oldShape}=live.teaching.guidedDissection;
  assert.deepEqual(oldShape,old.teaching.guidedDissection,`${label}: guide content held`);
  const beforeTeaching=wire(old.teaching),afterTeaching=wire(live.teaching);
  delete afterTeaching.guidedDissection.continuousPlayback;
  assert.deepEqual(afterTeaching,beforeTeaching,`${label}: only descriptor changes teaching`);
  const oldChecklist=wire(old.context.checklists.teaching);
  const liveChecklist=wire(live.context.checklists.teaching);
  const oldGuideCheck=oldChecklist.find((item:any)=>item.id==='guided-dissection');
  const liveGuideCheck=liveChecklist.find((item:any)=>item.id==='guided-dissection');
  assert(oldGuideCheck&&liveGuideCheck,label);
  assert.notEqual(liveGuideCheck.label,oldGuideCheck.label,label);
  assert.match(liveGuideCheck.label,/continuous playback timing/i,label);
  assert.deepEqual(liveChecklist.filter((item:any)=>item.id!=='guided-dissection'),
   oldChecklist.filter((item:any)=>item.id!=='guided-dissection'),
   `${label}: unrelated teaching checklist held`);
  assert.notEqual(live.context.teachingHash,old.context.teachingHash,label);
  assert.notEqual(live.context.revisions.teaching,old.context.revisions.teaching,label);
  const context=live.context;
  const payload={catalogScope:context.catalogScope,specimenKey:row.key,structureId:surface.id,
   sourceFrame:context.sourceFrame,materialHash:context.materialHash,
   revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   track:'teaching',expectedVersion:0,draft:current.blankSpecimenReview(context,'teaching')};
  const prior={...payload,materialHash:old.context.materialHash,
   revisionHash:old.context.revisions.teaching};
  assert.equal((await current.postSpecimenReview(request(prior),storage)).status,409,label);stale++;
  const bad=wire(payload);bad.draft.checks.foreign=true;
  assert.equal((await current.postSpecimenReview(request(bad),storage)).status,422,label);forged++;
  const approval=wire(payload);approval.draft.status='approved';
  assert.equal((await current.postSpecimenReview(request(approval),storage)).status,422,label);approvals++;
 }
 assert.equal(rows,356);
 assert(participating>0&&unaffected>0);
 assert.equal(participating+unaffected,rows);
 assert.deepEqual({stale,forged,approvals,storageCalls},
  {stale:participating,forged:participating,approvals:participating,storageCalls:0});
});
