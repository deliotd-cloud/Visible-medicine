import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
import {exactSourceHistoryApi} from './exact-source-history-api.mjs';

const baseline='a70b6f640c5511330f250882f525b63a4a21117b';
const revision='right-elbow-arterial-pairs-20261012-r1';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=path=>execFileSync('git',['show',baseline+':'+path],{maxBuffer:64e6,windowsHide:true});
const pins=JSON.parse(readFileSync('content/elbow-arterial-tour-pins.json'));
assert.equal(pins.baseline,baseline);assert.equal(pins.tourRevision,revision);
assert.equal(sha(JSON.stringify(pins)),'d61979a48cee12daf0dfd3468b5683a788ff914cc83a36bd91c1ea776415ade7');
const sourceOnly=process.argv.includes('--source-only');
assert.deepEqual(process.argv.slice(2),sourceOnly?['--source-only']:[]);

async function load(mode='current'){
  // Replay every application import from Git, not just the old registry against
  // today's lessons. This independently proves the complete admission transition.
  if(mode==='previous')return exactSourceHistoryApi(baseline,'regional-tour-security');
  const contents=(mode==='source'
    ?"export * from './lib/elbow-arterial-tour';"
    :"export * from './lib/regional-tours';export {elbowArterialTourMatches} from './lib/elbow-arterial-tour';export * from './lib/body-review-material';export * from './lib/body-review-response';export * from './lib/body-review-context';export * from './lib/body-review-decisions';export * from './lib/body-review-api';")+
    "import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);";
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const api=await load(sourceOnly?'source':'current'),tour=api.elbowArterialTour;
const targets=pins.entries,context=pins.contextEntries,all=[...targets,...context];
const fmas=['FMA22712','FMA22801','FMA22707','FMA22804','FMA23126','FMA22764','FMA23124','FMA268667'];
const ids=[
  'vm:anatomy:body:shoulder-arm:right:vessel:right-inferior-ulnar-collateral-artery',
  'vm:anatomy:body:forearm:right:vessel:right-anterior-ulnar-recurrent-artery',
  'vm:anatomy:body:shoulder-arm:right:vessel:right-superior-ulnar-collateral-artery',
  'vm:anatomy:body:forearm:right:vessel:right-posterior-ulnar-recurrent-artery',
  'vm:anatomy:body:shoulder-arm:right:vessel:radial-collateral-branch-of-right-deep-brachial-artery',
  'vm:anatomy:body:forearm:right:vessel:right-radial-recurrent-artery',
  'vm:anatomy:body:shoulder-arm:right:vessel:middle-collateral-branch-of-right-deep-brachial-artery',
  'vm:anatomy:body:forearm:right:vessel:right-recurrent-interosseous-artery',
];
assert.deepEqual(targets.map(s=>s.fmaId),fmas);assert.deepEqual(targets.map(s=>s.id),ids);
assert.deepEqual(context.map(s=>s.fmaId),['FMA23130','FMA23464','FMA23467']);
assert.deepEqual(context.map(s=>s.id),[
  'vm:anatomy:upper-limb:shoulder:right:bone:humerus',
  'vm:anatomy:body:forearm:right:bone:right-radius',
  'vm:anatomy:body:forearm:right:bone:right-ulna',
]);
assert.deepEqual(pins.bundles.map(b=>b.id).sort(),[
  'elbow-arteries','forearm-skeleton','forearm-vessels-forearm-vascular','shoulder-arm-skeleton',
]);
assert.equal(new Set(all.map(s=>s.id)).size,11);
assert.equal(tour.id,'right-elbow-arterial-pairs');assert.equal(tour.revision,revision);
assert.equal(tour.region,'forearm');assert.equal(tour.status,'draft');
assert.deepEqual(tour.contextIds,context.map(s=>s.id));
assert.deepEqual(tour.steps.map(s=>s.selectedId),ids);
assert.deepEqual(tour.steps.map(s=>s.title),targets.map(s=>s.name));
assert.equal(new Set(tour.steps.map(s=>s.id)).size,8);
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','anterior','posterior','posterior','right','right','posterior','posterior']);
assert.deepEqual(tour.steps.map(s=>s.frameIds),[[0,1],[0,1],[2,3],[2,3],[4,5],[4,5],[6,7],[6,7]].map(pair=>pair.map(i=>ids[i])));
assert.deepEqual(Object.keys(tour.requiredDisplayBundles).sort(),all.map(s=>s.id).sort());
const table='https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html';
const dissection='https://profiles.wustl.edu/en/publications/the-extraosseous-and-intraosseous-arterial-anatomy-of-the-adult-e/';
for(const s of all){
  assert.equal(s.laterality,'right');assert(s.regions.includes('forearm'));
  assert.equal(s.validation.anatomicalReview,false);
  assert.equal(tour.requiredDisplayBundles[s.id],s.bundle);
}
for(const step of tour.steps){
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.references,[table,dissection]);assert(step.caption.trim());
  assert(step.frameIds.includes(step.selectedId));
}
for(const term of [/posterior interosseous/i,/nerve/i,/junction/i,/connected lumen/i,/flow/i,/perfusion/i,/unvalidated/i,/cadaveric anatomy/i,/ultrasound/i,/patient.space registration/i,/revision.bound radiologist sign.off/i])
  assert.match(tour.limitations,term);
assert.equal(api.elbowArterialTourMatches(api.catalog,tour),true);
assert.equal(api.elbowArterialTourMatches(api.catalog,structuredClone(tour)),true);
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert(readFileSync(catalogPath).equals(git(catalogPath)));
for(const bundle of pins.bundles){
  const path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
  assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);
  assert(bytes.equals(git(path)));
}

let sourceRefusals=0;
const reject=(catalog=api.catalog,t=tour)=>{assert.equal(api.elbowArterialTourMatches(catalog,t),false);sourceRefusals++;};
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
if(sourceOnly){console.log(JSON.stringify({mode:'source-only',targets:8,context:3,bundles:4,sourceRefusals}));process.exit(0);}

const before=await load('previous');
assert.equal(before.regionalTours.length,46);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),274);
assert.equal(api.regionalTours.length,47);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),282);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
assert.deepEqual(api.catalog,before.catalog);
assert.deepEqual(api.regionalToursFor('forearm').at(-1),tour);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour),[...context,...targets]);
const frames=api.regionalTourStepFrames(api.catalog,tour);assert.equal(frames.length,8);
for(const pair of [0,2,4,6])assert.deepEqual(frames[pair],frames[pair+1]);
for(const [i,step] of tour.steps.entries())for(const id of step.frameIds){
  const s=targets.find(item=>item.id===id);assert(s);
  assert(s.bounds.min.every((v,axis)=>v>=frames[i].min[axis]&&s.bounds.max[axis]<=frames[i].max[axis]));
}
for(const s of all)assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,steps:[...tour.steps].reverse()}));
const discoverySource=readFileSync('app/whole-body-guided-learning.tsx','utf8');
assert.match(discoverySource,/regionalTours\.filter\(t=>t\.region===region\)/);
assert.match(discoverySource,/steps\.map\(step=>step\.title\)/);
assert.deepEqual(tour.steps.map(step=>step.title),targets.map(s=>s.name));

let changed=0,unchanged=0,topics=0,packetRefusals=0,staleRefusals=0,forgedSaves=0,forgedApprovals=0,storageCalls=0;
const selectedIds=new Set(all.map(s=>s.id));assert.equal(api.catalog.structures.length,1104);
for(const s of api.catalog.structures){
  const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
  assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);
  assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;
  assert.equal(now.approval,false);
  assert.deepEqual(now.guidedTours.filter(g=>g.tour.id!==tour.id),prior.guidedTours);
  if(!selectedIds.has(s.id)){assert.deepEqual(now,prior);unchanged++;continue;}
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
      'oai-authenticated-user-id':'SYNTHETIC_ELBOW_TOUR'},body:JSON.stringify(input),
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
    p=>{p.guidedTours[at].separation=1;},p=>{p.guidedTours[at].structures[0].sources[0].sha256='foreign';},
    p=>{p.guidedTours[at].bundles[0].sha256='foreign';},p=>p.guidedTours.splice(at,1),
    p=>p.guidedTours.push(structuredClone(p.guidedTours[at]))]){
    const altered=structuredClone(now);change(altered);
    assert.equal(await api.parseBodyReviewResponse(altered,s.id),null);packetRefusals++;
  }
}
assert.equal(changed,11);assert.equal(unchanged,1093);assert.equal(topics,9936);
assert.deepEqual([staleRefusals,forgedSaves,forgedApprovals,storageCalls],[33,11,11,0]);
console.log(JSON.stringify({tours:47,stops:282,preservedTours:46,sourceRefusals,packetRefusals,staleRefusals,forgedSaves,forgedApprovals,storageCalls,changed,unchanged,unchangedTopics:topics,clinicalApproval:false}));
