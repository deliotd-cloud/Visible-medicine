import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='74a9c14258969ae33324d3f680be0f364e270463';
const revision='pulmonary-venous-hilar-relationships-20261011-r1';
const sourceUrl='https://anatomy.ttuhscep.edu/schemes/lungs_ans.html';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pins=JSON.parse(readFileSync('content/pulmonary-venous-tour-pins.json'));
assert.equal(pins.baseline,baseline);assert.equal(pins.tourRevision,revision);
assert.equal(sha(JSON.stringify(pins)),'82a8ffd83173093067aa32cb289536f111c9ef8e9948a2bfbcbc999357f40132');
const sourceOnly=process.argv.includes('--source-only');
async function load(mode='current'){
  const plugins=mode!=='source'?[{name:'exact-epoch-tour-registry',setup(b){
    b.onLoad({filter:/[\\/]lib[\\/]regional-tours\.ts$/,namespace:'workspace-test'},args=>({
      contents:execFileSync('git',['show',(mode==='previous'?baseline:'1604303bb9377dd2390e840c079652eb59c47fb0')+':lib/regional-tours.ts'],{encoding:'utf8',maxBuffer:32e6,windowsHide:true}),
      loader:'ts',resolveDir:dirname(args.path),
    }));
  }}]:[];
  const shared="export {bodyLesson} from './app/body-content';export {pulmonaryVenousTeachingLesson} from './lib/pulmonary-venous-teaching';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  const contents=(mode==='source'
    ? "export * from './lib/pulmonary-venous-tour';"
    : "export * from './lib/regional-tours';export {pulmonaryVenousTourMatches} from './lib/pulmonary-venous-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';")+shared;
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',plugins});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const api=await load(sourceOnly?'source':'current'),tour=api.pulmonaryVenousTour;
const targets=pins.entries,context=pins.contextEntries,all=[...targets,...context],resolved=[...context,...targets];
const targetIds=targets.map(s=>s.id),allIds=all.map(s=>s.id);
assert.deepEqual(targets.map(s=>s.fmaId),['FMA49914','FMA49911','FMA49916','FMA49913']);
assert.deepEqual(context.map(s=>s.fmaId),['FMA7395','FMA50872','FMA7396','FMA50873']);
const id=(side,kind,name)=>`vm:anatomy:body:thorax:${side}:${kind}:${side}-${name}`;
assert.deepEqual(targetIds,[id('right','vessel','superior-pulmonary-vein'),id('right','vessel','inferior-pulmonary-vein'),id('left','vessel','superior-pulmonary-vein'),id('left','vessel','inferior-pulmonary-vein')]);
assert.deepEqual(context.map(s=>s.id),[id('right','organ','main-bronchus'),id('right','vessel','pulmonary-artery'),id('left','organ','main-bronchus'),id('left','vessel','pulmonary-artery')]);
assert.equal(new Set(allIds).size,8);
assert.equal(tour.id,'pulmonary-venous-hilar-relationships');
assert.equal(tour.title,'Pulmonary veins: paired hilar relationships');
assert.equal(tour.revision,revision);assert.equal(tour.status,'draft');assert.equal(tour.region,'thorax');
assert.deepEqual(tour.contextIds,context.map(s=>s.id));assert.equal(tour.steps.length,4);
assert.deepEqual(tour.steps.map(s=>s.selectedId),targetIds);
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','right','anterior','left']);
assert.equal(new Set(tour.steps.map(s=>s.id)).size,4);
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),[...allIds].sort());
for(const s of all){
  assert(s.regions.includes('thorax'));assert.equal(s.validation.anatomicalReview,false);
  assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
}
assert(targets.every(s=>s.bundle==='thorax-vessels-recovery'));
for(const [i,step] of tour.steps.entries()){
  const side=Math.floor(i/2)*2;
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.frameIds,[targetIds[side],targetIds[side+1],context[side].id,context[side+1].id]);
  assert.deepEqual(step.references,[sourceUrl]);assert(step.caption.trim());
}
assert(tour.steps.map(s=>s.caption).join(' ').split(/\s+/).length<180);
for(const term of [/exterior donor segments/i,/named tributaries/i,/atrial ostia/i,/atrial connection/i,/ostial count/i,/validated branches/i,/drainage territory/i,/flow/i,/screen side/i,/assembled source geometry/i,/CT\/MRI image planes/i,/patient registration/i,/revision-bound radiologist sign-off/i])assert.match(tour.limitations,term);
assert.equal(api.pulmonaryVenousTourMatches(api.catalog,tour),true);
assert.equal(api.pulmonaryVenousTourMatches(api.catalog,structuredClone(tour)),true,'Exact identity equality permits detached copies.');
// Existing source-bound quick checks continue to resolve through the normal lesson dispatcher.
for(const s of targets){
  const quiz=api.bodyLesson(s,'quiz');
  assert.deepEqual(quiz,api.pulmonaryVenousTeachingLesson(s,'quiz'));
  assert.equal(quiz.bullets.length,4);assert(quiz.bullets.includes(quiz.correctAnswer));
}
const rawCatalog=readFileSync('public/models/bodyparts3d/full-body/catalog.json');
assert(rawCatalog.equals(execFileSync('git',['show',baseline+':public/models/bodyparts3d/full-body/catalog.json'],{maxBuffer:64e6,windowsHide:true})));
for(const b of pins.bundles){
  const path='public'+b.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,b.bytes);assert.equal(sha(bytes),b.sha256);
  assert(bytes.equals(execFileSync('git',['show',baseline+':'+path],{maxBuffer:32e6,windowsHide:true})));
}
let sourceRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.equal(api.pulmonaryVenousTourMatches(catalog,t),false);sourceRefusals++;};
const leaves=(v,path=[])=>v===null||typeof v!=='object'?[path]:Object.entries(v).flatMap(([k,c])=>leaves(c,[...path,k]));
const mutateLeaves=(value,check)=>{
  for(const path of leaves(value)){
    const bad=structuredClone(value);let node=bad;for(const key of path.slice(0,-1))node=node[key];
    const key=path.at(-1),prior=node[key];node[key]=typeof prior==='number'?prior+.01:typeof prior==='boolean'?!prior:String(prior)+'-foreign';check(bad);
  }
};
for(const s of all){
  reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
  reject({...api.catalog,structures:[...api.catalog.structures,s]});
  reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
  mutateLeaves(s,bad=>reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?bad:x)}));
  for(const bad of [{...s,unexpected:true},(()=>{const c=structuredClone(s);delete c.sources;return c;})(),{...s,sources:[...s.sources,s.sources[0]]}])
    reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?bad:x)});
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
for(const mutate of [t=>t.steps.reverse(),t=>{t.steps[0].frameIds=[];},t=>{t.steps[0].frameIds=[t.steps[0].selectedId];},
  t=>{t.steps[0].frameIds.push(t.steps[0].selectedId);},t=>{t.steps[0].references=[];},
  t=>{t.contextIds=[];},t=>{delete t.requiredDisplayBundles;},t=>{t.unexpected=true;}]){
  const bad=structuredClone(tour);mutate(bad);reject(api.catalog,bad);
}
if(sourceOnly){console.log(JSON.stringify({mode:'source-only',targets:4,context:4,bundles:pins.bundles.length,sourceRefusals,existingQuickChecks:4}));process.exit(0);}

const before=await load('previous');
assert.equal(before.regionalTours.length,44);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),261);
assert.equal(api.regionalTours.length,45);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),265);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('thorax').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),resolved);
const frames=api.regionalTourStepFrames(api.catalog,tour);assert.equal(frames.length,4);
assert.deepEqual(frames[0],frames[1]);assert.deepEqual(frames[2],frames[3]);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=all.find(s=>s.id===id);assert(s);
  assert(s.bounds.min.every((v,a)=>v>=frames[i].min[a]&&s.bounds.max[a]<=frames[i].max[a]));
}
for(const s of all)assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,steps:[...tour.steps].reverse()}));
let changed=0,unchanged=0,topics=0,packetRefusals=0;
const selectedIds=new Set(allIds);
assert.equal(api.catalog.structures.length,1104);
for(const s of api.catalog.structures){
  const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
  assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;
  assert.equal(now.approval,false);assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
  if(!selectedIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
  changed++;assert.notEqual(now.fingerprints.teaching,prior.fingerprints.teaching);
  assert(await api.parseBodyReviewResponse(now,s.id));assert.equal(await api.parseBodyReviewResponse(prior,s.id),null);
  assert.deepEqual(now.reviewerNotes.evidence,[]);
  const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];assert(at>=0);
  assert.deepEqual(evidence.structures,resolved);assert.deepEqual(evidence.stepFrames,frames);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  for(const mutate of [p=>p.guidedTours[at].tour.steps.reverse(),p=>{p.guidedTours[at].tour.steps[0].caption+=' altered';},
    p=>{p.guidedTours[at].tour.steps[0].frameIds=[];},p=>{p.guidedTours[at].tour.steps[0].references=['https://example.invalid'];},
    p=>{p.guidedTours[at].tour.contextIds=[];},p=>{p.guidedTours[at].tour.revision+=' altered';},
    p=>{p.guidedTours[at].transitionMs=0;},p=>{p.guidedTours[at].separation=1;},
    p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},p=>{p.guidedTours[at].bundles[0].sha256='foreign';},
    p=>p.guidedTours.splice(at,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){
    const altered=structuredClone(now);mutate(altered);assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
  }
}
assert.equal(changed,8);assert.equal(unchanged,1096);assert.equal(topics,9936);
console.log(JSON.stringify({tours:45,stops:265,preservedTours:44,sourceRefusals,packetRefusals,changed,unchanged,unchangedTopics:topics,existingQuickChecks:4,clinicalApproval:false}));
