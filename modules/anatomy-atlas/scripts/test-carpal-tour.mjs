import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='e1aeae3';
const compile=async contents=>{const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const prior=await compile(execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const names=['scaphoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate'];
const ids=names.map(n=>'vm:anatomy:body:hand:right:bone:right-'+n),tour=api.carpalTour;
assert.equal(tour.id,'right-carpal-row-orientation');assert.equal(tour.revision,tour.id+'-v1');
assert.equal(tour.region,'hand');assert.equal(tour.status,'draft');assert.deepEqual(tour.contextIds,[]);
assert.deepEqual(tour.steps.map(s=>s.selectedId),ids);assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map(id=>[id,'hand-skeleton'])));
assert.deepEqual(tour.steps.map(s=>s.view),['posterior','posterior','posterior','anterior','anterior','posterior','posterior','anterior']);
assert.equal(api.regionalToursFor('hand').length,2);assert.equal(api.regionalTourFor('hand').id,api.handTour.id);
assert.equal(api.regionalTours.length,19);assert.equal(api.regionalTours.reduce((n,t)=>n+t.steps.length,0),105);
assert.equal(new Set(api.regionalTours.flatMap(t=>api.regionalTourStructures(api.catalog,t).map(s=>s.id))).size,130);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),prior.regionalTours,'All eighteen preceding definitions are preserved');
for(const structure of api.catalog.structures)assert.deepEqual(api.regionalTourEvidence(api.catalog,structure.id).filter(e=>e.tour.id!==tour.id),prior.regionalTourEvidence(api.catalog,structure.id),'All preceding per-structure evidence is preserved');
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected.map(s=>s.id),ids);
assert.deepEqual(selected.map(s=>s.fmaId),['FMA24435','FMA24437','FMA24439','FMA24441','FMA24443','FMA23725','FMA24446','FMA24448']);
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','lib/body-display-catalog.ts','lib/body-catalog-input.ts','lib/abdominal-wall-binding.ts','lib/nested-education-binding.ts'])assert.deepEqual(readFileSync(path),execFileSync('git',['show',baseline+':'+path],{maxBuffer:8e6}),`Source/binding preserved: ${path}`);
const bundle=api.catalog.bundles.find(b=>b.id==='hand-skeleton'),path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
const hash='5f61ad363b757aa0cfcf0d7be4bcedcf63cbfec9ff5728cace9d62aa0447eac1';
assert.equal(bundle.sha256,hash);assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);assert.equal(bytes.length,bundle.bytes);
assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+path],{maxBuffer:4e6}));
for(const bundles of [api.catalog.bundles.filter(b=>b.id!==bundle.id),[...api.catalog.bundles,bundle]])assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));
let rejectedSources=0,rejectedPackets=0;
for(const s of selected){
 assert.equal(s.laterality,'right');assert.equal(s.bundle,'hand-skeleton');assert.equal(s.validation.anatomicalReview,false);
 for(const structures of [api.catalog.structures.filter(x=>x.id!==s.id),[...api.catalog.structures,s],api.catalog.structures.map(x=>x.id===s.id?{...x,regions:['foot']}:x),api.catalog.structures.map(x=>x.id===s.id?{...x,bundle:'foot-skeleton'}:x)]){
  assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));rejectedSources++;
 }
 const packet=await api.bodyReviewMaterial(s.id),evidence=api.regionalTourEvidence(api.catalog,s.id);
 assert.equal(packet.approval,false);assert(api.parseBodyReviewResponse(packet,s.id));assert.deepEqual(packet.guidedTours,evidence);
 const index=packet.guidedTours.findIndex(e=>e.tour.id===tour.id),added=evidence.find(e=>e.tour.id===tour.id);
 assert.deepEqual(added.tour,tour);assert.deepEqual(added.structures,selected);assert.equal(added.stepFrames.length,8);
 assert.equal(added.transitionMs,1800);assert.equal(added.transition,'quintic-orbit');assert.equal(added.separation,0);
 for(const mutate of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[index])),p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.revision+='-stale',p=>p.guidedTours[index].tour.steps[0].caption+=' changed',p=>p.guidedTours[index].tour.requiredDisplayBundles={},p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),p=>p.guidedTours[index].stepFrames[0].min[0]-=1,p=>p.guidedTours[index].transition='linear']){
  const changed=structuredClone(packet);mutate(changed);assert.equal(api.parseBodyReviewResponse(changed,s.id),null);rejectedPackets++;
 }
}
for(const [i,step]of tour.steps.entries()){
 assert.deepEqual(step.frameIds,ids,'All eight wrist bones keep a stable assembled frame');assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);
 assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html']);
 assert.deepEqual(api.regionalTourFrame(api.catalog,tour,i),api.regionalTourFrame(api.catalog,tour));
 for(const frameIds of [[],['missing'],[ids[0],ids[0]],[ids[(i+1)%8]]]){const changed=structuredClone(tour);changed.steps[i].frameIds=frameIds;assert.throws(()=>api.regionalTourFrame(api.catalog,changed,i));}
}
const referenceWords=tour.steps.map(s=>s.title+' '+s.caption).join(' ').split(/\s+/).length;
assert(referenceWords<=200,'Titles and captions remain within the sole source word budget');
assert.match(tour.limitations,/revision-bound radiologist review/);assert.match(tour.limitations,/not separately segmented/);
console.log(JSON.stringify({tour:tour.id,targets:8,priorToursUnchanged:18,tours:19,stops:105,tourBound:130,unchangedModelHashes:1,rejectedSources,rejectedPackets,clinicalApproval:false}));
