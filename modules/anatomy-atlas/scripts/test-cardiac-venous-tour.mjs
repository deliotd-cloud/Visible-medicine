import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const parent='ee6647564d871ebc86fa81c44c87718feb178567';
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync('content/cardiac-venous-tour-pins.json'));
assert.equal(sha(JSON.stringify(pins)),'e47f042b655e69987d04c4192ad1991b99d6cebab3f9ca089bd581f2aec94156');
assert.equal(pins.parentCommit,parent);
async function load(prior=false){
 // Freeze this historical admission transition; later tours have their own
 // complete prior/current packet-preservation checks.
 const registry=prior?parent:'74ed7e65a65c919c787d0086ce50a11c21bf779b';
 const plugins=[{name:'exact-tour-registry',setup(b){b.onLoad({filter:/regional-tours\.ts$/,namespace:'workspace-test'},args=>({contents:execFileSync('git',['show',registry+':lib/regional-tours.ts'],{encoding:'utf8'}),loader:'ts',resolveDir:dirname(args.path)}));}}];
 const r=await build({stdin:{contents:"export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
 return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const api=await load(),before=await load(true),tour=api.cardiacVenousTour;
assert.equal(api.regionalTours.length,34);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),202);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);assert.equal(tour.status,'draft');
assert.equal(api.regionalToursFor('thorax').at(-1).id,tour.id);
assert.equal(api.regionalTourFor('thorax').id,before.regionalTourFor('thorax').id);
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','left','posterior','anterior']);
assert.deepEqual(tour.steps.map(s=>s.selectedId),[...pins.entries.slice(0,3).map(s=>s.id),pins.entries[0].id]);
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected,[pins.entries[3],...pins.entries.slice(0,3)]);
for(const b of pins.bundles){const path='public'+b.url.split('?')[0],bytes=readFileSync(path);assert.equal(sha(bytes),b.sha256);assert.equal(bytes.length,b.bytes);assert.deepEqual(bytes,execFileSync('git',['show',parent+':'+path],{maxBuffer:32e6}));}
let refusals=0;
const reject=(catalog,t=tour)=>{assert.throws(()=>api.regionalTourStructures(catalog,t));refusals++;};
for(const s of selected){
 reject({...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)});
 reject({...api.catalog,structures:[...api.catalog.structures,s]});
 for(const patch of [{id:'foreign'},{sources:[]},{fmaId:'foreign'},{bundle:'foreign'},{laterality:'left'},{bounds:{}},{validation:{...s.validation,anatomicalReview:true}}])reject({...api.catalog,structures:api.catalog.structures.map(v=>v.id===s.id?{...v,...patch}:v)});
}
for(const b of pins.bundles){reject({...api.catalog,bundles:api.catalog.bundles.filter(v=>v.id!==b.id)});reject({...api.catalog,bundles:[...api.catalog.bundles,b]});reject({...api.catalog,bundles:api.catalog.bundles.map(v=>v.id===b.id?{...v,sha256:'foreign'}:v)});}
for(const patch of [{sourceVersion:'foreign'},{license:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].caption+=' altered';},t=>{t.steps[0].frameIds=[];},t=>{t.contextIds=[];},t=>{t.revision='foreign';}]){const changed=structuredClone(tour);mutate(changed);reject(api.catalog,changed);}
const frames=api.regionalTourStepFrames(api.catalog,tour);assert.equal(frames.length,4);
assert.deepEqual(tour.steps.slice(0,3).map(s=>s.frameIds),pins.entries.slice(0,3).map(s=>[s.id]));
assert.deepEqual(tour.steps[3].frameIds,pins.entries.map(s=>s.id));
for(const [index,step] of tour.steps.entries()){
 assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.frameIds.includes(step.selectedId));assert(step.references.every(url=>url.startsWith('https://')));
 for(const id of step.frameIds){const s=selected.find(s=>s.id===id);assert(s);assert(s.bounds.min.every((v,a)=>v>=frames[index].min[a]&&s.bounds.max[a]<=frames[index].max[a]));}
}
let changed=0,preserved=0,topics=0,packetRefusals=0;
const targets=new Set(selected.map(s=>s.id));
for(const s of api.catalog.structures){
 const now=await api.bodyReviewMaterial(s.id),old=await before.bodyReviewMaterial(s.id);
 assert.deepEqual(now.source,old.source);assert.deepEqual(now.topics,old.topics);assert.deepEqual(now.reasoning,old.reasoning);topics+=now.topics.length;
 assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),old.guidedTours);
 if(!targets.has(s.id)){assert.deepEqual(now,old);preserved++;continue;}
 changed++;assert.equal(now.approval,false);assert.notEqual(now.fingerprints.teaching,old.fingerprints.teaching);
 assert(await api.parseBodyReviewResponse(now,s.id));assert.equal(await api.parseBodyReviewResponse(old,s.id),null);
 const index=now.guidedTours.findIndex(g=>g.tour.id===tour.id),e=now.guidedTours[index];
 assert.deepEqual(e.structures,selected);assert.deepEqual(e.stepFrames,frames);assert.equal(e.transitionMs,1800);assert.equal(e.transition,'quintic-orbit');assert.equal(e.separation,0);
 for(const mutate of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(e)),p=>{p.guidedTours[index].tour.steps[0].caption='altered';},p=>{p.guidedTours[index].transitionMs=0;},p=>{p.guidedTours[index].structures[0].sources=[];}]){const value=structuredClone(now);mutate(value);assert.equal(await api.parseBodyReviewResponse(value,s.id),null);packetRefusals++;}
}
assert.equal(changed,4);assert.equal(preserved,1100);assert.equal(topics,9936);
console.log(JSON.stringify({tours:34,stops:202,targets:3,context:1,refusals,packetRefusals,preserved,unchangedTopics:topics,clinicalApproval:false}));
