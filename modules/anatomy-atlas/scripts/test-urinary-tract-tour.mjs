import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='cb412b50a1415c5662a346e509b23326799247f9';
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync('content/urinary-tract-tour-pins.json'));
assert.equal(pins.baseline,baseline);
assert.equal(sha(JSON.stringify(pins)),'838bb6175f4ae84ed1323e71a0551a6f1132694d825c13ba1754b6209ee5a949');
const sourceOnly=process.argv.includes('--source-only');
async function load(mode='current'){
  const previous=mode==='previous',source=mode==='source';
  const epoch='0a4d4ae6115ee6894734d0ce6efed38cb693f441';
  const plugins=previous?[{name:'prior-tour-registration',setup(b){b.onLoad({filter:/[\\/]lib[\\/]regional-tours\.ts$/,namespace:'workspace-test'},args=>({contents:execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8',maxBuffer:32e6}),loader:'ts',resolveDir:dirname(args.path)}));}}]:[];
  const contents=source
    ? "export * from './lib/urinary-tract-tour';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);"
    : "export * from './lib/regional-tours';export {urinaryTractTourMatches} from './lib/urinary-tract-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  // Replay this completed 40-tour epoch; the digestive suite checks the current
  // 41-tour state and explicitly preserves all forty earlier sequences.
  if(!source)plugins.push({name:'completed-urinary-tour-epoch',setup(b){
    b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
      const path=relative(process.cwd(),args.path).replaceAll('\\','/');
      if(!/^(?:app|lib|content|public\/models)\/.+\.(?:ts|tsx|json)$/.test(path))return;
      return {contents:execFileSync('git',['show',epoch+':'+path],{encoding:'utf8',maxBuffer:32e6}),loader:path.endsWith('.json')?'json':path.endsWith('.tsx')?'tsx':'ts',resolveDir:dirname(args.path)};
    });
  }});
  const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
  return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const api=await load(sourceOnly?'source':'current'),tour=api.urinaryTractTour;
assert.equal(tour.id,'urinary-tract-orientation');
assert.equal(tour.revision,'urinary-tract-tour-20261010-r1');assert.equal(tour.status,'draft');
assert.equal(tour.region,'whole-body');assert.deepEqual(tour.scopeRegions,['abdomen','pelvis']);
assert.deepEqual(tour.steps.map(s=>s.selectedId),pins.entries.map(s=>s.id));
assert.deepEqual(tour.contextIds,[]);
assert.equal(new Set(tour.steps.map(s=>s.id)).size,5);
const selected=pins.entries;
assert(selected.every(s=>s.regions.some(r=>tour.scopeRegions.includes(r))&&!s.validation.anatomicalReview));
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),selected.map(s=>s.id).sort());
for(const s of selected)assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
assert.deepEqual(tour.steps.map(s=>s.frameIds),[
  [selected[0].id,selected[1].id,selected[4].id],
  [selected[0].id,selected[1].id,selected[4].id],
  [selected[2].id,selected[3].id,selected[4].id],
  [selected[2].id,selected[3].id,selected[4].id],
  selected.map(s=>s.id),
]);
for(const step of tour.steps){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_tables.html']);
}
assert(tour.steps.reduce((n,s)=>n+s.caption.trim().split(/\s+/).length,0)<150);
for(const term of [/external source surfaces/i,/recovered/i,/lumen/i,/collecting system/i,/orifices/i,/patency/i,/urine flow/i,/registration/i,/clinical validation/i,/male root/i,/female-generalised/i,/radiologist sign-off/i])
  assert.match(tour.limitations,term);
assert.equal(api.urinaryTractTourMatches(api.catalog,tour),true);
for(const b of pins.bundles){
  const path='public'+b.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(sha(bytes),b.sha256);assert.equal(bytes.length,b.bytes);
  assert(bytes.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6})));
}
let sourceRefusals=0,packetRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.equal(api.urinaryTractTourMatches(catalog,t),false);sourceRefusals++;};
for(const s of selected){
  reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
  reject({...api.catalog,structures:[...api.catalog.structures,s]});
  for(const patch of [{id:'foreign'},{fmaId:'foreign'},{laterality:'foreign'},{bundle:'foreign'},{sources:[]},{regions:['thorax']},{bounds:{min:[0,0,0],max:[1,1,1]}},{validation:{...s.validation,anatomicalReview:true}}])
    reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)});
  reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
}
for(const b of pins.bundles){
  reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==b.id)});
  reject({...api.catalog,bundles:[...api.catalog.bundles,b]});
  reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?{...x,sha256:'foreign'}:x)});
}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].caption+=' altered';},t=>{t.steps[0].frameIds=[];},t=>{t.contextIds.push('foreign');},t=>{t.scopeRegions=['abdomen'];},t=>{t.region='pelvis';},t=>{t.revision+=' altered';}]){
  const changed=structuredClone(tour);mutate(changed);reject(api.catalog,changed);
}
if(sourceOnly){
  console.log(JSON.stringify({mode:'source-only',targets:5,context:0,bundles:pins.bundles.length,sourceRefusals}));
  process.exit(0);
}
const before=await load('previous');
assert.equal(api.regionalTours.length,40);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),234);
assert.equal(before.regionalTours.length,39);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),229);
assert.deepEqual(api.regionalTours.slice(0,-1),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('whole-body').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),selected);
const frames=api.regionalTourStepFrames(api.catalog,tour);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=selected.find(s=>s.id===id);assert(s);
  assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));
}
const rejectTour=(catalog=api.catalog,t=tour)=>assert.throws(()=>api.regionalTourStructures(catalog,t));
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
  assert.deepEqual(evidence.structures,selected);assert.deepEqual(evidence.stepFrames,frames);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  for(const mutate of [p=>p.guidedTours[at].tour.steps.reverse(),p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},p=>p.guidedTours.splice(at,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){
    const altered=structuredClone(now);mutate(altered);
    assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
  }
}
assert.equal(changed,5);assert.equal(unchanged,1099);assert.equal(topics,9936);
console.log(JSON.stringify({tours:40,stops:234,preservedTours:39,sourceRefusals,packetRefusals,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
