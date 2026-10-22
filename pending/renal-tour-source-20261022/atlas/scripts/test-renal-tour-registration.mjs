import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline='389bd0ca846a42c7f21055f55904bcf5df81a09f';
async function load(previous=false){
 const plugins=previous?[{name:'exact-pre-renal-source-binding',setup(b){
  b.onLoad({filter:/[\\/]lib[\\/](?:renal-tour|regional-tours)\.ts$/,namespace:'workspace-test'},args=>{
   const p=relative(process.cwd(),args.path).replaceAll('\\','/');
   assert(['lib/renal-tour.ts','lib/regional-tours.ts'].includes(p));
   return {contents:execFileSync('git',['show',baseline+':'+p],{encoding:'utf8',maxBuffer:8e6,windowsHide:true}),loader:'ts',resolveDir:dirname(args.path)};
  });
 }}]:[];
 const r=await build({stdin:{contents:"export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
 return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const now=await load(),old=await load(true),tour=now.renalTour;
assert.deepEqual(now.catalog,old.catalog,'No displayed anatomy, model or source metadata changes.');
assert.equal(now.regionalTours.length,old.regionalTours.length);
assert.equal(now.regionalTours.reduce((n,t)=>n+t.steps.length,0),old.regionalTours.reduce((n,t)=>n+t.steps.length,0));
assert.deepEqual(now.regionalTours.map(t=>t.id),old.regionalTours.map(t=>t.id));
assert.deepEqual(now.regionalTours.filter(t=>t.id!==tour.id),old.regionalTours.filter(t=>t.id!==tour.id));
assert.deepEqual({...tour,revision:old.renalTour.revision},old.renalTour);
for(const region of now.catalog.regions)assert.equal(now.regionalTourFor(region.id)?.id,old.regionalTourFor(region.id)?.id);
const selected=now.regionalTourStructures(now.catalog,tour),affected=new Set(selected.map(s=>s.id));
assert.equal(affected.size,5);assert.deepEqual(selected,old.regionalTourStructures(old.catalog,old.renalTour));
assert.deepEqual(now.regionalTourStepFrames(now.catalog,tour),old.regionalTourStepFrames(old.catalog,old.renalTour));
let newlyRefused=0,packetRefusals=0;
for(const s of selected){
 for(const patch of [{fmaId:'FMA-unrelated'},{bounds:{min:[0,0,0],max:[1,1,1]}},{sources:[{...s.sources[0],sha256:'0'.repeat(64)}]}]){
  const catalog={...now.catalog,structures:now.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)};
  assert.equal(old.regionalTourStructures(catalog,old.renalTour).length,5,'Negative control: legacy ID/bundle gate accepted substituted source.');
  assert.throws(()=>now.regionalTourStructures(catalog,tour),/renal guided tour/);newlyRefused++;
 }
}
let changed=0,unchanged=0,topics=0;
for(const s of now.catalog.structures){
 const current=await now.bodyReviewMaterial(s.id),previous=await old.bodyReviewMaterial(s.id);
 assert(current&&previous);topics+=current.topics.length;
 assert.deepEqual(current.source,previous.source);assert.deepEqual(current.topics,previous.topics);assert.deepEqual(current.reasoning,previous.reasoning);
 assert.deepEqual(current.guidedTours.filter(e=>e.tour.id!==tour.id),previous.guidedTours.filter(e=>e.tour.id!==tour.id));
 assert.equal(current.approval,false);
 if(!affected.has(s.id)){assert.deepEqual(current,previous);unchanged++;continue;}
 changed++;assert.notEqual(current.fingerprints.teaching,previous.fingerprints.teaching);
 assert.equal(current.fingerprints.source,previous.fingerprints.source);assert.equal(current.fingerprints.checklist,previous.fingerprints.checklist);
 assert(await now.parseBodyReviewResponse(current,s.id));assert.equal(await now.parseBodyReviewResponse(previous,s.id),null,'Old tour revision is not current review evidence.');
 const i=current.guidedTours.findIndex(e=>e.tour.id===tour.id),evidence=current.guidedTours[i];assert(i>=0);
 assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
 assert.deepEqual(evidence.continuousPlayback,previous.guidedTours.find(e=>e.tour.id===tour.id).continuousPlayback);
 for(const mutate of [p=>{p.guidedTours[i].tour.revision=old.renalTour.revision;},p=>{p.guidedTours[i].tour.steps[0].caption+=' changed';},p=>{p.guidedTours[i].structures[0].sources[0].sha256='0'.repeat(64);},p=>{p.guidedTours[i].transitionMs=0;},p=>p.guidedTours.splice(i,1)]){
  const altered=structuredClone(current);mutate(altered);assert.equal(await now.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
 }
}
assert.equal(changed,5);assert.equal(unchanged,1099);assert.equal(topics,9936);
console.log(JSON.stringify({baseline,tours:now.regionalTours.length,steps:now.regionalTours.reduce((n,t)=>n+t.steps.length,0),newlyRefusedLegacySourceSubstitutions:newlyRefused,
 affectedReviewPackets:changed,unchangedReviewPackets:unchanged,unchangedTopicPlacements:topics,packetRefusals,smoothCameraAndPlaybackPreserved:true,clinicalApproval:false}));
