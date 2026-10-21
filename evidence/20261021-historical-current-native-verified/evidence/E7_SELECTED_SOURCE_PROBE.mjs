// Local, selected-ID source-replay diagnostic only; no files or storage are written.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
const atlas='F:/VisibleMedicine/staging/20261021-atlas-combined-source';
const website='F:/VisibleMedicine/staging/20261021-source190-website/website';
const current='190a63238eadcf906abe89dcbb6a67c88afe70b9';
const neonatal='2dba5dc346748e9ce94a5dab7308689deb6dfc95';
const apex='a70b6f640c5511330f250882f525b63a4a21117b';
process.chdir(website);
process.env.VM_ATLAS_SOURCE_REPO=atlas;
const git=(...args)=>execFileSync('git',args,{cwd:atlas,windowsHide:true,maxBuffer:32e6,
 env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}).toString().trim();
assert.equal(git('rev-parse','HEAD'),current);
const {boundLiveAtlasHistory}=await import(pathToFileURL(website+'/tests/atlas-bound-live-history.mjs').href);
const {exactSourceHistoryApi}=await import(pathToFileURL(atlas+'/scripts/exact-source-history-api.mjs').href);
const now=await boundLiveAtlasHistory(current);
const beforeNeonatal=await exactSourceHistoryApi(neonatal,'review-security');
const beforeApex=await exactSourceHistoryApi(apex,'review-security');
const neonatalPins=JSON.parse(git('show',current+':content/neonatal-cranial-ultrasound-pins.json'));
const apexPins=JSON.parse(git('show',current+':content/orbital-nerve-mri-pins.json'));
const idsNeonatal=neonatalPins.entries.map(row=>row.identity.id);
const idsApex=apexPins.entries.filter(row=>row.identity.category==='nerve').map(row=>row.identity.id);
assert.equal(idsNeonatal.length,10);assert.equal(idsApex.length,12);
const wire=value=>JSON.parse(JSON.stringify(value));
const rows=[];
for(const [family,ids,before] of [['neonatal',idsNeonatal,beforeNeonatal],['apex',idsApex,beforeApex]])
 for(const id of ids){
  const old=wire(await before.bodyReviewMaterial(id)),live=wire(await now.bodyReviewMaterial(id));
  const oldContext=await before.bodyReviewContext(id),liveContext=await now.bodyReviewContext(id);
  assert(old&&live&&oldContext&&liveContext,id);
  const oldTours=new Map(old.guidedTours.map(row=>[row.tour.id,row]));
  const liveTours=new Map(live.guidedTours.map(row=>[row.tour.id,row]));
  const added=[...liveTours.keys()].filter(key=>!oldTours.has(key));
  const missing=[...oldTours.keys()].filter(key=>!liveTours.has(key));
  const common=[...oldTours.keys()].filter(key=>liveTours.has(key));
  const playback=common.filter(key=>Object.hasOwn(liveTours.get(key),'continuousPlayback')&&!Object.hasOwn(oldTours.get(key),'continuousPlayback'));
  const changedBeyondPlayback=common.filter(key=>{
   const {continuousPlayback,...projection}=liveTours.get(key);
   return !isDeepStrictEqual(projection,oldTours.get(key));
  });
  rows.push({family,id,oldTours:[...oldTours.keys()],liveTours:[...liveTours.keys()],added,missing,
   playback,changedBeyondPlayback,
   topicsChanged:!isDeepStrictEqual(old.topics,live.topics),
   reasoningChanged:!isDeepStrictEqual(old.reasoning,live.reasoning),
   sourceChanged:!isDeepStrictEqual(old.source,live.source),
   checklistChanged:!isDeepStrictEqual(old.checklist,live.checklist),
   teachingHashSame:oldContext.teachingHash===liveContext.teachingHash,
   materialHashSame:oldContext.materialHash===liveContext.materialHash,
   revisionSame:oldContext.revisions.teaching===liveContext.revisions.teaching,
   sourceHashSame:oldContext.sourceHash===liveContext.sourceHash,
   checklistVersionSame:oldContext.checklistVersion===liveContext.checklistVersion});
 }
const blobs={};
for(const commit of [neonatal,apex,current])blobs[commit]={
 renderer:git('rev-parse',commit+':content/body-renderer-revision.json'),
 tours:git('rev-parse',commit+':lib/regional-tours.ts'),
 material:git('rev-parse',commit+':lib/body-review-material.ts'),
};
process.stdout.write(JSON.stringify({schema:'e7-selected-source-replay-v1',source:current,neonatal,apex,
 websiteHead:execFileSync('git',['rev-parse','HEAD'],{cwd:website,windowsHide:true}).toString().trim(),
 blobs,counts:{neonatal:idsNeonatal.length,apex:idsApex.length},rows}));
