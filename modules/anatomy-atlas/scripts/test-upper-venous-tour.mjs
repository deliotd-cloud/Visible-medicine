import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='74ed7e65a65c919c787d0086ce50a11c21bf779b';
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync('content/upper-venous-tour-pins.json'));
assert.equal(sha(JSON.stringify(pins)),'596dbc3ec764b5b0f9c590a1d9b7223098b740f024197d95a0c31df1715015c2');
async function load(previous=false){
 // Replay this completed transition; test-mesenteric-tour checks the actual current registry.
 const revision=previous?baseline:'613daed2219432ba4c5321105d9552c7c9765e3e';
 const plugins=[{name:'prior-tour-registration',setup(b){b.onLoad({filter:/[\\/]lib[\\/]regional-tours\.ts$/,namespace:'workspace-test'},args=>({contents:execFileSync('git',['show',revision+':lib/regional-tours.ts'],{encoding:'utf8',maxBuffer:32e6}),loader:'ts',resolveDir:dirname(args.path)}));}}];
 const r=await build({stdin:{contents:"export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
 return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const api=await load(),before=await load(true),tour=api.upperVenousTour;
assert.equal(pins.baseline,baseline);assert.equal(tour.revision,tour.id+'-v1');assert.equal(tour.status,'draft');
assert.equal(api.regionalTours.length,35);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),208);
assert.equal(before.regionalTours.length,34);assert.deepEqual(api.regionalTours.slice(0,-1),before.regionalTours);assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('whole-body').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(tour.steps.map(s=>s.selectedId),pins.entries.map(s=>s.id));
assert.equal(new Set(tour.steps.map(s=>s.id)).size,6);
const selected=api.regionalTourStructures(api.catalog,tour),frames=api.regionalTourStepFrames(api.catalog,tour);
assert.deepEqual(selected,[...pins.contextEntries,...pins.entries]);assert(selected.every(s=>s.laterality==='right'&&!s.validation.anatomicalReview));
assert.deepEqual([...new Set(selected.flatMap(s=>s.regions))].sort(),[...tour.scopeRegions].sort());
for(const [i,step] of tour.steps.entries()){
 assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.references.every(url=>url.startsWith('https://anatomy.ttuhscep.edu/')));
 assert(step.frameIds.includes(step.selectedId));
 for(const id of step.frameIds){const s=selected.find(s=>s.id===id);assert(s);assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));}
}
assert(tour.steps[0].frameIds.every(id=>id.includes(':hand:')),'Hand framing must not include the whole arm');
assert.match(tour.steps[3].title,/Medial brachial/);assert.match(tour.limitations,/not the direction of blood flow/);
for(const b of pins.bundles){const path='public'+b.url.split('?')[0],bytes=readFileSync(path);assert.equal(sha(bytes),b.sha256);assert.equal(bytes.length,b.bytes);assert(bytes.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6})));}
let sourceRefusals=0,packetRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.throws(()=>api.regionalTourStructures(catalog,t));sourceRefusals++;};
for(const s of selected){
 reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});reject({...api.catalog,structures:[...api.catalog.structures,s]});
 for(const patch of [{id:'foreign'},{fmaId:'foreign'},{laterality:'left'},{bundle:'foreign'},{sources:[]},{regions:['pelvis']},{bounds:{min:[0,0,0],max:[1,1,1]}},{validation:{...s.validation,anatomicalReview:true}}])reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,...patch}:x)});
 reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
}
for(const b of pins.bundles){reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==b.id)});reject({...api.catalog,bundles:[...api.catalog.bundles,b]});reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?{...x,sha256:'foreign'}:x)});}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].caption+=' altered';},t=>{t.steps[0].frameIds=[];},t=>{t.contextIds=[];},t=>{t.scopeRegions=['hand'];},t=>{t.revision+=' altered';}]){const changed=structuredClone(tour);mutate(changed);reject(api.catalog,changed);}
let changed=0,unchanged=0,topics=0;
const selectedIds=new Set(selected.map(s=>s.id));
for(const s of api.catalog.structures){
 const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
 assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;assert.equal(now.approval,false);
 assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
 if(!selectedIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
 changed++;assert.notEqual(now.fingerprints.teaching,prior.fingerprints.teaching);
 assert(await api.parseBodyReviewResponse(now,s.id));assert.equal(await api.parseBodyReviewResponse(prior,s.id),null);
 const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];
 assert(at>=0);assert.deepEqual(evidence.structures,selected);assert.deepEqual(evidence.stepFrames,frames);assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
 for(const mutate of [p=>p.guidedTours[at].tour.steps.reverse(),p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},p=>p.guidedTours.splice(at,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){const altered=structuredClone(now);mutate(altered);assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;}
}
assert.equal(changed,10);assert.equal(unchanged,1094);assert.equal(topics,9936);
console.log(JSON.stringify({tours:35,stops:208,targets:6,context:4,preservedTours:34,sourceRefusals,packetRefusals,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
