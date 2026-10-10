import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='f0d4f3622f967bb394a16e178339d6a30c02a5e0';
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync('content/forearm-arterial-tour-pins.json'));
assert.equal(pins.baseline,baseline);
assert.equal(sha(JSON.stringify(pins)),'aea55738c5d1f6cc960c799180d478ed820721e9ee5885ae17204bdc25041bdd');
const sourceOnly=process.argv.includes('--source-only');
async function load(mode='current'){
  const previous=mode==='previous',source=mode==='source';
  const plugins=previous?[{name:'prior-tour-registration',setup(b){b.onLoad({filter:/[\\/]lib[\\/]regional-tours\.ts$/,namespace:'workspace-test'},args=>({contents:execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8',maxBuffer:32e6}),loader:'ts',resolveDir:dirname(args.path)}));}}]:[];
  const contents=source
    ? "export * from './lib/forearm-arterial-tour';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);"
    : "export * from './lib/regional-tours';export {forearmArterialTourMatches} from './lib/forearm-arterial-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
  return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const api=await load(sourceOnly?'source':'current'),tour=api.forearmArterialTour;
assert.equal(tour.id,'right-forearm-arterial-orientation');
assert.equal(tour.revision,tour.id+'-v1');assert.equal(tour.status,'draft');assert.equal(tour.region,'forearm');
assert.deepEqual(tour.steps.map(s=>s.selectedId),pins.entries.map(s=>s.id));
assert.deepEqual(tour.contextIds,pins.contextEntries.map(s=>s.id));
assert.equal(new Set(tour.steps.map(s=>s.id)).size,4);
const selected=[...pins.contextEntries,...pins.entries],admitted=[...pins.entries,...pins.contextEntries];
assert(selected.every(s=>s.regions.includes('forearm')&&s.laterality==='right'&&!s.validation.anatomicalReview));
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),selected.map(s=>s.id).sort());
for(const s of selected)assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
const expectedFrames=[[0],[1],[2],[3]];
for(const [i,step] of tour.steps.entries()){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.frameIds,expectedFrames[i].map(index=>admitted[index].id));
  assert(step.frameIds.includes(step.selectedId));
  assert(step.references.length&&step.references.every(url=>url.startsWith('https://anatomy.ttuhscep.edu/')));
}
for(const term of [/posterior interosseous/i,/bifurcation/i,/nerve geometry/i,/whole-surface camera bounds/i,/patency/i,/flow/i,/dissection plane/i,/registration/i,/radiologist/i,/unvalidated/i])
  assert.match(tour.limitations,term);
assert.equal(api.forearmArterialTourMatches(api.catalog,tour),true);
for(const b of pins.bundles){
  const path='public'+b.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(sha(bytes),b.sha256);assert.equal(bytes.length,b.bytes);
  assert(bytes.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6})));
}
let sourceRefusals=0,packetRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.equal(api.forearmArterialTourMatches(catalog,t),false);sourceRefusals++;};
for(const s of selected){
  reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
  reject({...api.catalog,structures:[...api.catalog.structures,s]});
  for(const patch of [{id:'foreign'},{fmaId:'foreign'},{laterality:'left'},{bundle:'foreign'},{sources:[]},{regions:['pelvis']},{bounds:{min:[0,0,0],max:[1,1,1]}},{validation:{...s.validation,anatomicalReview:true}}])
    reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)});
  reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
}
for(const b of pins.bundles){
  reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==b.id)});
  reject({...api.catalog,bundles:[...api.catalog.bundles,b]});
  reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?{...x,sha256:'foreign'}:x)});
}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].caption+=' altered';},t=>{t.steps[0].frameIds=[];},t=>{t.contextIds=[];},t=>{t.region='pelvis';},t=>{t.revision+=' altered';}]){
  const changed=structuredClone(tour);mutate(changed);reject(api.catalog,changed);
}
if(sourceOnly){
  console.log(JSON.stringify({mode:'source-only',targets:4,context:2,bundles:pins.bundles.length,sourceRefusals}));
  process.exit(0);
}
const before=await load('previous');
assert.equal(api.regionalTours.length,38);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),223);
assert.equal(before.regionalTours.length,37);assert.deepEqual(api.regionalTours.slice(0,-1),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);assert.deepEqual(api.regionalToursFor('forearm').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),[...pins.contextEntries,...pins.entries]);
const frames=api.regionalTourStepFrames(api.catalog,tour);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=selected.find(s=>s.id===id);assert(s);
  assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));
}
const rejectTour=(catalog=api.catalog,t=tour)=>{assert.throws(()=>api.regionalTourStructures(catalog,t));};
for(const s of selected)rejectTour({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
rejectTour(api.catalog,{...tour,steps:[...tour.steps].reverse()});
let changed=0,unchanged=0,topics=0;
const selectedIds=new Set(selected.map(s=>s.id));
for(const s of api.catalog.structures){
  const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
  assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);
  assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;assert.equal(now.approval,false);
  assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
  if(!selectedIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
  changed++;assert.notEqual(now.fingerprints.teaching,prior.fingerprints.teaching);
  assert(await api.parseBodyReviewResponse(now,s.id));assert.equal(await api.parseBodyReviewResponse(prior,s.id),null);
  const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];assert(at>=0);
  assert.deepEqual(evidence.structures,[...pins.contextEntries,...pins.entries]);assert.deepEqual(evidence.stepFrames,frames);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  for(const mutate of [p=>p.guidedTours[at].tour.steps.reverse(),p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},p=>p.guidedTours.splice(at,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){
    const altered=structuredClone(now);mutate(altered);
    assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
  }
}
assert.equal(changed,6);assert.equal(unchanged,1098);assert.equal(topics,9936);
console.log(JSON.stringify({tours:38,stops:223,preservedTours:37,sourceRefusals,packetRefusals,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
