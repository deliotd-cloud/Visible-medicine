import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {assertHistoricalRenalTourEpoch,assertLatestTourDelivery,assertCurrentGuidedReviewAdditions} from './tour-playback-source-role.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';
import {assertCurrentTourDelivery,assertCompleteGuidedReview} from './adjacent-current-tour-source-role.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve,relative,isAbsolute} from 'node:path';
import test from 'node:test';
import {build} from 'esbuild';

const atlas=currentAtlasDeliveryRoot();
const baseline='840fcbf73e29a9c146a84ca8c232ca5c762c1672';
// Keep the immutable introduction and playback epochs separate from current delivery.
const completedEpoch='c978ecee3bdddfeaf2995ecbf62d5178e719c4fb';
const playbackCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const reviewedRenalEpoch='2381efe43b75f8a7fb768a069eecd7268c508dac';
const reviewedCurrentCommit='b79e110d2d28f18993263926ba35aa7a3f478b20';
const liveCommit=CURRENT_ATLAS_REVISION;
const deliveryPin=validateCurrentAtlasDelivery();
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
const pinsPath='content/posterior-calf-tour-pins.json';
const sourcePaths=['lib/guided-playback.ts','lib/regional-tours.ts','lib/posterior-calf-tour.ts',
  'lib/shoulder-tours.ts','app/regional-guided-learning.tsx','app/shoulder-explorer.tsx',
  'app/shoulder-tour-player.tsx',
  'app/review/body/review-dashboard.tsx','app/review/review-dashboard.tsx'];
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
const git=(args:string[])=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:64e6,
  env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const committed=(revision:string,path:string)=>git(['show',`${revision}:${path}`]);
const norm=(bytes:Uint8Array)=>Buffer.from(bytes).toString('utf8').replaceAll('\r\n','\n');
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
  return exactSourceHistoryApi(revision,'regional-tour-review',{[path]:importedBytes});
}

async function importedApi(){
  const built=await build({stdin:{contents:[
    "export * from './atlas-review/lib/guided-playback';",
    "export * from './atlas-review/lib/regional-tours';",
    "export {shoulderTour} from './atlas-review/lib/shoulder-tours';",
    "export {bodyLesson} from './atlas-review/app/body-content';",
    "export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",
    "export {contentTabs} from './atlas-review/lib/content-types';",
    "export * from './atlas-review/lib/body-review-material';",
    "export * from './atlas-review/lib/body-review-context';",
    "export * from './atlas-review/lib/body-review-response';",
    "export * from './atlas-review/lib/body-review-api';",
    "export * from './atlas-review/lib/body-review-decisions';",
  ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,
    platform:'node',format:'esm',metafile:true});
  for(const path of ['lib/guided-playback.ts','lib/regional-tours.ts','lib/posterior-calf-tour.ts',
    'lib/shoulder-tours.ts','lib/body-review-material.ts'])
    assert(Object.keys(built.metafile.inputs).some(input=>input.replaceAll('\\','/').endsWith(path)),
      `Actual imported closure omits ${path}`);
  return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
}

test('current imports and emitted learners bind the continuous guide to the exact source',
  {timeout:180000},async()=>{
  assert.equal(git(['merge-base',reviewedCurrentCommit,liveCommit]).toString().trim(),reviewedCurrentCommit,
    'Reviewed parser source remains an exact ancestor of current delivery');
  assert.equal(git(['rev-parse',`${reviewedCurrentCommit}^{tree}`]).toString().trim(),
    '0dd97cc55ef9aff3493b91752309d1d661c0b0c8','Authenticated reviewed parser tree');
  const sourceRoot=currentAtlasDeliveryRoot();
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:sourceRoot}).toString().trim(),liveCommit);
  assert.equal(git(['merge-base',baseline,completedEpoch]).toString().trim(),baseline);
  assert.equal(git(['merge-base',completedEpoch,playbackCommit]).toString().trim(),completedEpoch);
  assert.equal(git(['merge-base',playbackCommit,liveCommit]).toString().trim(),playbackCommit);
  assert.equal(git(['rev-parse',`${completedEpoch}^{tree}`]).toString().trim(),
    '5b468123c407a2ffc8eeacd88a42b9a56ef7f688');
  assert.equal(git(['rev-parse',`${playbackCommit}^{tree}`]).toString().trim(),
    '1bd327fb20a52b35bec584675c457173c548e24b');
  assert.deepEqual(committed(liveCommit,catalogPath),committed(baseline,catalogPath));
  assert.deepEqual(committed(liveCommit,pinsPath),committed(completedEpoch,pinsPath));
  const review=json('atlas-review/manifest.json');assert.equal(review.revision,liveCommit);
  assert.equal(liveCommit,deliveryPin.source,'Review remains bound to current Atlas source');
  const viewer=json('public/atlas-review-viewer/manifest.json');
  assert.equal(viewer.sourceCommit,liveCommit);
  assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
  assert.equal(viewer.personalRecordsIncluded,false);
  for(const path of sourcePaths){
    const source=committed(liveCommit,path),imported=readFileSync('atlas-review/'+path);
    const record=review.files.find((file:{path:string})=>file.path===path);assert(record,path);
    assert.equal(record.sourceSha256,sha(source),path);
    assert.equal(record.importedSha256,sha(imported),path);
    if(path.startsWith('lib/'))assert.equal(norm(imported),norm(source),
      `${path}: exact imported source`);
  }
  const learners=['head-neck','shoulder','lower-limb','female-pelvis'].map(name=>({
    name,base:`public/atlas-runtime/${name}/`,manifest:json(`public/atlas-runtime/${name}/manifest.json`),
  }));
  for(const {name,base,manifest} of learners){
    assert.equal(manifest.sourceCommit,deliveryPin.runtimeSources[name],name);
    assert.equal(manifest.patientDataIncluded,false,name);
    assert.equal(manifest.clinicalApproved,false,name);
    const inputs=json(base+'source-inputs.json');
    const playback=inputs.find((item:{path:string})=>item.path==='lib/guided-playback.ts');
    assert.equal(playback?.sha256,sha(committed(deliveryPin.runtimeSources[name],'lib/guided-playback.ts')),
      `${name}: shared playback input`);
    const regional=inputs.find((item:{path:string})=>item.path==='lib/regional-tours.ts');
    if(name==='head-neck')assert.equal(regional?.sha256,
      sha(committed(liveCommit,'lib/regional-tours.ts')),`${name}: root tour input`);
    else assert.equal(regional,undefined,`${name}: regional registry outside closure`);
  }
  const imported=await importedApi();
  assert.equal(imported.GUIDED_SWEEP_MS,8000);
  assert.equal(imported.GUIDED_MIN_STEP_MS,24000);
  assert.equal(imported.GUIDED_CAPTION_WORDS_PER_MINUTE,180);
  assert.equal(imported.guidedPlaybackDuration('one two',12000),24000);
  assert.equal(imported.guidedPlaybackDuration('word '.repeat(100),12000),
    8000+Math.ceil(100*60000/180));
  const source=await boundCurrentAtlasHistory(liveCommit);
  assert.deepEqual(imported.regionalTours,source.regionalTours);
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const renal=await exactSourceHistoryApi(reviewedRenalEpoch,'regional-tour-review');
  const reviewed=await exactSourceHistoryApi(reviewedCurrentCommit,'regional-tour-review');
  assertLatestTourDelivery(renal.regionalTours,reviewed.regionalTours,
    {atlasRoot:atlas,sourceCommit:'5e75b9ce7e46fed291748108edd7565c97dee101'});
  assert.deepEqual(imported.regionalTours.slice(0,reviewed.regionalTours.length),reviewed.regionalTours,
    'All 53 historically reviewed tours remain exact and ordered');
  assert.equal(imported.regionalTours.length,55,'Current source admits the two later authored tours');
  assert.deepEqual(imported.regionalTours.slice(53).map((tour:any)=>tour.id),
    ['coccygeus-pelvic-landmarks','right-knee-quadriceps-to-tibia'],
    'Both later tour identities remain exact and ordered');
  const pins=json('atlas-review/'+pinsPath),calf=imported.posteriorCalfTour;
  assert.deepEqual(calf,source.regionalTours.find((tour:any)=>tour.id===calf.id));
  assert.equal(calf.id,'right-posterior-calf-achilles-orientation');
  assert.equal(calf.revision,pins.tourRevision);
  assert.deepEqual(calf.scopeRegions,['leg','foot']);
  assert.deepEqual(calf.steps.map((step:any)=>step.selectedId),pins.entries.map((entry:any)=>entry.id));
  assert.deepEqual(calf.contextIds,pins.contextEntries.map((entry:any)=>entry.id));
  assert.equal(calf.steps.length,5);assert.equal(calf.contextIds.length,2);
  for(const entry of [...pins.entries,...pins.contextEntries]){
    assert.equal(entry.validation.anatomicalReview,false);
    assert.equal(entry.validation.status,'unvalidated');
  }
  assert.deepEqual(imported.shoulderTour.continuousPlayback,
    imported.guidedPlaybackEvidence(imported.shoulderTour.steps));
  assert.equal(imported.shoulderTour.steps.length,5);
  const head=learners.find(item=>item.name==='head-neck')!,shoulder=learners.find(item=>item.name==='shoulder')!;
  const headCode=emittedTeaching(head.base,head.manifest.files,true);
  const shoulderCode=emittedTeaching(shoulder.base,shoulder.manifest.files,true);
  for(const code of [headCode,shoulderCode]){
    assert(visible(code,'Play full tour'),'Explicit learner control must reach emitted JavaScript');
    assert(visible(code,'no-camera-sweep'),'Reduced-motion policy must reach emitted JavaScript');
    assert(visible(code,'explicit-play-full-tour'),'Shared policy must reach emitted JavaScript');
  }
  for(const step of calf.steps)assert(visible(headCode,step.caption),`${step.id}: emitted caption`);
  for(const step of imported.shoulderTour.steps)
    assert(visible(shoulderCode,step.caption),`${step.id}: emitted shoulder caption`);
  const regionalPlayer=norm(committed(liveCommit,'app/regional-guided-learning.tsx'));
  const shoulderPlayer=norm(committed(liveCommit,'app/shoulder-explorer.tsx'));
  const shoulderControls=norm(committed(liveCommit,'app/shoulder-tour-player.tsx'));
  const bodyReview=norm(committed(liveCommit,'app/review/body/review-dashboard.tsx'));
  const shoulderReview=norm(committed(liveCommit,'app/review/review-dashboard.tsx'));
  const originalRegionalPlayer=norm(committed(completedEpoch,'app/regional-guided-learning.tsx'));
  const originalShoulderPlayer=norm(committed(completedEpoch,'app/shoulder-explorer.tsx'));
  assert.match(originalRegionalPlayer,/guidedPlaybackDuration\(step\.caption,step\.durationMs\)/);
  assert.match(originalRegionalPlayer,/continuous\?GUIDED_SWEEP_MS:1800/);
  assert.match(regionalPlayer,/guidedPlaybackDuration\(step\.caption,step\.durationMs,playbackRate\)/);
  assert.match(regionalPlayer,/continuous\?guidedSweepDuration\(playbackRate\):1800/);
  assert.match(regionalPlayer,/Play full tour/);
  assert.match(originalShoulderPlayer,/shoulderTour\.continuousPlayback\.stepDurationsMs\[tourIndex\]/);
  assert.match(originalShoulderPlayer,/tourContinuous\s*\?\s*GUIDED_SWEEP_MS\s*:\s*1800/);
  assert.match(shoulderPlayer,/guidedPlaybackDuration\(shoulderTour\.steps\[tourIndex\]\.caption, shoulderTour\.steps\[tourIndex\]\.durationMs, tourRate\)/);
  assert.match(shoulderPlayer,/tourContinuous\s*\?\s*guidedSweepDuration\(tourRate\)\s*:\s*1800/);
  assert.match(shoulderControls,/onPlayFullTour}>Play full tour/);
  assert.match(bodyReview,/evidence\.continuousPlayback\.stepDurationsMs\[index\]/);
  assert.match(shoulderReview,/shoulderTour\.continuousPlayback\.stepDurationsMs\[index\]/);
});

test('314 revised Review packets, unchanged teaching and source, and pre-storage refusal',
  {timeout:300000},async()=>{
  assert.equal(git(['merge-base',reviewedCurrentCommit,liveCommit]).toString().trim(),reviewedCurrentCommit,
    'Reviewed parser source remains an exact ancestor of current delivery');
  const current=await importedApi(),live=await boundCurrentAtlasHistory(liveCommit);
  const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
  const old=await exactSourceHistoryApi(baseline,'regional-tour-review');
  const epoch=await exactSourceHistoryApi(completedEpoch,'regional-tour-review');
  const playback=await exactSourceHistoryApi(playbackCommit,'regional-tour-review');
  const renal=await exactSourceHistoryApi(reviewedRenalEpoch,'regional-tour-review');
  const reviewed=await exactSourceHistoryApi(reviewedCurrentCommit,'regional-tour-review');
  const carpalRevision='5f278c3d0c26c5a0899b54f2cfa2a0accb02ecf7';
  const carpal=await exactSourceHistoryApi(carpalRevision,'regional-tour-review');
  const reasoningRevision='b79e110d2d28f18993263926ba35aa7a3f478b20';
  assert.deepEqual(committed('5e75b9ce7e46fed291748108edd7565c97dee101','lib/reasoning-questions.ts'),
    committed('aa13c067197cad87bd0a9b2da5549bc4b33bfdf7','lib/reasoning-questions.ts'),
    'The original lower-limb reasoning theorem stays at its genuine5e75/aa13 source');
  const reasoning=await exactSourceHistoryApi(reasoningRevision,'regional-tour-review');
  assert.deepEqual(committed(liveCommit,'lib/reasoning-questions.ts'),committed(reasoningRevision,'lib/reasoning-questions.ts'),
    'Current reasoning equals the separately authenticated b79 source');
  for(const path of ['lib/body-reasoning-review.ts','lib/carpal-relationships-reasoning.ts','content/carpal-relationships-reasoning-pins.json'])
    assert.deepEqual(committed(liveCommit,path),committed(carpalRevision,path),'Current reasoning equals the exact reviewed carpal source: '+path);
  const catalog=current.bodyDisplayCatalog(json('atlas-review/'+catalogPath));
  assert.equal(catalog.structures.length,1104);
  assert.deepEqual(catalog,live.bodyDisplayCatalog(json('atlas-review/'+catalogPath)));
  assert.deepEqual(catalog,old.catalog);
  for(const earlier of [old.regionalTours,epoch.regionalTours])
    assertHistoricalRenalTourEpoch(earlier,renal.regionalTours,{atlasRoot:atlas,helperSource:new URL('./renal-tour-epoch-admission.mjs',import.meta.url)});
  assertLatestTourDelivery(renal.regionalTours,reviewed.regionalTours,
    {atlasRoot:atlas,sourceCommit:'5e75b9ce7e46fed291748108edd7565c97dee101'});
  assert.deepEqual(current.regionalTours.slice(0,reviewed.regionalTours.length),reviewed.regionalTours,
    'Reviewed 53-tour bank remains the exact current prefix');
  assert.equal(current.regionalTours.length,55,'Current Review carries both later source-bound tours');
  assert.deepEqual(playback.regionalTours,epoch.regionalTours);
  assert.equal(current.contentTabs.length,9);
  let packets=0,changed=0,unchanged=0,topics=0,placements=0,mutated=0,stale=0,storageCalls=0;
  const storage={prepare(){storageCalls++;throw Error('Rejected request reached synthetic storage');}};
  const request=(value:any)=>new Request('https://review.test/api/body-decisions',{
    method:'POST',headers:{origin:'https://review.test','content-type':'application/json',
      'oai-authenticated-user-id':'SYNTHETIC_CONTINUOUS_GUIDE_REVIEWER'},body:JSON.stringify(value),
  });
  const representatives:string[]=[];
  for(const structure of catalog.structures){
    for(const tab of current.contentTabs){
      const lesson=current.bodyLesson(structure,tab);
      assert.deepEqual(lesson,live.bodyLesson(structure,tab),
        `${structure.id}:${tab}: imported versus exact source lesson`);
      // The original playback release changed no lessons; later teaching is
      // checked against the exact live source above, not frozen to this epoch.
      assert.deepEqual(epoch.bodyLesson(structure,tab),old.bodyLesson(structure,tab),
        `${structure.id}:${tab}: unchanged lesson at playback introduction`);
      placements++;
    }
    const before=wire(await old.bodyReviewMaterial(structure.id));
    const atEpoch=wire(await epoch.bodyReviewMaterial(structure.id));
    const atPlayback=wire(await playback.bodyReviewMaterial(structure.id));
    const atRenal=wire(await renal.bodyReviewMaterial(structure.id));
    const atReviewed=wire(await reviewed.bodyReviewMaterial(structure.id));
    const after=wire(await live.bodyReviewMaterial(structure.id));
    const imported=wire(await current.bodyReviewMaterial(structure.id));
    assert(before&&atEpoch&&atPlayback&&atRenal&&atReviewed&&after&&imported,structure.id);packets++;
    assert.deepEqual(imported,after,`${structure.id}: imported versus exact source Review`);
    assert.equal(after.approval,false);assert.equal(after.status,'worksheet-not-submitted');
    assert.deepEqual(atEpoch.source,before.source);assert.deepEqual(atEpoch.topics,before.topics);
    assert.deepEqual(atEpoch.reasoning,before.reasoning);
    assert.deepEqual(atPlayback.source,atEpoch.source);
    assert.deepEqual(atPlayback.reasoning,atEpoch.reasoning);
    assert.deepEqual(atPlayback.guidedTours,atEpoch.guidedTours,
      `${structure.id}: immutable playback-era guide evidence`);
    assert.deepEqual(after.source,before.source);
    assert.deepEqual(atPlayback.reasoning,before.reasoning,'Original playback changed no reasoning');
    assert.deepEqual(after.reasoning,wire(await reasoning.bodyReviewMaterial(structure.id)).reasoning,'Current reasoning equals the exact later source worksheet');
    const expectedRenalGuides=atEpoch.guidedTours.map((evidence:any)=>{
      if(evidence.tour.id!=='renal-organs-arteries-orientation')return evidence;
      assert.equal(evidence.tour.revision,'renal-organs-arteries-orientation-v1');
      return {...evidence,tour:{...evidence.tour,revision:'renal-organs-arteries-orientation-20261022-source-bound-draft'}};
    });
    assert.deepEqual(atRenal.guidedTours,expectedRenalGuides,
      `${structure.id}: only the recorded renal tour revision differs from the playback epoch`);
    assertCurrentGuidedReviewAdditions(atRenal.guidedTours,atReviewed.guidedTours,reviewed.regionalTours);
    assertCompleteGuidedReview(structure.id,atRenal.guidedTours,atReviewed.guidedTours,reviewed.regionalTours);
    assert.deepEqual(after.guidedTours.slice(0,atReviewed.guidedTours.length),atReviewed.guidedTours,
      `${structure.id}: reviewed guide packets remain the exact current prefix`);
    const expectedCurrentTours=current.regionalTours.filter((tour:any)=>
      [...tour.contextIds,...tour.steps.map((step:any)=>step.selectedId)].includes(structure.id));
    assert.deepEqual(after.guidedTours.map((evidence:any)=>evidence.tour),expectedCurrentTours,
      `${structure.id}: all and only current authored tours reach Review in source order`);
    topics+=atEpoch.topics.length;
    for(const evidence of after.guidedTours){
      assert.deepEqual(evidence.continuousPlayback,
        current.guidedPlaybackEvidence(evidence.tour.steps));
      assert.equal(evidence.transitionMs,1800);assert.equal(evidence.separation,0);
    }
    if(!atEpoch.guidedTours.length){assert.deepEqual(atEpoch,before);unchanged++;continue;}
    changed++;
    assert.deepEqual(atEpoch.guidedTours.map(({continuousPlayback,...rest}:any)=>rest),before.guidedTours);
    assert.notEqual(atEpoch.fingerprints.teaching,before.fingerprints.teaching);
    assert.notEqual(atEpoch.materialHash,before.materialHash);
    assert.equal(atEpoch.fingerprints.source,before.fingerprints.source);
    assert.deepEqual(await current.parseBodyReviewResponse(after,structure.id),after);
    assert.equal(await current.parseBodyReviewResponse(before,structure.id),null);
    if(representatives.length<3)representatives.push(structure.id);
    const evidence=after.guidedTours[0];
    for(const mutate of [
      (bad:any)=>{delete bad.continuousPlayback;},
      (bad:any)=>{bad.continuousPlayback.transitionMs=1;},
      (bad:any)=>{bad.continuousPlayback.stepDurationsMs[0]=1;},
      (bad:any)=>{bad.continuousPlayback.final='loop';},
    ]){
      const forged=wire(after);mutate(forged.guidedTours.find((item:any)=>item.tour.id===evidence.tour.id));
      assert.equal(await current.parseBodyReviewResponse(forged,structure.id),null);
      mutated++;
    }
    const previous=await old.bodyReviewContext(structure.id);
    const context=await current.bodyReviewContext(structure.id);
    const draft={catalogScope:context.catalogScope,structureId:structure.id,track:'teaching',
      expectedVersion:0,materialHash:previous.materialHash,
      revisionHash:previous.revisions.teaching,checklistVersion:context.checklistVersion,
      draft:current.blankBodyReview(context,'teaching')};
    assert.equal((await current.postBodyDecision(request(draft),storage)).status,409);
    stale++;
  }
  assert.deepEqual({packets,changed,unchanged,topics,placements,mutated,stale,storageCalls},
    {packets:1104,changed:314,unchanged:790,topics:9936,placements:9936,
      mutated:1256,stale:314,storageCalls:0});
  assert.equal(representatives.length,3);
  for(const id of representatives){
    const context=await current.bodyReviewContext(id);
    const decision={catalogScope:context.catalogScope,structureId:id,track:'teaching',
      expectedVersion:0,materialHash:context.materialHash,revisionHash:context.revisions.teaching,
      checklistVersion:context.checklistVersion,draft:current.blankBodyReview(context,'teaching')};
    const forged=wire(decision);forged.draft.checks.foreign=true;
    assert.equal((await current.postBodyDecision(request(forged),storage)).status,422);
    const approval=wire(decision);approval.draft.status='approved';
    assert.equal((await current.postBodyDecision(request(approval),storage)).status,422);
  }
  assert.equal(storageCalls,0);
});
