import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const parent='e1ad6b0c2aa62cb0f719ef666d559ec0bc8c9eed';
const compile=async contents=>{const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64')).catch(e=>{e.stack=e.message;throw e;});};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';export * from './lib/body-source-additions';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const previous=await compile(execFileSync('git',['show',parent+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const tour=api.deepBrainTour,structures=api.regionalTourStructures(api.catalog,tour);
assert.equal(tour.status,'draft');assert.equal(tour.steps.length,6);assert.equal(structures.length,7);
const fmas=['FMA86464','FMA61961','FMA72924','FMA72925','FMA72832','FMA74877'];
assert.deepEqual(tour.steps.map(step=>structures.find(s=>s.id===step.selectedId).fmaId),fmas);
assert.deepEqual(structures.filter(s=>tour.contextIds.includes(s.id)).map(s=>s.fmaId),['FMA72833']);
assert(!structures.some(s=>s.fmaId==='FMA61970'));assert.equal(structures.find(s=>s.fmaId==='FMA74877').sources.length,2);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id&&t.id!==api.subscapularTour.id&&t.id!==api.lumbarTour.id&&t.id!==api.carpalTour.id&&t.id!==api.renalTour.id&&t.id!==api.tarsalTour.id),previous.regionalTours);
const raw=JSON.parse(execFileSync('git',['show',parent+':public/models/bodyparts3d/full-body/catalog.json'],{encoding:'utf8',maxBuffer:8e6}));
for(const s of structures){
 assert.deepEqual(s,raw.structures.find(old=>old.id===s.id),'Exact immutable source identity');
 assert.equal(s.validation.anatomicalReview,false);
 assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:api.catalog.structures.filter(x=>x.id!==s.id)},tour));
 assert.throws(()=>api.regionalTourStructures({...api.catalog,structures:[...api.catalog.structures,s]},tour));
 for(const [field,value] of [['bundle','foreign'],['regions',['abdomen']]]){
  const c=structuredClone(api.catalog);c.structures.find(x=>x.id===s.id)[field]=value;
  assert.throws(()=>api.regionalTourStructures(c,tour));
 }
}
const bundle=api.catalog.bundles.find(b=>b.id==='head-neck-nerves-deep-brain');
assert.deepEqual(bundle,raw.bundles.find(b=>b.id===bundle.id));
const bytes=readFileSync('public'+bundle.url.split('?')[0]);
assert.equal(createHash('sha256').update(bytes).digest('hex'),bundle.sha256);
assert.equal(bytes.length,bundle.bytes);
for(const [i,step] of tour.steps.entries()){
 assert(step.fadeOthers);assert.equal(step.durationMs,16000);
 const frame=api.regionalTourFrame(api.catalog,tour,i);
 assert(frame.min.every((n,a)=>Number.isFinite(n)&&n<frame.max[a]));
 for(const id of step.frameIds){const s=structures.find(x=>x.id===id);assert(s);assert(s.bounds.min.every((n,a)=>n>=frame.min[a]&&s.bounds.max[a]<=frame.max[a]));}
 for(const frameIds of [[],['foreign'],[step.selectedId,step.selectedId]]){const changed=structuredClone(tour);changed.steps[i].frameIds=frameIds;assert.throws(()=>api.regionalTourFrame(api.catalog,changed,i));}
}
for(const i of [-1,6,0.5,NaN])assert.throws(()=>api.regionalTourFrame(api.catalog,tour,i));
const digest=v=>createHash('sha256').update(api.sourceCanonical(JSON.parse(JSON.stringify(v)))).digest('hex');
let changed=0,unchanged=0,rejected=0;
for(const s of api.catalog.structures){
 const packet=await api.bodyReviewMaterial(s.id);
 const scope={schema:'vm-body-review-worksheet-2',kind:packet.kind,structureId:s.id};
 const oldTours=previous.regionalTourEvidence(api.catalog,s.id);
 const oldHash=digest({scope,topics:packet.topics,reasoning:packet.reasoning,...(oldTours.length?{guidedTours:oldTours}:{})});
 if(!structures.some(t=>t.id===s.id)){
  // Compare this historical milestone's evidence without the later, separately
  // tested later sequences; do not carry their new review hashes backwards.
  const historical=packet.guidedTours.filter(e=>e.tour.id!==api.subscapularTour.id&&e.tour.id!==api.lumbarTour.id&&e.tour.id!==api.carpalTour.id&&e.tour.id!==api.renalTour.id&&e.tour.id!==api.tarsalTour.id);
  assert.equal(digest({scope,topics:packet.topics,reasoning:packet.reasoning,...(historical.length?{guidedTours:historical}:{})}),oldHash);
  unchanged++;continue;
 }
 changed++;assert.notEqual(packet.fingerprints.teaching,oldHash);assert.equal(packet.approval,false);assert((await api.parseBodyReviewResponse(packet,s.id)));
 assert.deepEqual(packet.guidedTours.filter(e=>e.tour.id!==tour.id),oldTours);
 for(const mutate of [p=>p.guidedTours=[],p=>p.guidedTours[0].tour.steps.reverse(),p=>p.guidedTours[0].tour.steps[0].caption+=' foreign',p=>p.guidedTours[0].tour.revision+='-foreign',p=>p.guidedTours[0].stepFrames[0].min[0]-=1,p=>p.guidedTours[0].structures[0].sources[0].sha256='0'.repeat(64),p=>p.guidedTours[0].tour.limitations='Approved']){
  const p=structuredClone(packet);mutate(p);assert.equal((await api.parseBodyReviewResponse(p,s.id)),null);rejected++;
 }
}
assert.equal(changed,7);assert.equal(unchanged,1097);
for(const ref of new Set(tour.steps.flatMap(s=>s.references))){
 const words=tour.steps.filter(s=>s.references.includes(ref)).flatMap(s=>[s.title,s.caption]).join(' ').split(/\s+/).length;
 assert(words<=200,'Original factual summaries bounded per reference');
}
console.log(JSON.stringify({steps:6,sourceSelections:7,priorToursUnchanged:15,changedReviewTeaching:changed,unchangedReviewTeaching:unchanged,rejected,sourceBundleVerified:true,clinicalApproval:false}));
