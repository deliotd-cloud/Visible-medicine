import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const sourceBaseline='a453a3708749d1976a1cc18b69d8ece3f0eeec1e';
const previousTourCommit='aff36c610e3aba541dfdcc97b708c9d6d19a24d2';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fromGit=(commit,path)=>execFileSync('git',['show',commit+':'+path],{maxBuffer:32e6,windowsHide:true});
const previousPins=JSON.parse(fromGit(previousTourCommit,'content/lower-arterial-tour-pins.json'));
assert.equal(sha(JSON.stringify(previousPins)),'8fe8d8486596a983fde8c4676ae77ac3b9e15d1aa28b7b99ffd2b2d5d24cee59');
async function load(previous=false){
 const plugins=previous?[{name:'previous-lower-arterial-tour',setup(b){
  b.onLoad({filter:/lower-arterial-tour\.ts$/,namespace:'workspace-test'},args=>({contents:fromGit(previousTourCommit,'lib/lower-arterial-tour.ts').toString(),loader:'ts',resolveDir:dirname(args.path)}));
  b.onLoad({filter:/lower-arterial-tour-pins\.json$/,namespace:'workspace-test'},args=>({contents:JSON.stringify(previousPins),loader:'json',resolveDir:dirname(args.path)}));
 }}]:[];
 const r=await build({stdin:{contents:"export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
 return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const api=await load(),before=await load(true),tour=api.lowerArterialTour,pins=JSON.parse(readFileSync('content/lower-arterial-tour-pins.json'));
assert.equal(sha(JSON.stringify(pins)),'1e9a070c81a7c35f4ae5d6cd255bf22bf39fe02183f88d918fb25d4325d22b31');
assert.equal(pins.previousTourCommit,previousTourCommit);assert.equal(pins.baseline,sourceBaseline);assert.equal(pins.tourRevision,tour.id+'-v2');
assert.deepEqual(pins.entries,previousPins.entries);
assert.deepEqual(pins.bundles.filter(b=>previousPins.bundles.some(old=>old.id===b.id)),previousPins.bundles);
assert.equal(tour.id,'right-lower-limb-arterial-orientation');assert.equal(tour.revision,tour.id+'-v2');assert.equal(tour.status,'draft');assert.equal(tour.region,'whole-body');
assert.deepEqual(tour.steps.map(s=>s.selectedId),pins.entries.map(s=>s.id));assert.equal(tour.steps.length,9);assert.equal(new Set(tour.steps.map(s=>s.id)).size,9);
assert.deepEqual(tour.steps.map(s=>[s.id,s.title,s.selectedId,s.view,s.caption,s.references,s.durationMs,s.fadeOthers]),before.lowerArterialTour.steps.map(s=>[s.id,s.title,s.selectedId,s.view,s.caption,s.references,s.durationMs,s.fadeOthers]));
assert.deepEqual(tour.steps.slice(0,6).map(s=>s.frameIds),before.lowerArterialTour.steps.slice(0,6).map(s=>s.frameIds));
assert.equal(before.lowerArterialTour.revision,tour.id+'-v1');
assert.equal(api.regionalTours.length,36);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),213);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours.filter(t=>t.id!==tour.id));assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('whole-body').find(t=>t.id===tour.id),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected,[...pins.contextEntries,...pins.entries]);
assert(selected.slice(0,9).every(s=>s.system==='skeleton'&&s.laterality==='right'&&!s.validation.anatomicalReview));
assert(selected.slice(9).every(s=>s.system==='vessels'&&s.laterality==='right'&&!s.validation.anatomicalReview));
assert.deepEqual([...new Set(selected.flatMap(s=>s.regions))].sort(),[...tour.scopeRegions].sort());
assert.deepEqual(tour.contextIds,pins.contextEntries.map(s=>s.id));assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),selected.map(s=>s.id).sort());
for(const s of selected)assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
for(const b of pins.bundles){const path='public'+b.url.split('?')[0],bytes=readFileSync(path);assert.equal(sha(bytes),b.sha256);assert.equal(bytes.length,b.bytes);assert.deepEqual(bytes,fromGit(sourceBaseline,path));}
let refused=0;
function reject(catalog=api.catalog,t=tour){assert.throws(()=>api.regionalTourStructures(catalog,t));refused++;}
for(const s of selected){
 reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});reject({...api.catalog,structures:[...api.catalog.structures,s]});
 for(const patch of [{id:'foreign'},{fmaId:'foreign'},{laterality:'left'},{bundle:'foreign'},{sources:[]},{regions:['head-neck']},{validation:{...s.validation,anatomicalReview:true}}])reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)});
}
for(const b of pins.bundles){reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==b.id)});reject({...api.catalog,bundles:[...api.catalog.bundles,b]});reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?{...x,sha256:'foreign'}:x)});}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].caption+=' altered';},t=>{t.steps[0].frameIds=[];},t=>{t.contextIds=[];},t=>{t.scopeRegions=['leg'];},t=>{t.revision+=' altered';}]){const changed=structuredClone(tour);mutate(changed);reject(api.catalog,changed);}
const frames=api.regionalTourStepFrames(api.catalog,tour);assert.equal(frames.length,9);
for(const [i,step] of tour.steps.entries()){
 assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.references.length);assert(step.frameIds.includes(step.selectedId));
 for(const id of step.frameIds){const s=selected.find(s=>s.id===id);assert(s);assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));}
 if(i>=6){assert(step.frameIds.every(id=>id.includes(':foot:')));assert(frames[i].min[1]>-9&&frames[i].max[1]<-7.5);assert(frames[i].max[1]-frames[i].min[1]<0.8);}
}
for(const term of [/fibular/i,/arch/i,/lumen/i,/flow/i,/registration/i,/radiologist/i])assert.match(tour.limitations,term);
let changed=0,unchanged=0,topics=0,packetRefusals=0;
const selectedIds=new Set(selected.map(s=>s.id));
for(const s of api.catalog.structures){
 const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
 assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;assert.equal(now.approval,false);
 assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours.filter(g=>g.tour.id!==tour.id));
 if(!selectedIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
 changed++;assert.notEqual(now.fingerprints.teaching,prior.fingerprints.teaching);
 assert(await api.parseBodyReviewResponse(now,s.id),s.id);assert.equal(await api.parseBodyReviewResponse(prior,s.id),null,s.id);
 const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];
 assert(at>=0);assert.deepEqual(evidence.structures,selected);assert.deepEqual(evidence.stepFrames,frames);assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
 for(const mutate of [p=>{p.guidedTours[at].tour.steps.reverse();},p=>{p.guidedTours[at].tour.contextIds=[];},p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},p=>{p.guidedTours.push(structuredClone(p.guidedTours[at]));},p=>{p.guidedTours.splice(at,1);},p=>{const extra=structuredClone(p.guidedTours[at]);extra.tour.id='foreign';p.guidedTours.push(extra);}]){const altered=structuredClone(now);mutate(altered);assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;}
}
assert.equal(changed,18);assert.equal(unchanged,1086);assert.equal(topics,9936);
console.log(JSON.stringify({tours:36,stops:213,targets:9,context:9,sourceRefusals:refused,packetRefusals,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
