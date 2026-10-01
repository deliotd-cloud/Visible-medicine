import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const parent='b65b8c40bd3fb428b2b4688c695039e2e3a3554c';
const compile=async contents=>{const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const api=await compile(`export * from './lib/regional-tours';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const prior=await compile(execFileSync('git',['show',parent+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const tour=api.lumbarTour,ids=tour.steps.map(s=>s.selectedId);
assert.equal(tour.status,'draft');assert.equal(tour.region,'spine');
assert.equal(tour.revision,'lower-lumbar-sacral-orientation-v1');
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id&&t.id!==api.carpalTour.id&&t.id!==api.renalTour.id&&t.id!==api.tarsalTour.id&&t.id!==api.lowerLimbBoneTour.id),prior.regionalTours);
assert.equal(api.regionalToursFor('spine').length,2);
assert.equal(api.regionalTourFor('spine').id,api.cervicalSpineTour.id);
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected.map(s=>s.fmaId),['FMA13075','FMA16036','FMA13076','FMA16037','FMA16202']);
assert.equal(selected.length,5);assert.deepEqual(tour.contextIds,[]);
for(const s of selected){
 assert.equal(s.laterality,'midline');assert.equal(s.validation.anatomicalReview,false);
 assert.equal(s.bundle,tour.requiredDisplayBundles[s.id]);
 for(const changed of [
  {...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},
  {...api.catalog,structures:[...api.catalog.structures,s]},
  {...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,regions:['abdomen']}:x)},
  {...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,bundle:'head-neck-skeleton'}:x)},
 ])assert.throws(()=>api.regionalTourStructures(changed,tour));
 const evidence=api.regionalTourEvidence(api.catalog,s.id);
 assert.deepEqual(evidence.filter(e=>e.tour.id!==tour.id),prior.regionalTourEvidence(api.catalog,s.id));
 const added=evidence.find(e=>e.tour.id===tour.id);
 assert.deepEqual(added.structures,selected);assert.deepEqual(added.tour,tour);
 assert.equal(added.transitionMs,1800);assert.equal(added.transition,'quintic-orbit');assert.equal(added.separation,0);
}
const pins={'spine-skeleton':'bcb3cfadcd92bdf6e9529727aaba34f54b250887d42a3116808ac55e025e7957','spine-connective-gaps':'aae6dc0589fa3dc9ce5ea51ff28520a077290adb5b92fa4570c3cf20b2090e02'};
for(const [id,hash]of Object.entries(pins)){
 const b=api.catalog.bundles.find(b=>b.id===id),path='public'+b.url.split('?')[0],bytes=readFileSync(path);
 assert.equal(b.sha256,hash);assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 assert.deepEqual(bytes,execFileSync('git',['show',parent+':'+path],{maxBuffer:4e6}));
 assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==id)},tour));
}
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','right','posterior','left','anterior']);
for(const [i,s]of tour.steps.entries()){
 assert.equal(s.durationMs,14000);assert.equal(s.fadeOthers,true);assert.equal(s.references.length,1);
 assert.match(s.references[0],/^https:\/\/(anatomy.ttuhscep.edu|medicine.uams.edu)\//);
 const frame=api.regionalTourFrame(api.catalog,tour,i);
 assert(frame.min.every((n,j)=>Number.isFinite(n)&&n<frame.max[j]));
 for(const bad of [[],['missing'],[ids[(i+1)%ids.length]],[s.selectedId,s.selectedId]]){
  const changed=structuredClone(tour);changed.steps[i].frameIds=bad;
  assert.throws(()=>api.regionalTourFrame(api.catalog,changed,i));
 }
}
assert.match(tour.limitations,/patient-level numbering/);assert.match(tour.limitations,/not separately segmented/);
assert.match(tour.limitations,/no clinical approval/);
assert(!tour.steps.some(s=>/L4[–-]L5|L5[–-]S1/.test(s.title+s.caption)));
console.log(JSON.stringify({tour:tour.id,targets:5,unchangedModelHashes:2,priorTours:17,scopedFrames:true,clinicalApproval:false}));
