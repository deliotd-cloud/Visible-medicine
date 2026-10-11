import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='4624f82b6c517767238da9c31daf5d8c7fbe7d8b';
const revision='cranial-vault-tour-20261011-r1';
const sourceUrl='https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pins=JSON.parse(readFileSync('content/cranial-vault-tour-pins.json'));
assert.equal(pins.baseline,baseline);
assert.equal(pins.tourRevision,revision);
assert.equal(sha(JSON.stringify(pins)),'2aa5a042cc29d1125e5419ac1eac4c9d43eda493bcc390e6a415dff6a09c2c64');
const sourceOnly=process.argv.includes('--source-only');

async function load(mode='current'){
  const plugins=mode==='previous'?[{name:'baseline-tour-registry',setup(b){
    b.onLoad({filter:/[\\/]lib[\\/]regional-tours\.ts$/,namespace:'workspace-test'},args=>({
      contents:execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8',maxBuffer:32e6}),
      loader:'ts',resolveDir:dirname(args.path),
    }));
  }}]:[];
  const contents=mode==='source'
    ? "export * from './lib/cranial-vault-tour';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);"
    : "export * from './lib/regional-tours';export {cranialVaultTourMatches} from './lib/cranial-vault-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const api=await load(sourceOnly?'source':'current'),tour=api.cranialVaultTour;
const targets=pins.entries;
const targetIds=targets.map(s=>s.id);
assert.deepEqual(targets.map(s=>s.fmaId),['FMA52734','FMA52788','FMA52738','FMA52735','FMA52739','FMA52789']);
assert.deepEqual(pins.contextEntries,[]);
assert.equal(new Set(targetIds).size,6);
assert.equal(tour.id,'cranial-vault-orientation');
assert.equal(tour.title,'Cranial vault: exterior orientation');
assert.equal(tour.revision,revision);
assert.equal(tour.status,'draft');
assert.equal(tour.region,'head-neck');
assert.deepEqual(tour.contextIds,[]);
assert.equal(tour.steps.length,6);
assert.deepEqual(tour.steps.map(s=>s.selectedId),targetIds);
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','right','right','posterior','left','left']);
assert.equal(new Set(tour.steps.map(s=>s.id)).size,6);
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),[...targetIds].sort());
for(const s of targets){
  assert(s.regions.includes('head-neck'));
  assert.equal(s.validation.anatomicalReview,false);
  assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
}
for(const step of tour.steps){
  assert.equal(step.durationMs,14000);
  assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.frameIds,targetIds,'Every stop retains the same six source surfaces in their pinned order.');
  assert.deepEqual(step.references,[sourceUrl]);
  assert(step.caption.trim().length>0);
}
for(const term of [/source surfaces/i,/registration/i,/radiologist sign-off/i])
  assert.match(tour.limitations,term);
assert.equal(api.cranialVaultTourMatches(api.catalog,tour),true);

const rawCatalog=readFileSync('public/models/bodyparts3d/full-body/catalog.json');
assert(rawCatalog.equals(execFileSync('git',['show',baseline+':public/models/bodyparts3d/full-body/catalog.json'],{maxBuffer:64e6})));
for(const b of pins.bundles){
  const path='public'+b.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,b.bytes);
  assert.equal(sha(bytes),b.sha256);
  assert(bytes.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6})));
}

let sourceRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{
  assert.equal(api.cranialVaultTourMatches(catalog,t),false);
  sourceRefusals++;
};
for(const s of targets){
  reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
  reject({...api.catalog,structures:[...api.catalog.structures,s]});
  for(const patch of [{id:'foreign'},{fmaId:'foreign'},{laterality:'foreign'},{bundle:'foreign'},
    {sources:[]},{regions:['foreign']},{bounds:{min:[0,0,0],max:[1,1,1]}},
    {validation:{...s.validation,anatomicalReview:true}}])
    reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)});
  reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
}
for(const b of pins.bundles){
  reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==b.id)});
  reject({...api.catalog,bundles:[...api.catalog.bundles,b]});
  reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?{...x,sha256:'foreign'}:x)});
}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].caption+=' altered';},
  t=>{t.steps[0].frameIds=[];},t=>{t.steps[0].frameIds=[t.steps[0].selectedId];},
  t=>{t.steps[0].references=['https://example.invalid'];},t=>{t.contextIds=[targetIds[0]];},
  t=>{t.region='pelvis';},t=>{t.requiredDisplayBundles[targetIds[0]]='foreign';},
  t=>{t.revision+=' altered';}]){
  const changed=structuredClone(tour);mutate(changed);reject(api.catalog,changed);
}
if(sourceOnly){
  console.log(JSON.stringify({mode:'source-only',targets:6,context:0,bundles:pins.bundles.length,sourceRefusals}));
  process.exit(0);
}

const before=await load('previous');
assert.equal(before.regionalTours.length,43);
assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),255);
assert.equal(api.regionalTours.length,44);
assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),261);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('head-neck').at(-1),tour);
assert(api.regionalToursFor('head-neck').some(t=>t.id===tour.id),'Study and library tour discovery must include the cranial vault.');
for(const region of api.catalog.regions)
  assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),targets);
const frames=api.regionalTourStepFrames(api.catalog,tour);
assert.equal(frames.length,6);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=targets.find(s=>s.id===id);assert(s);
  assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));
}
for(const s of targets)
  assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,steps:[...tour.steps].reverse()}));

let changed=0,unchanged=0,topics=0,packetRefusals=0;
const selectedIds=new Set(targetIds);
for(const s of api.catalog.structures){
  const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
  assert.deepEqual(now.source,prior.source);
  assert.deepEqual(now.topics,prior.topics);
  assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;
  assert.equal(now.approval,false);
  assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
  if(!selectedIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
  changed++;
  assert.notEqual(now.fingerprints.teaching,prior.fingerprints.teaching);
  assert(await api.parseBodyReviewResponse(now,s.id));
  assert.equal(await api.parseBodyReviewResponse(prior,s.id),null);
  const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];assert(at>=0);
  assert.deepEqual(evidence.structures,targets);
  assert.deepEqual(evidence.stepFrames,frames);
  assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  for(const mutate of [p=>p.guidedTours[at].tour.steps.reverse(),
    p=>{p.guidedTours[at].tour.steps[0].caption+=' altered';},
    p=>{p.guidedTours[at].tour.steps[0].frameIds=[];},
    p=>{p.guidedTours[at].tour.steps[0].references=['https://example.invalid'];},
    p=>{p.guidedTours[at].tour.revision+=' altered';},
    p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},
    p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},
    p=>p.guidedTours.splice(at,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){
    const altered=structuredClone(now);mutate(altered);
    assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
  }
}
assert.equal(changed,6);
assert.equal(unchanged,1098);
assert.equal(topics,9936);
console.log(JSON.stringify({tours:44,stops:261,preservedTours:43,sourceRefusals,packetRefusals,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
