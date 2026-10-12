import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='1604303bb9377dd2390e840c079652eb59c47fb0';
const revision='pancreatic-arterial-relationships-20261012-r1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pins=JSON.parse(readFileSync('content/pancreatic-arterial-tour-pins.json'));
assert.equal(pins.baseline,baseline);assert.equal(pins.tourRevision,revision);
assert.equal(sha(JSON.stringify(pins)),'c4937798b398b806fc0b765582ccf9a49047187ee0edb2bb6d7a7289bee75e0d');
assert.deepEqual(pins.bundles.map(b=>b.id).sort(),['abdomen-organs','abdomen-vessels-recovery','abdomen-vessels-visceral-detail','pancreas-corrected-parent']);
const sourceOnly=process.argv.includes('--source-only');
async function load(mode='current'){
 const plugins=mode==='previous'?[{name:'saved-registry',setup(b){b.onLoad({filter:/[\\/]lib[\\/]regional-tours\.ts$/,namespace:'workspace-test'},args=>({contents:execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8',maxBuffer:32e6,windowsHide:true}),loader:'ts',resolveDir:dirname(args.path)}));}}]:[];
 const contents=(mode==='source'?"export * from './lib/pancreatic-arterial-tour';":"export * from './lib/regional-tours';export {pancreaticArterialTourMatches} from './lib/pancreatic-arterial-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';")+"import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
 const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const api=await load(sourceOnly?'source':'current'),tour=api.pancreaticArterialTour;
const targets=pins.entries,context=pins.contextEntries,all=[...targets,...context],resolved=[...context,...[0,3,1,4,2,5,6,7,8].map(i=>targets[i])];
const expected=['FMA14782','FMA14784','FMA14805','FMA70479','FMA70480','FMA14787','FMA14790','FMA14792','FMA14793'];
assert.deepEqual(targets.map(s=>s.fmaId),expected);
assert(targets.every(s=>s.laterality==='unspecified'));
assert.deepEqual(context.map(s=>s.fmaId),['FMA7198','FMA7196','FMA14749','FMA14773','FMA76574']);
assert.equal(new Set(all.map(s=>s.id)).size,14);
assert.equal(tour.id,'pancreatic-arterial-relationships');assert.equal(tour.revision,revision);assert.equal(tour.region,'abdomen');assert.equal(tour.status,'draft');
assert.deepEqual(tour.contextIds,context.map(s=>s.id));assert.equal(tour.steps.length,9);
assert.deepEqual(tour.steps.map(s=>s.selectedId),[0,3,1,4,2,5,6,7,8].map(i=>targets[i].id));
assert.deepEqual(tour.steps.map(s=>s.title),[0,3,1,4,2,5,6,7,8].map(i=>targets[i].name));
assert.equal(new Set(tour.steps.map(s=>s.id)).size,9);
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','anterior','posterior','posterior','right','posterior','anterior','anterior','left']);
assert.deepEqual(tour.steps.map(s=>s.frameIds),[[0,3,2,13],[0,3,2,13],[1,4,2,13],[1,4,2,13],[2,3,4,11],[5,6,7],[5,6,7],[6,7,8],[7,8]].map(indices=>indices.map(i=>all[i].id)));
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),all.map(s=>s.id).sort());
for(const s of all){assert(s.regions.includes('abdomen'));assert.equal(s.validation.anatomicalReview,false);assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);}
const uams='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/artery-tables/arteries-of-the-abdomen/';
for(const step of tour.steps){assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.caption.trim());assert(step.references.includes(uams));assert(step.frameIds.includes(step.selectedId));}
for(const term of [/aggregate corrected parent/i,/duodenum/i,/ducts/i,/veins/i,/complete small branches/i,/connected lumina/i,/universal branching pattern/i,/flow/i,/patient.space registration/i,/revision.bound radiologist sign.off/i])assert.match(tour.limitations,term);
assert.equal(api.pancreaticArterialTourMatches(api.catalog,tour),true);
assert.equal(api.pancreaticArterialTourMatches(api.catalog,structuredClone(tour)),true);
assert(readFileSync('public/models/bodyparts3d/full-body/catalog.json').equals(execFileSync('git',['show',baseline+':public/models/bodyparts3d/full-body/catalog.json'],{maxBuffer:64e6,windowsHide:true})));
for(const b of pins.bundles){const path='public'+b.url.split('?')[0],bytes=readFileSync(path);assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);assert(bytes.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6,windowsHide:true})));}
let sourceRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.equal(api.pancreaticArterialTourMatches(catalog,t),false);sourceRefusals++;};
const leaves=(v,path=[])=>v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,c])=>leaves(c,[...path,k]));
const mutateLeaves=(value,check)=>{for(const path of leaves(value)){const bad=structuredClone(value);let node=bad;for(const key of path.slice(0,-1))node=node[key];const key=path.at(-1),prior=node[key];node[key]=typeof prior==='number'?prior+.01:typeof prior==='boolean'?!prior:String(prior)+'-foreign';check(bad);}};
for(const s of all){
 reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
 reject({...api.catalog,structures:[...api.catalog.structures,s]});
 reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
 mutateLeaves(s,bad=>reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?bad:x)}));
 for(const bad of [{...s,unexpected:true},(()=>{const c=structuredClone(s);delete c.sources;return c;})(),{...s,sources:[...s.sources,s.sources[0]]}])reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?bad:x)});
}
for(const b of pins.bundles){
 reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==b.id)});
 reject({...api.catalog,bundles:[...api.catalog.bundles,b]});
 reject({...api.catalog,bundles:[...api.catalog.bundles,{...b,id:b.id+'-alias'}]});
 mutateLeaves(b,bad=>reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?bad:x)}));
 reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===b.id?{...b,unexpected:true}:x)});
}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
mutateLeaves(api.catalog.coordinateSystem,bad=>reject({...api.catalog,coordinateSystem:bad}));
mutateLeaves(tour,bad=>reject(api.catalog,bad));
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].frameIds=[];},t=>{t.steps[0].references=[];},t=>{t.contextIds=[];},t=>{delete t.requiredDisplayBundles;},t=>{t.unexpected=true;}]){const bad=structuredClone(tour);mutate(bad);reject(api.catalog,bad);}
if(sourceOnly){console.log(JSON.stringify({mode:'source-only',targets:9,context:5,bundles:pins.bundles.length,sourceRefusals}));process.exit(0);}

const before=await load('previous');
assert.equal(before.regionalTours.length,45);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),265);
assert.equal(api.regionalTours.length,46);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),274);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('abdomen').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),resolved);
const frames=api.regionalTourStepFrames(api.catalog,tour);assert.equal(frames.length,9);
assert.deepEqual(frames[0],frames[1]);assert.deepEqual(frames[2],frames[3]);assert.deepEqual(frames[5],frames[6]);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){const s=all.find(s=>s.id===id);assert(s);assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));}
for(const s of all)assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,steps:[...tour.steps].reverse()}));
let changed=0,unchanged=0,topics=0,packetRefusals=0;
const selectedIds=new Set(all.map(s=>s.id));assert.equal(api.catalog.structures.length,1104);
for(const s of api.catalog.structures){
 const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
 assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;
 assert.equal(now.approval,false);assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
 if(!selectedIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
 changed++;assert.notEqual(now.fingerprints.teaching,prior.fingerprints.teaching);
 assert(await api.parseBodyReviewResponse(now,s.id));assert.equal(await api.parseBodyReviewResponse(prior,s.id),null);
 assert.deepEqual(now.reviewerNotes.evidence,[]);
 const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];assert(at>=0);
 assert.deepEqual(evidence.tour,tour);assert.deepEqual(evidence.structures,resolved);assert.deepEqual(evidence.stepFrames,frames);assert.deepEqual(evidence.bundles,pins.bundles);
 assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
 for(const mutate of [p=>p.guidedTours[at].tour.steps.reverse(),p=>{p.guidedTours[at].tour.steps[0].caption+=' altered';},p=>{p.guidedTours[at].tour.steps[0].frameIds=[];},p=>{p.guidedTours[at].tour.steps[0].references=['https://example.invalid'];},p=>{p.guidedTours[at].tour.contextIds=[];},p=>{p.guidedTours[at].tour.revision+=' altered';},p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},p=>{p.guidedTours[at].bundles[0].sha256='foreign';},p=>p.guidedTours.splice(at,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){const altered=structuredClone(now);mutate(altered);assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;}
}
assert.equal(changed,14);assert.equal(unchanged,1090);assert.equal(topics,9936);
console.log(JSON.stringify({tours:46,stops:274,preservedTours:45,sourceRefusals,packetRefusals,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
