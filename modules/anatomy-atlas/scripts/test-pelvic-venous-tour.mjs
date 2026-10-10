import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='b3a9ff28f407437a85b9c56278bd31944ba4033e';
const pins=JSON.parse(readFileSync('content/pelvic-venous-tour-pins.json'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(pins.baseline,baseline);
assert.equal(sha(JSON.stringify(pins)),'4d310848eed52f4d0a65ffc9da2b0ab2549eb013ce46cdf1c0743002010ae869');
const sourceOnly=process.argv.includes('--source-only');
async function load(mode='current'){
  // Retain this completed transition's exact 41→42 assertions. The diaphragm
  // suite separately proves all 42 prior tours and the full current catalogue.
  const registry=mode==='previous'?baseline:'214cec892da967a8057ab1647003200e4f934d92';
  const plugins=[{name:'prior-tour-registry',setup(b){
    b.onLoad({filter:/[\\/]lib[\\/]regional-tours\.ts$/,namespace:'workspace-test'},args=>({
      contents:execFileSync('git',['show',registry+':lib/regional-tours.ts'],{encoding:'utf8',maxBuffer:32e6}),
      loader:'ts',resolveDir:dirname(args.path),
    }));
  }}];
  const contents=mode==='source'
    ? "export * from './lib/pelvic-venous-tour';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);"
    : "export * from './lib/regional-tours';export {pelvicVenousTourMatches} from './lib/pelvic-venous-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
  return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const api=await load(sourceOnly?'source':'current'),tour=api.pelvicVenousTour;
const selected=[...pins.entries,...pins.contextEntries];
const resolved=[...pins.contextEntries,...pins.entries];
assert.equal(tour.id,'pelvic-venous-tributaries-orientation');
assert.equal(tour.revision,pins.tourRevision);assert.equal(tour.status,'draft');
assert.equal(tour.region,'pelvis');assert.equal(tour.steps.length,10);
assert.deepEqual(tour.steps.map(s=>s.selectedId),pins.entries.map(s=>s.id));
assert.deepEqual(tour.contextIds,pins.contextEntries.map(s=>s.id));
assert.equal(new Set(tour.steps.map(s=>s.id)).size,10);
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),selected.map(s=>s.id).sort());
for(const s of selected){
  assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
  assert(s.regions.includes('pelvis'));
  assert.equal(s.validation.anatomicalReview,false);
}
for(const step of tour.steps){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.equal(step.frameIds.length,2);assert(step.frameIds.includes(step.selectedId));
  assert.deepEqual(step.references,[
    'https://anatomy.ttuhscep.edu/anatomytables/veins_pelvis_perineum.html',
    'https://anatomy.ttuhscep.edu/reproductive_system/pelvicwall_tables.html',
    ...([0,4].includes(tour.steps.indexOf(step))?['https://pubmed.ncbi.nlm.nih.gov/17373712/']:[]),
  ]);
  const side=step.selectedId.includes(':left:')?'left':'right';
  assert(step.frameIds.find(id=>id!==step.selectedId).includes(`:${side}:vessel:${side}-`));
}
for(const term of [/left internal pudendal/i,/left lateral sacral/i,/held/i,/short superior gluteal/i,/connected lumen/i,/flow/i,/safe procedural path/i,/CT\/MRI/i,/patient registration/i,/clinical approval/i,/revision-bound radiologist sign-off/i])
  assert.match(tour.limitations,term);
assert(!selected.some(s=>['FMA18919','FMA18907'].includes(s.fmaId)));
assert(!tour.steps.some(s=>s.selectedId.includes('left-internal-pudendal')||s.selectedId.includes('left-lateral-sacral')));
assert.equal(api.pelvicVenousTourMatches(api.catalog,tour),true);
for(const b of pins.bundles){
  const path='public'+b.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);
  assert(bytes.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6})));
}
let sourceRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.equal(api.pelvicVenousTourMatches(catalog,t),false);sourceRefusals++;};
for(const s of selected){
  reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
  reject({...api.catalog,structures:[...api.catalog.structures,s]});
  for(const patch of [{id:'foreign'},{fmaId:'foreign'},{laterality:'foreign'},{bundle:'foreign'},{sources:[]},{regions:['foreign']},{bounds:{min:[0,0,0],max:[1,1,1]}},{validation:{...s.validation,anatomicalReview:true}}])
    reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)});
  reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
}
for(const b of pins.bundles){
  reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==b.id)});
  reject({...api.catalog,bundles:[...api.catalog.bundles,b]});
  reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?{...x,sha256:'foreign'}:x)});
}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].caption+=' altered';},t=>{t.steps[0].frameIds=[];},t=>{t.contextIds.push('foreign');},t=>{t.region='whole-body';},t=>{t.revision+=' altered';}]){
  const changed=structuredClone(tour);mutate(changed);reject(api.catalog,changed);
}
if(sourceOnly){
  console.log(JSON.stringify({mode:'source-only',targets:10,context:7,bundles:4,sourceRefusals}));
  process.exit(0);
}

const before=await load('previous');
assert.equal(before.regionalTours.length,41);
assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),240);
assert.equal(api.regionalTours.length,42);
assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),250);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('pelvis').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),resolved);
const frames=api.regionalTourStepFrames(api.catalog,tour);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=selected.find(s=>s.id===id);assert(s);
  assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));
}
for(const s of selected)assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,steps:[...tour.steps].reverse()}));
let changed=0,unchanged=0,topics=0,packetRefusals=0;
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
  assert.deepEqual(evidence.structures,resolved);assert.deepEqual(evidence.stepFrames,frames);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  for(const mutate of [p=>p.guidedTours[at].tour.steps.reverse(),p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},p=>p.guidedTours.splice(at,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){
    const altered=structuredClone(now);mutate(altered);
    assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
  }
}
assert.equal(changed,17);assert.equal(unchanged,api.catalog.structures.length-17);
assert.equal(topics,9936);
console.log(JSON.stringify({tours:42,stops:250,preservedTours:41,sourceRefusals,packetRefusals,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
