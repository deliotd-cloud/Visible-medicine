import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,relative} from 'node:path';
import {build} from './workspace-test-build.mjs';
const baseline='2413ff790069d5bfa6c2c507d67ebfa2a5b3fe51';
const old=p=>execFileSync('git',['show',baseline+':'+p],{maxBuffer:32e6,windowsHide:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const entry=`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';
export * from './lib/body-review-response';export * from './lib/body-review-decisions';export * from './lib/body-review-api';
import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`;
async function load(previous=false){
 const frozen=new Set(['lib/regional-tours.ts','content/body-renderer-revision.json','content/body-review-display-pins.json']);
 const r=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',
 plugins:previous?[{name:'exact-pre-hand-arterial-tour',setup(b){b.onLoad({filter:/.*/,namespace:'workspace-test'},args=>{
  const path=relative(process.cwd(),args.path).replaceAll('\\','/');if(!frozen.has(path))return;
  return {contents:old(path).toString(),loader:path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)};
 });}}]:[]});
 return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));
}
const api=await load(),before=await load(true),tour=api.handArterialTour;
const ids=['right-superficial-palmar-arterial-arch','right-deep-palmar-arch','right-palmar-metacarpal-artery','right-arteria-princeps-pollicis','right-arteria-radialis-indicis','right-first-common-palmar-digital-artery','medial-proper-palmar-digital-artery-of-right-index-finger'].map(n=>'vm:anatomy:body:hand:right:vessel:'+n);
assert.equal(tour.id,'right-hand-arterial-orientation');assert.equal(tour.revision,tour.id+'-v1');assert.equal(tour.status,'draft');assert.equal(tour.region,'hand');
assert.deepEqual(tour.contextIds,[]);assert.deepEqual(tour.steps.map(s=>s.selectedId),ids);
assert.equal(before.regionalTours.length,26);assert.equal(before.regionalTours.reduce((n,t)=>n+t.steps.length,0),150);
assert.equal(api.regionalTours.length,27);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),157);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),before.regionalTours);
assert.deepEqual(api.regionalToursFor('hand').map(t=>t.id),['right-hand-muscle-orientation','right-carpal-row-orientation',tour.id]);
for(const region of api.catalog.regions)assert.equal(api.regionalTourFor(region.id)?.id,before.regionalTourFor(region.id)?.id);
assert.deepEqual(api.catalog,before.catalog);
assert.equal(api.catalog.structures.length,1104);
const selected=api.regionalTourStructures(api.catalog,tour);assert.deepEqual(selected.map(s=>s.id),ids);
assert.deepEqual(selected.map(s=>s.fmaId),['FMA22835','FMA22839','FMA22864','FMA22905','FMA22777','FMA22856','FMA23050']);
assert(selected.every(s=>s.regions.length===1&&s.regions[0]==='hand'&&s.laterality==='right'&&!s.validation.anatomicalReview));
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(selected.map(s=>[s.id,s.bundle])));
let sourceRefusals=0,packetRefusals=0,stale=0,topics=0,changed=0,unchanged=0;
for(const bundleId of new Set(selected.map(s=>s.bundle))){
 const bundle=api.catalog.bundles.find(b=>b.id===bundleId),path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
 assert.equal(bytes.length,bundle.bytes);assert.equal(sha(bytes),bundle.sha256);assert.deepEqual(bytes,old(path));
 for(const bundles of [api.catalog.bundles.filter(b=>b.id!==bundleId),[...api.catalog.bundles,bundle]]){
  assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));sourceRefusals++;
 }
}
const storage={prepare(){throw Error('Stale synthetic tour decision reached storage');}};
for(const s of api.catalog.structures){
 const now=await api.bodyReviewMaterial(s.id),prior=await before.bodyReviewMaterial(s.id);
 assert.deepEqual(now.source,prior.source);assert.deepEqual(now.topics,prior.topics);assert.deepEqual(now.reasoning,prior.reasoning);topics+=now.topics.length;
 assert.equal(now.approval,false);assert.deepEqual(now.guidedTours.filter(e=>e.tour.id!==tour.id),prior.guidedTours);
 const target=ids.includes(s.id);assert.equal(now.guidedTours.length,prior.guidedTours.length+Number(target));
 const nc=await api.bodyReviewContext(s.id),bc=await before.bodyReviewContext(s.id);
 assert.equal(nc.sourceHash,bc.sourceHash);assert.equal(nc.revisions.imaging,null);
 if(!target){assert.equal(nc.teachingHash,bc.teachingHash);assert.equal(nc.revisions.teaching,bc.revisions.teaching);unchanged++;continue;}
 changed++;assert.equal(prior.guidedTours.length,0);assert.notEqual(nc.teachingHash,bc.teachingHash);assert.notEqual(nc.revisions.teaching,bc.revisions.teaching);
 for(const structures of [api.catalog.structures.filter(x=>x.id!==s.id),[...api.catalog.structures,s],api.catalog.structures.map(x=>x.id===s.id?{...x,regions:['foot']}:x),api.catalog.structures.map(x=>x.id===s.id?{...x,bundle:'foreign'}:x)]){
  assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));sourceRefusals++;
 }
 assert(await api.parseBodyReviewResponse(now,s.id));const index=now.guidedTours.findIndex(e=>e.tour.id===tour.id),evidence=now.guidedTours[index];
 assert.deepEqual(evidence.structures,selected);assert.deepEqual(evidence.tour,tour);
 assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);assert.equal(evidence.stepFrames.length,7);
 for(const mutate of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(evidence)),p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.steps[0].caption+=' altered',p=>p.guidedTours[index].tour.revision+=' stale',p=>p.guidedTours[index].tour.requiredDisplayBundles={},p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),p=>p.guidedTours[index].stepFrames[0].min[0]-=1,p=>p.guidedTours[index].transition='linear',p=>p.guidedTours[index].transitionMs=0,p=>p.guidedTours[index].separation=1]){
  const bad=structuredClone(now);mutate(bad);assert.equal(await api.parseBodyReviewResponse(bad,s.id),null);packetRefusals++;
 }
 const body={catalogScope:nc.catalogScope,structureId:s.id,track:'teaching',expectedVersion:0,materialHash:nc.materialHash,revisionHash:bc.revisions.teaching,checklistVersion:nc.checklistVersion,draft:api.blankBodyReview(nc,'teaching')};
 const response=await api.postBodyDecision(new Request('https://atlas.test/api/body-decisions',{method:'POST',headers:{origin:'https://atlas.test','content-type':'application/json','oai-authenticated-user-id':'SYNTHETIC_HAND_ARTERIAL_TOUR_TEST'},body:JSON.stringify(body)}),storage);
 assert.equal(response.status,409);stale++;
}
assert.deepEqual({topics,changed,unchanged,stale},{topics:9936,changed:7,unchanged:1104-7,stale:7});
for(const [i,step]of tour.steps.entries()){
 assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.references.length&&step.references.includes('https://anatomy.ttuhscep.edu/anatomytables/arteries_upperlimb.html'));
 const frame=api.regionalTourFrame(api.catalog,tour,i);assert.deepEqual(frame,api.regionalTourStepFrames(api.catalog,tour)[i]);
 assert(step.frameIds.includes(step.selectedId));assert.equal(new Set(step.frameIds).size,step.frameIds.length);
 for(const id of step.frameIds){assert(ids.includes(id));const b=selected.find(s=>s.id===id).bounds;assert(b.min.every((v,j)=>v>=frame.min[j]&&b.max[j]<=frame.max[j]));}
 for(const bad of [[],['missing'],[step.selectedId,step.selectedId],[ids.find(id=>id!==step.selectedId)]]){const t=structuredClone(tour);t.steps[i].frameIds=bad;assert.throws(()=>api.regionalTourFrame(api.catalog,t,i));}
}
for(const p of ['app/regional-guided-learning.tsx','app/whole-body-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx','app/body-content.ts','app/anatomy-data.ts','app/dissection-data.ts','lib/body-display-catalog.ts','content/learning-resources.v1.json','package-lock.json','LICENSES/THIRD_PARTY_NOTICES.md'])assert.deepEqual(readFileSync(p),old(p),p);
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/models'],{encoding:'utf8'}).trim(),'');
for(const term of ['historical source label','direct junction','six right and four left','patient images','radiologist sign-off'])assert(tour.limitations.includes(term));
console.log(JSON.stringify({tour:tour.id,tours:27,stops:157,unchangedTopics:topics,changedWorksheets:changed,unchangedWorksheets:unchanged,sourceRefusals,packetRefusals,staleTeachingRefusedBeforeStorage:stale,clinicalApproval:false}));
