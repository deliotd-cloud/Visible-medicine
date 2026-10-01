import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,relative} from 'node:path';
import {build} from './workspace-test-build.mjs';
const base='a10f1fd19c7dcf27470943f4775cb509f7da811f';
const old=path=>execFileSync('git',['show',base+':'+path],{maxBuffer:16e6});
const entry=`export * from './lib/regional-tours';export * from './lib/body-review-material';
export * from './lib/body-review-response';export * from './lib/body-review-context';
export * from './lib/body-review-decisions';export * from './lib/body-review-api';
import raw from './public/models/bodyparts3d/full-body/catalog.json';
import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`;
async function load(previous=false){
 const replay=['lib/regional-tours.ts','content/body-review-display-pins.json','content/body-renderer-revision.json'];
 const result=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
  plugins:previous?[{name:'exact-pelvic-ring-baseline',setup(api){api.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
   const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!replay.includes(path))return;
   return {contents:old(path).toString('utf8'),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
  });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const api=await load(),previous=await load(true),tour=api.pelvicRingTour;
const identities=[
 ['vm:anatomy:body:pelvis:right:bone:right-hip-bone','FMA16586','right','pelvis-skeleton'],
 ['vm:anatomy:body:spine:midline:bone:sacrum','FMA16202','midline','spine-skeleton'],
 ['vm:anatomy:body:pelvis:left:bone:left-hip-bone','FMA16587','left','pelvis-skeleton'],
 ['vm:anatomy:body:thigh:right:bone:right-femur','FMA24474','right','thigh-skeleton'],
 ['vm:anatomy:body:thigh:left:bone:left-femur','FMA24475','left','thigh-skeleton'],
];
assert.equal(tour.id,'pelvic-ring-hip-orientation');assert.equal(tour.region,'pelvis');assert.equal(tour.status,'draft');
assert.equal(tour.revision,tour.id+'-v1');assert.equal(tour.steps.length,6);assert.deepEqual(tour.contextIds,[]);
assert.equal(new Set(tour.steps.map(s=>s.id)).size,6,'Revisited structures still have distinct stop identities');
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),previous.regionalTours,'Every earlier tour unchanged');
assert.equal(api.regionalTours.length,24);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),136);
assert.equal(api.regionalToursFor('pelvis').length,3);assert.equal(api.regionalTourFor('pelvis').id,previous.regionalTourFor('pelvis').id);
assert.deepEqual(api.regionalTourStructures(api.catalog,tour).map(s=>[s.id,s.fmaId,s.laterality,s.bundle]),identities);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','lib/body-display-catalog.ts','lib/body-review-api.ts',
 'lib/body-review-material.ts','lib/body-review-response.ts','app/regional-guided-learning.tsx','app/fitted-camera.tsx','lib/tour-camera.ts'])
 assert.deepEqual(readFileSync(path),old(path),path+' unchanged');
let preserved=0,rejectedSources=0,rejectedPackets=0,stale=0;
for(const s of api.catalog.structures){
 assert.deepEqual(api.regionalTourEvidence(api.catalog,s.id).filter(e=>e.tour.id!==tour.id),previous.regionalTourEvidence(api.catalog,s.id));preserved++;
}
assert.equal(preserved,1104);
for(const bundleId of new Set(identities.map(row=>row[3]))){
 const bundle=api.catalog.bundles.find(b=>b.id===bundleId),path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
 assert.equal(sha(bytes),bundle.sha256);assert.equal(bytes.length,bundle.bytes);assert.deepEqual(bytes,old(path));
 for(const bundles of [api.catalog.bundles.filter(b=>b.id!==bundleId),[...api.catalog.bundles,bundle]])
  assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));
}
const ids=identities.map(row=>row[0]);assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(identities.map(([id,,,bundle])=>[id,bundle])));
const storage={prepare(){throw Error('Stale review reached storage');}};
for(const id of ids){
 const s=api.catalog.structures.find(s=>s.id===id);assert.equal(s.validation.anatomicalReview,false);
 for(const structures of [api.catalog.structures.filter(x=>x.id!==id),[...api.catalog.structures,s],
  api.catalog.structures.map(x=>x.id===id?{...x,regions:['head-neck']}:x),api.catalog.structures.map(x=>x.id===id?{...x,bundle:'head-neck-skeleton'}:x)]){
  assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));rejectedSources++;
 }
 const packet=await api.bodyReviewMaterial(id),prior=await previous.bodyReviewMaterial(id);
 assert.deepEqual(packet.source,prior.source);assert.deepEqual(packet.topics,prior.topics);assert.deepEqual(packet.reasoning,prior.reasoning);
 assert.equal(packet.fingerprints.source,prior.fingerprints.source);assert.notEqual(packet.fingerprints.teaching,prior.fingerprints.teaching);
 assert.equal(packet.approval,false);assert(await api.parseBodyReviewResponse(packet,id));
 const index=packet.guidedTours.findIndex(e=>e.tour.id===tour.id),evidence=packet.guidedTours[index];assert(index>=0);
 assert.deepEqual(evidence.tour,tour);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.transitionMs,1800);assert.equal(evidence.separation,0);
 assert.equal(evidence.stepFrames.length,6);
 for(const mutate of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[index])),
  p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.steps[0].caption+=' changed',
  p=>p.guidedTours[index].tour.revision+='-foreign',p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
  p=>p.guidedTours[index].stepFrames[0].min[0]-=1,p=>p.guidedTours[index].transition='linear',p=>p.guidedTours[index].separation=1]){
  const foreign=structuredClone(packet);mutate(foreign);assert.equal(await api.parseBodyReviewResponse(foreign,id),null);rejectedPackets++;
 }
 const c=await api.bodyReviewContext(id),before=await previous.bodyReviewContext(id);assert.equal(c.sourceHash,before.sourceHash);
 assert.equal(c.revisions.imaging,null);assert.deepEqual(c.blockers,before.blockers);assert.notEqual(c.revisions.teaching,before.revisions.teaching);
 const payload={catalogScope:c.catalogScope,structureId:id,track:'teaching',expectedVersion:0,materialHash:c.materialHash,
  revisionHash:c.revisions.teaching,checklistVersion:c.checklistVersion,draft:api.blankBodyReview(c,'teaching')};
 for(const delta of [{materialHash:before.materialHash},{revisionHash:before.revisions.teaching},{revisionHash:'0'.repeat(64)}]){
  const response=await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',
   headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_PELVIC_TEST'},
   body:JSON.stringify({...payload,...delta})}),storage);assert.equal(response.status,409);stale++;
 }
}
const pinsPath='content/body-review-display-pins.json',before=JSON.parse(old(pinsPath)),after=JSON.parse(readFileSync(pinsPath));
assert.deepEqual({...after,pins:[]},{...before,pins:[]});assert.equal(after.pins.length,before.pins.length);
const priorPins=new Map(before.pins.map(p=>[p.structureId,p.sha256]));assert.deepEqual(after.pins.map(p=>p.structureId),before.pins.map(p=>p.structureId));
assert.deepEqual(after.pins.filter(p=>p.sha256!==priorPins.get(p.structureId)).map(p=>p.structureId).sort(),[...ids].sort());
const ring=[ids[0],ids[2],ids[1]],frames=[ring,ring,[ids[2]],[ids[0]],[ids[0],ids[3]],[ids[2],ids[4]]];
const sourceBounds=ids.map(id=>api.catalog.structures.find(s=>s.id===id).bounds);
assert.deepEqual(api.regionalTourFrame(api.catalog,tour),{
 min:[0,1,2].map(a=>Math.min(...sourceBounds.map(b=>b.min[a]))),
 max:[0,1,2].map(a=>Math.max(...sourceBounds.map(b=>b.max[a]))),
},'Repeated target visits do not duplicate or shrink the overview');
assert.deepEqual(tour.steps.map(s=>s.selectedId),[ids[0],ids[1],ids[2],ids[0],ids[3],ids[4]]);
for(const [i,s]of tour.steps.entries()){
 assert.equal(s.durationMs,16000);assert.equal(s.fadeOthers,true);assert.deepEqual(s.frameIds,frames[i]);
 assert.deepEqual(s.references,['https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html']);
 const frame=api.regionalTourFrame(api.catalog,tour,i);assert(frame.min.every((x,a)=>Number.isFinite(x)&&x<frame.max[a]));
 for(const id of frames[i]){const bounds=api.catalog.structures.find(s=>s.id===id).bounds;assert(bounds.min.every((x,a)=>x>=frame.min[a]&&bounds.max[a]<=frame.max[a]));}
 for(const frameIds of [[],['missing'],[s.selectedId,s.selectedId],[ids.find(id=>id!==s.selectedId)]]){
  const changed=structuredClone(tour);changed.steps[i].frameIds=frameIds;assert.throws(()=>api.regionalTourFrame(api.catalog,changed,i));
 }
}
for(const index of [-1,6,.5,NaN])assert.throws(()=>api.regionalTourFrame(api.catalog,tour,index));
const words=tour.steps.map(s=>s.title+' '+s.caption).join(' ').split(/\s+/).length;assert(words<=200);
assert.match(tour.limitations,/revision-bound radiologist review/);assert.match(tour.limitations,/No fracture/);assert.match(tour.limitations,/patient registration/);
console.log(JSON.stringify({tour:tour.id,steps:6,targets:5,preservedSourceSelections:preserved,priorToursUnchanged:23,
 changedDisplayPins:5,unchangedModelHashes:3,rejectedSources,rejectedPackets,staleRejectedBeforeStorage:stale,referenceWords:words,clinicalApproval:false}));
