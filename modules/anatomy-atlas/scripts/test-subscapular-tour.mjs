import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const parent='fa745fd955905b8ee75c6a471482aae42ec5b345';
const compile=async contents=>{const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const api=await compile(`export * from './lib/regional-tours';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const prior=await compile(execFileSync('git',['show',parent+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const tour=api.subscapularTour,targets=['axillary','subscapular','circumflex-scapular','thoracodorsal'].map(n=>'vm:anatomy:body:shoulder-arm:right:vessel:right-'+n+'-artery');
const scapula='vm:anatomy:upper-limb:shoulder:right:bone:scapula';
assert.equal(tour.status,'draft');assert.equal(tour.region,'shoulder-arm');assert.equal(tour.revision,'right-subscapular-arterial-relationships-v1');
assert.deepEqual(tour.steps.map(s=>s.selectedId),targets);assert.deepEqual(tour.contextIds,[scapula]);
assert.deepEqual(tour.steps.map(s=>s.view),['anterior','right','posterior','right']);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id&&t.id!==api.lumbarTour.id&&t.id!==api.carpalTour.id&&t.id!==api.renalTour.id&&t.id!==api.tarsalTour.id),prior.regionalTours,'All sixteen preceding tour definitions preserved');
assert.equal(api.regionalToursFor('shoulder-arm').length,2);assert.equal(api.regionalTourFor('shoulder-arm').id,api.upperArmTour.id,'Existing default stays unchanged');
const selected=api.regionalTourStructures(api.catalog,tour);assert.equal(selected.length,5);
assert.deepEqual(selected.filter(s=>targets.includes(s.id)).map(s=>s.fmaId),['FMA22655','FMA22678','FMA23180','FMA66321']);
for(const s of selected){
 assert.equal(s.laterality,'right');assert.equal(s.validation.anatomicalReview,false);
 assert.equal(s.bundle,tour.requiredDisplayBundles[s.id]);
 for(const changed of [
  {...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},
  {...api.catalog,structures:[...api.catalog.structures,s]},
  {...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,regions:['abdomen']}:x)},
  {...api.catalog,structures:api.catalog.structures.map(x=>x.id===s.id?{...x,bundle:'head-neck-skeleton'}:x)},
 ])assert.throws(()=>api.regionalTourStructures(changed,tour));
 const current=api.regionalTourEvidence(api.catalog,s.id),old=prior.regionalTourEvidence(api.catalog,s.id);
 assert.deepEqual(current.filter(e=>e.tour.id!==tour.id),old,'Prior per-structure evidence unchanged');
 const added=current.find(e=>e.tour.id===tour.id);
 assert.deepEqual(added.structures,selected);assert.deepEqual(added.tour,tour);
 assert.equal(added.transitionMs,1800);assert.equal(added.separation,0);assert.equal(added.transition,'quintic-orbit');
}
const pins={'shoulder-arm-vessels-recovery':'2630e1f06ada20094814ee1a5245e9d420627a15869c3b6a3c51763be21da84c','subscapular-arteries':'6e7ccebe78f6a8c89b556e5e1256d755801725590c4625bebd3fecd6d93f04b3','shoulder-arm-skeleton':'f75517af8f2d72d1fd890c20fea3375948addab8eaee42f9217dcfd5754d3649'};
for(const [id,sha]of Object.entries(pins)){
 const b=api.catalog.bundles.find(b=>b.id===id);assert.equal(b.sha256,sha);
 const path='public'+b.url.split('?')[0],bytes=readFileSync(path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);assert.equal(bytes.length,b.bytes);
 const old=execFileSync('git',['show',parent+':'+path],{maxBuffer:4e6});assert.deepEqual(bytes,old);
 assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles:api.catalog.bundles.filter(x=>x.id!==id)},tour));
}
for(const [index,s]of tour.steps.entries()){
 assert.equal(s.durationMs,14000);assert.equal(s.fadeOthers,true);assert.equal(s.references.length,1);
 assert.match(s.references[0],/^https:\/\/medicine.uams.edu\//);
 const frame=api.regionalTourFrame(api.catalog,tour,index);
 assert(frame.min.every((n,i)=>Number.isFinite(n)&&n<frame.max[i]));
 assert(s.frameIds.includes(s.selectedId));
 for(const ids of [[],[scapula],['missing'],[s.selectedId,s.selectedId]]){
  const wrong=structuredClone(tour);wrong.steps[index].frameIds=ids;assert.throws(()=>api.regionalTourFrame(api.catalog,wrong,index));
 }
}
const words=tour.steps.map(s=>s.caption).join(' ').split(/\s+/).length;assert(words<=180);
assert.match(tour.limitations,/not a joined lumen/);assert.match(tour.limitations,/no clinical approval/);
console.log(JSON.stringify({tour:tour.id,targets:4,context:1,unchangedModelHashes:3,previousTours:16,captionWords:words}));
