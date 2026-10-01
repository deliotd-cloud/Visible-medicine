import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const baseline='9231f5631b91b5fe3066a2c58a924a4cc8f7b582';
const compile=async contents=>{const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const prior=await compile(execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const ids=['right:organ:right-kidney','right:vessel:right-renal-artery','left:organ:left-kidney','left:vessel:left-renal-artery'].map(n=>'vm:anatomy:body:abdomen:'+n);
const aorta='vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta',tour=api.renalTour;
assert.equal(tour.id,'renal-organs-arteries-orientation');assert.equal(tour.revision,tour.id+'-v1');
assert.equal(tour.region,'abdomen');assert.equal(tour.status,'draft');assert.deepEqual(tour.contextIds,[aorta]);
assert.deepEqual(tour.steps.map(s=>s.selectedId),ids);assert.deepEqual(tour.steps.map(s=>s.view),['posterior','anterior','posterior','anterior']);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries([aorta,...ids].map(id=>[id,id.includes(':organ:')?'abdomen-organs':'abdomen-vessels-recovery'])));
assert.equal(api.regionalToursFor('abdomen').length,2);assert.equal(api.regionalTourFor('abdomen').id,api.celiacTour.id);
const historicalTours=api.regionalTours.filter(t=>t.id!==api.tarsalTour.id&&t.id!==api.lowerLimbBoneTour.id);
assert.equal(historicalTours.length,20);assert.equal(historicalTours.reduce((n,t)=>n+t.steps.length,0),109);
assert.equal(new Set(historicalTours.flatMap(t=>api.regionalTourStructures(api.catalog,t).map(s=>s.id))).size,134);
assert.deepEqual(historicalTours.filter(t=>t.id!==tour.id),prior.regionalTours,'All nineteen preceding definitions preserved');
for(const s of api.catalog.structures)assert.deepEqual(api.regionalTourEvidence(api.catalog,s.id).filter(e=>e.tour.id!==tour.id&&e.tour.id!==api.tarsalTour.id&&e.tour.id!==api.lowerLimbBoneTour.id),prior.regionalTourEvidence(api.catalog,s.id),'All prior per-structure evidence preserved');
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected.map(s=>s.id),[aorta,...ids]);
assert.deepEqual(selected.map(s=>s.fmaId),['FMA3789','FMA7204','FMA14752','FMA7205','FMA14753']);
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/models'],{encoding:'utf8'}).trim(),'','No displayed model changed');
for(const path of ['public/models/bodyparts3d/full-body/catalog.json','lib/body-display-catalog.ts','lib/body-catalog-input.ts','lib/abdominal-wall-binding.ts','lib/nested-education-binding.ts'])assert.deepEqual(readFileSync(path),execFileSync('git',['show',baseline+':'+path],{maxBuffer:8e6}),`Unchanged source binding ${path}`);
for(const name of ['abdomen-organs','abdomen-vessels-recovery']){
 const bundle=api.catalog.bundles.find(b=>b.id===name),path='public'+bundle.url.split('?')[0],bytes=readFileSync(path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);assert.equal(bytes.length,bundle.bytes);
 assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+path],{maxBuffer:16e6}));
 for(const bundles of [api.catalog.bundles.filter(b=>b.id!==name),[...api.catalog.bundles,bundle]])assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));
}
let rejectedSources=0,rejectedPackets=0;
for(const s of selected){
 assert.equal(s.validation.anatomicalReview,false);
 for(const structures of [api.catalog.structures.filter(x=>x.id!==s.id),[...api.catalog.structures,s],api.catalog.structures.map(x=>x.id===s.id?{...x,regions:['foot']}:x),api.catalog.structures.map(x=>x.id===s.id?{...x,bundle:'foot-skeleton'}:x)]){assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));rejectedSources++;}
 const packet=await api.bodyReviewMaterial(s.id),evidence=api.regionalTourEvidence(api.catalog,s.id);
 assert.equal(packet.approval,false);assert((await api.parseBodyReviewResponse(packet,s.id)));assert.deepEqual(packet.guidedTours,evidence);
 const index=packet.guidedTours.findIndex(e=>e.tour.id===tour.id),added=evidence[index];
 assert(index>=0);assert.deepEqual(added.tour,tour);assert.deepEqual(added.structures,selected);
 assert.equal(added.stepFrames.length,4);assert.equal(added.transitionMs,1800);assert.equal(added.transition,'quintic-orbit');assert.equal(added.separation,0);
 for(const mutate of [p=>p.guidedTours.splice(index,1),p=>p.guidedTours.push(structuredClone(p.guidedTours[index])),p=>p.guidedTours[index].tour.steps.reverse(),p=>p.guidedTours[index].tour.revision+='-stale',p=>p.guidedTours[index].tour.steps[0].caption+=' changed',p=>p.guidedTours[index].tour.requiredDisplayBundles={},p=>p.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),p=>p.guidedTours[index].stepFrames[0].min[0]-=1,p=>p.guidedTours[index].transition='linear']){const changed=structuredClone(packet);mutate(changed);assert.equal((await api.parseBodyReviewResponse(changed,s.id)),null);rejectedPackets++;}
 if(s.id===aorta)assert.deepEqual(packet.guidedTours.filter(e=>e.tour.id!==tour.id),prior.regionalTourEvidence(api.catalog,s.id),'Aorta keeps exact prior coeliac tour');
}
for(const [i,step]of tour.steps.entries()){
 assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert.deepEqual(step.frameIds,ids);
 assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/gastrointestinal_system/kidney_tables.html']);
 assert.deepEqual(api.regionalTourFrame(api.catalog,tour,i),api.regionalTourFrame(api.catalog,tour));
 for(const frameIds of [[],['missing'],[ids[0],ids[0]],[aorta]]){const changed=structuredClone(tour);changed.steps[i].frameIds=frameIds;assert.throws(()=>api.regionalTourFrame(api.catalog,changed,i));}
}
const referenceWords=tour.steps.map(s=>s.title+' '+s.caption).join(' ').split(/\s+/).length;
assert(referenceWords<=200);assert.match(tour.limitations,/revision-bound radiologist review/);assert.match(tour.limitations,/HRA kidney specimen is not fused/);
console.log(JSON.stringify({tour:tour.id,targets:4,contexts:1,priorToursUnchanged:19,tours:20,stops:109,tourBound:134,unchangedModelHashes:2,rejectedSources,rejectedPackets,referenceWords,clinicalApproval:false}));
