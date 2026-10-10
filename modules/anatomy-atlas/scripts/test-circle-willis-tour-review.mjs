import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,relative} from 'node:path';
import {build} from './hepatobiliary-tour-history.mjs';
import {assertRecordedGuidedCameraTransition,assertRecordedTourPackageTransition} from './recorded-camera-transition.mjs';
const base='a1f7f82d524f5c40e53151a2d4e36f29d8e85d0f';
const old=path=>execFileSync('git',['show',base+':'+path],{maxBuffer:16e6});
const entry=`export * from './lib/regional-tours';export * from './lib/body-review-material';
export * from './lib/body-review-response';export * from './lib/body-review-context';
export * from './lib/body-review-decisions';export * from './lib/body-review-api';
import raw from './public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`;
async function load(previous=false){
 const replay=new Set(['lib/regional-tours.ts','content/body-review-display-pins.json','content/body-renderer-revision.json']);
 const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
  plugins:previous?[{name:'pre-circle-willis-tour',setup(api){api.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!replay.has(path))return;
   return {contents:old(path).toString('utf8'),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const api=await load(),before=await load(true),tour=api.circleWillisTour;
const ids=tour.steps.map(s=>s.selectedId),targets=new Set(ids);
assert.equal(targets.size,10);assert.equal(api.regionalTours.length,25);
assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),146);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert(api.regionalToursFor('head-neck').includes(tour));
assert.equal(api.regionalToursFor('head-neck').length,5);
assert.deepEqual(readFileSync('public/models/bodyparts3d/full-body/catalog.json'),old('public/models/bodyparts3d/full-body/catalog.json'));
assert.deepEqual(readFileSync('lib/body-display-catalog.ts'),old('lib/body-display-catalog.ts'));
// This milestone's ten tour-only pin changes are frozen at its exact saved
// epoch; later teaching transitions have independent full-current proofs.
const pinsPath='content/body-review-display-pins.json',priorPins=JSON.parse(old(pinsPath)),pins=JSON.parse(execFileSync('git',['show','acd99b11e279a0525f1488456c0a8adf2abb2cf7:'+pinsPath],{maxBuffer:16e6}));
assert.deepEqual({...pins,pins:[]},{...priorPins,pins:[]});
const priorById=new Map(priorPins.pins.map(p=>[p.structureId,p.sha256]));
assert.deepEqual(pins.pins.map(p=>p.structureId),priorPins.pins.map(p=>p.structureId));
assert.deepEqual(pins.pins.filter(p=>p.sha256!==priorById.get(p.structureId)).map(p=>p.structureId).sort(),ids.toSorted());
let preserved=0,unchangedTopics=0,packets=0,rejected=0,stale=0;
const storage={prepare(){throw Error('Stale synthetic review reached storage');}};
for(const s of api.catalog.structures){
 const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
 assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);
 unchangedTopics+=now.topics.length;assert.equal(now.approval,false);
 assert.deepEqual(now.guidedTours.filter(e=>e.tour.id!==tour.id),prior.guidedTours);preserved++;
 assert.equal(now.guidedTours.length,prior.guidedTours.length+(targets.has(s.id)?1:0));
 const current=await api.bodyReviewContext(s.id),previous=await before.bodyReviewContext(s.id);
 assert.equal(current.sourceHash,previous.sourceHash);assert.deepEqual(current.blockers,previous.blockers);
 assert.equal(current.revisions.imaging,null);
 if(targets.has(s.id))assert.notEqual(current.revisions.teaching,previous.revisions.teaching);
 else assert.equal(current.revisions.teaching,previous.revisions.teaching);
 assert.notEqual(current.revisions.geometry,previous.revisions.geometry,'Renderer changes require geometry re-review');
 const payload={catalogScope:current.catalogScope,structureId:s.id,track:'geometry',expectedVersion:0,
  materialHash:current.materialHash,revisionHash:previous.revisions.geometry,checklistVersion:current.checklistVersion,draft:api.blankBodyReview(current,'geometry')};
 const response=await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',
  headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CIRCLE_WILLIS_TEST'},body:JSON.stringify(payload)}),storage);
 assert.equal(response.status,409);stale++;
 if(!targets.has(s.id))continue;
 assert(await api.parseBodyReviewResponse(now,s.id));packets++;
 const index=now.guidedTours.findIndex(e=>e.tour.id===tour.id),e=now.guidedTours[index];
 assert.deepEqual(e.tour,tour);assert.equal(e.transition,'quintic-orbit');assert.equal(e.transitionMs,1800);assert.equal(e.separation,0);
 assert.equal(e.stepFrames.length,10);
 for(const mutate of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[index])),
  p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.steps[0].caption+=' foreign',
  p=>p.guidedTours[index].tour.revision+='-foreign',p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
  p=>p.guidedTours[index].stepFrames[0].min[0]-=1,p=>p.guidedTours[index].transition='linear',p=>p.guidedTours[index].separation=1]){
  const foreign=structuredClone(now);mutate(foreign);assert.equal(await api.parseBodyReviewResponse(foreign,s.id),null);rejected++;
 }
 payload.track='teaching';payload.draft=api.blankBodyReview(current,'teaching');payload.revisionHash=previous.revisions.teaching;
 const teaching=await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',
  headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_CIRCLE_WILLIS_TEST'},body:JSON.stringify(payload)}),storage);
 assert.equal(teaching.status,409);stale++;
}
assert.equal(preserved,1104);assert.equal(unchangedTopics,9936);assert.equal(packets,10);
for(const path of ['app/regional-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx','lib/body-review-api.ts',
 'lib/body-review-response.ts','lib/body-review-material.ts','lib/body-review-context.ts','content/learning-resources.v1.json',
 'app/anatomy-data.ts','app/dissection-data.ts','package.json','package-lock.json']){
 if(path==='app/fitted-camera.tsx')assertRecordedGuidedCameraTransition(base,readFileSync(path));
 else if(path==='package.json')assertRecordedTourPackageTransition(base,readFileSync(path));
 else assert.deepEqual(readFileSync(path),old(path),path+' preserved');
}
console.log(JSON.stringify({tour:tour.id,stops:10,priorTours:24,regionalTours:25,regionalStops:146,
 preservedSourceSelections:preserved,unchangedTopics,reviewPackets:packets,rejectedPackets:rejected,
 staleRejectedBeforeStorage:stale,clinicalApproval:false,patientRegistration:false}));
