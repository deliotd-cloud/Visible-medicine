import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline='b9269c83867fbcae73e0de19ae6ca818fefb713a';
const revision='portal-hepatic-venous-relationships-20261014-r1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=path=>execFileSync('git',['show',baseline+':'+path],{maxBuffer:64e6,windowsHide:true});
const pins=JSON.parse(readFileSync('content/portal-hepatic-tour-pins.json'));
assert.equal(pins.baseline,baseline);assert.equal(pins.tourRevision,revision);
assert.equal(sha(JSON.stringify(pins)),'7429d92e7eadb56a81f75759371fb0678cb7936998b37f203b9350ecbe35b261');
const sourceOnly=process.argv.includes('--source-only');
assert.deepEqual(process.argv.slice(2),sourceOnly?['--source-only']:[]);

async function load(mode='current'){
  if(mode==='previous')return exactSourceHistoryApi(baseline,'regional-tour-security');
  const contents=(mode==='source'
    ?"export * from './lib/portal-hepatic-tour';"
    :"export * from './lib/regional-tours';export {portalHepaticTourMatches} from './lib/portal-hepatic-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-decisions';export * from './lib/body-review-api';")+
    "import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const api=await load(sourceOnly?'source':'current'),tour=api.portalHepaticTour;
const targets=pins.entries,context=pins.contextEntries,all=[...targets,...context],ids=targets.map(s=>s.id);
assert.deepEqual(targets.map(s=>s.fmaId),['FMA14332','FMA14331','FMA15391','FMA50735','FMA14338','FMA14340','FMA14339','FMA10951']);
assert.deepEqual(context.map(s=>s.fmaId),['FMA7197','FMA7198','FMA7196']);
assert.equal(new Set(all.map(s=>s.id)).size,11);
assert.deepEqual(pins.bundles.map(b=>b.id).sort(),[
  'abdomen-organs','abdomen-vessels-mesenteric','abdomen-vessels-recovery','hepatic-veins','pancreas-corrected-parent','portal-veins',
].sort());
assert.equal(tour.id,'portal-hepatic-venous-relationships');assert.equal(tour.revision,revision);
assert.equal(tour.region,'abdomen');assert.equal(tour.status,'draft');
assert.deepEqual(tour.contextIds,context.map(s=>s.id));
assert.deepEqual(tour.steps.map(s=>s.selectedId),ids);
assert.deepEqual(tour.steps.map(s=>s.title),targets.map(s=>s.name));
assert.equal(new Set(tour.steps.map(s=>s.id)).size,8);
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','posterior','left','anterior','right','anterior','left','posterior']);
assert.deepEqual(tour.steps.map(s=>s.frameIds),[[0,1,3,9],[0,1,3,9],[1,2,3],[0,1,3,9],[4,5,6],[4,5,6],[4,5,6],[4,5,6,7]].map(group=>group.map(i=>all[i].id)));
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),all.map(s=>s.id).sort());
for(const s of all){
  assert(s.regions.includes('abdomen'));assert.equal(s.validation.anatomicalReview,false);
  assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
}
const anatomy='https://anatomy.ttuhscep.edu/anatomytables/veins_abdomen.html';
const portalVariants='https://pubmed.ncbi.nlm.nih.gov/21986867/';
const hepaticVariants='https://pubmed.ncbi.nlm.nih.gov/21976007/';
for(const [i,step] of tour.steps.entries()){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.references,i===2?[anatomy,portalVariants]:[5,6].includes(i)?[anatomy,hepaticVariants]:[anatomy]);
  assert(step.caption.trim());assert(step.frameIds.includes(step.selectedId));
}
for(const term of [/continuous blood.flow route/i,/microcirculation/i,/sinusoids/i,/disconnected/i,/junction/i,/termination/i,/collecting patterns/i,/flow/i,/patency/i,/pressure/i,/patient.space registration/i,/revision.bound radiologist sign.off/i])assert.match(tour.limitations,term);
assert.equal(api.portalHepaticTourMatches(api.catalog,tour),true);
assert.equal(api.portalHepaticTourMatches(api.catalog,structuredClone(tour)),true);
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert(readFileSync(catalogPath).equals(git(catalogPath)));
for(const bundle of pins.bundles){
  const path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
  assert(bytes.equals(git(path)));
}

let sourceRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.equal(api.portalHepaticTourMatches(catalog,t),false);sourceRefusals++;};
const leaves=(value,path=[])=>value===null||typeof value!=='object'?[path]:Object.entries(value).flatMap(([key,child])=>leaves(child,[...path,key]));
const mutateLeaves=(value,check)=>{for(const path of leaves(value)){
  const bad=structuredClone(value);let node=bad;
  for(const key of path.slice(0,-1))node=node[key];
  const key=path.at(-1),old=node[key];
  node[key]=typeof old==='number'?old+.01:typeof old==='boolean'?!old:String(old)+'-foreign';
  check(bad);
}};
for(const s of all){
  reject({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)});
  reject({...api.catalog,structures:[...api.catalog.structures,s]});
  reject({...api.catalog,structures:[...api.catalog.structures,{...s,id:s.id+'-alias'}]});
  reject({...api.catalog,structures:[...api.catalog.structures,{...s,fmaId:s.fmaId+'-alias'}]});
  mutateLeaves(s,bad=>reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?bad:x)}));
  for(const bad of [{...s,unexpected:true},(()=>{const copy=structuredClone(s);delete copy.sources;return copy;})(),{...s,sources:[...s.sources,s.sources[0]]}])
    reject({...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?bad:x)});
}
for(const bundle of pins.bundles){
  reject({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==bundle.id)});
  reject({...api.catalog,bundles:[...api.catalog.bundles,bundle]});
  for(const key of ['id','url','sha256'])reject({...api.catalog,bundles:[...api.catalog.bundles,{...bundle,[key]:bundle[key]+'-alias'}]});
  mutateLeaves(bundle,bad=>reject({...api.catalog,bundles:api.catalog.bundles.map(x=>x.id===bundle.id?bad:x)}));
}
for(const patch of [{license:'foreign'},{sourceVersion:'foreign'},{coordinateSystem:{}}])reject({...api.catalog,...patch});
mutateLeaves(api.catalog.coordinateSystem,bad=>reject({...api.catalog,coordinateSystem:bad}));
mutateLeaves(tour,bad=>reject(api.catalog,bad));
for(const change of [t=>t.steps.reverse(),t=>t.steps[0].frameIds.reverse(),t=>{t.contextIds=[];},t=>{delete t.requiredDisplayBundles;},t=>{t.unexpected=true;}]){
  const bad=structuredClone(tour);change(bad);reject(api.catalog,bad);
}
if(sourceOnly){console.log(JSON.stringify({mode:'source-only',targets:8,context:3,bundles:6,sourceRefusals}));process.exit(0);}

const before=await load('previous');
assert.equal(before.regionalTours.length,47);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),282);
assert.equal(api.regionalTours.length,48);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),290);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('abdomen').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),[...context,...targets]);
const frames=api.regionalTourStepFrames(api.catalog,tour);assert.equal(frames.length,8);
assert.deepEqual(frames[0],frames[1]);assert.deepEqual(frames[0],frames[3]);
assert.deepEqual(frames[4],frames[5]);assert.deepEqual(frames[4],frames[6]);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=all.find(item=>item.id===id);assert(s);
  assert(s.bounds.min.every((v,axis)=>v>=frames[i].min[axis]&&s.bounds.max[axis]<=frames[i].max[axis]));
}
for(const s of all)assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,steps:[...tour.steps].reverse()}));
const discoverySource=readFileSync('app/whole-body-guided-learning.tsx','utf8');
assert.match(discoverySource,/regionalTours\.filter\(t=>t\.region===region\)/);
assert.match(discoverySource,/steps\.map\(step=>step\.title\)/);

let changed=0,unchanged=0,topics=0,packetRefusals=0,staleRefusals=0,forgedSaves=0,forgedApprovals=0,storageCalls=0;
const participantIds=new Set(all.map(s=>s.id));assert.equal(api.catalog.structures.length,1104);
for(const s of api.catalog.structures){
  const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
  assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);
  assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;
  assert.equal(now.approval,false);
  assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
  if(!participantIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
  changed++;assert.notEqual(now.fingerprints.teaching,prior.fingerprints.teaching);
  assert.deepEqual(now.reviewerNotes.evidence,[]);
  assert(await api.parseBodyReviewResponse(now,s.id));assert.equal(await api.parseBodyReviewResponse(prior,s.id),null);
  const at=now.guidedTours.findIndex(g=>g.tour.id===tour.id),evidence=now.guidedTours[at];assert(at>=0);
  assert.deepEqual(evidence.tour,tour);assert.deepEqual(evidence.structures,[...context,...targets]);
  assert.deepEqual(evidence.stepFrames,frames);assert.deepEqual(evidence.bundles,pins.bundles);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  const oldContext=await before.bodyReviewContext(s.id),reviewContext=await api.bodyReviewContext(s.id);
  assert.equal(reviewContext.sourceHash,oldContext.sourceHash);
  assert.notEqual(reviewContext.revisions.teaching,oldContext.revisions.teaching);
  const decision={catalogScope:reviewContext.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,
    materialHash:reviewContext.materialHash,revisionHash:reviewContext.revisions.teaching,
    checklistVersion:reviewContext.checklistVersion,draft:api.blankBodyReview(reviewContext,'teaching')};
  const save=input=>api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{
    method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json',
      'oai-authenticated-user-id':'SYNTHETIC_PORTAL_HEPATIC_TOUR'},body:JSON.stringify(input),
  }),{prepare(){storageCalls++;throw Error('Invalid review reached storage');}});
  for(const hashes of [
    {materialHash:oldContext.materialHash,revisionHash:oldContext.revisions.teaching},
    {materialHash:oldContext.materialHash},{revisionHash:oldContext.revisions.teaching},
  ]){assert.equal((await save({...decision,...hashes})).status,409);staleRefusals++;}
  const forged=structuredClone(decision);forged.draft.checks.foreign=true;
  assert.equal((await save(forged)).status,422);forgedSaves++;
  const approved=structuredClone(decision);approved.draft.status='approved';
  assert.equal((await save(approved)).status,422);forgedApprovals++;
  for(const change of [p=>p.guidedTours[at].tour.steps.reverse(),p=>{p.guidedTours[at].tour.steps[0].caption+=' altered';},
    p=>{p.guidedTours[at].tour.steps[0].frameIds=[];},p=>{p.guidedTours[at].tour.steps[0].references=['https://example.invalid'];},
    p=>{p.guidedTours[at].tour.revision+=' altered';},p=>{p.guidedTours[at].transitionMs=0;},
    p=>{p.guidedTours[at].transition='linear';},p=>{p.guidedTours[at].separation=1;},
    p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},
    p=>p.guidedTours[at].structures.reverse(),p=>{p.guidedTours[at].bundles[0].sha256='foreign';},
    p=>p.guidedTours[at].bundles.reverse(),p=>p.guidedTours.splice(at,1),
    p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){
    const altered=structuredClone(now);change(altered);
    assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
  }
}
assert.equal(changed,11);assert.equal(unchanged,1093);assert.equal(topics,9936);
assert.deepEqual([staleRefusals,forgedSaves,forgedApprovals,storageCalls],[33,11,11,0]);
console.log(JSON.stringify({tours:48,stops:290,preservedTours:47,sourceRefusals,packetRefusals,staleRefusals,forgedSaves,forgedApprovals,storageCalls,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
