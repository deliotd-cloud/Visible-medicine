import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';
const compile=async contents=>{const r=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-context';export * from './lib/body-review-response';export * from './lib/body-review-decisions';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const oldParser=await compile(execFileSync('git',['show','6b1539f:lib/body-review-response.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=v=>createHash('sha256').update(canonical(JSON.parse(JSON.stringify(v)))).digest('hex');
const selected=api.regionalTourStructures(api.catalog,api.thoraxTour);
assert.equal(selected.length,8);assert.equal(api.thoraxTour.steps.length,6);
const cervical=api.regionalTourStructures(api.catalog,api.cervicalSpineTour);
assert.equal(cervical.length,8);assert.equal(api.cervicalSpineTour.steps.length,5);
assert.equal(new Set(cervical.map(s=>s.bundle)).size,1);
assert.equal(api.regionalTourFor('spine').id,api.cervicalSpineTour.id);
assert.equal(api.regionalTourFor('head-neck'),null,'Do not silently duplicate a spine tour in another regional scope');
const oldTours=await compile(execFileSync('git',['show','2d2f2b8:lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
assert.deepEqual(api.regionalTourEvidence(api.catalog,selected[0].id),oldTours.regionalTourEvidence(api.catalog,selected[0].id),'Existing thorax evidence unchanged');
let checked=0;
for(const s of api.catalog.structures){
 const m=await api.bodyReviewMaterial(s.id),c=await api.bodyReviewContext(s.id);
 assert(api.parseBodyReviewResponse(m,s.id));
 assert.equal(oldParser.parseBodyReviewResponse(m,s.id),null,'Old UI cannot silently omit guided review');
 const scope={schema:'vm-body-review-worksheet-2',kind:m.kind,structureId:s.id};
 const previous=digest({scope,topics:m.topics,reasoning:m.reasoning});
 const tours=api.regionalTours.filter(t=>[...t.contextIds,...t.steps.map(step=>step.selectedId)].includes(s.id));
 if(tours.length){
  assert.equal(m.guidedTours.length,1);assert.notEqual(m.fingerprints.teaching,previous);
  assert(c.checklists.teaching.some(v=>v.id==='guided-tour'));
  assert.equal(m.guidedTours[0].structures.length,8);
  assert.equal(m.guidedTours[0].tour.steps.length,tours[0].steps.length);checked++;
 }else{assert.equal(m.guidedTours.length,0);assert.equal(m.fingerprints.teaching,previous,'Unrelated teaching history retained');assert(!c.checklists.teaching.some(v=>v.id==='guided-tour'));}
 assert.equal(c.revisions.imaging,null);
}
assert.equal(checked,16);
const sample=await api.bodyReviewMaterial(selected[0].id);
for(const mutate of [p=>delete p.guidedTours,p=>p.guidedTours=[],p=>p.guidedTours.push(structuredClone(p.guidedTours[0])),p=>p.schema='vm-body-review-worksheet-2',p=>p.guidedTours[0].tour.steps[0].references=['javascript:alert(1)'],p=>p.guidedTours[0].tour.steps[0].selectedId='missing',p=>p.guidedTours[0].structures[0].sources[0].sha256='0'.repeat(64),p=>p.guidedTours[0].transitionMs=0,p=>p.guidedTours[0].tour.steps[0].durationMs=-1]){
 const p=structuredClone(sample);mutate(p);assert.equal(api.parseBodyReviewResponse(p,selected[0].id),null);
}
const ev=api.regionalTourEvidence(api.catalog,selected[0].id);ev[0].tour.steps[0].caption='changed';assert.notEqual(api.thoraxTour.steps[0].caption,'changed');
for(const s of selected) {const missing={...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)};assert.throws(()=>api.regionalTourStructures(missing,api.thoraxTour));}
for(const s of cervical) {const missing={...api.catalog,structures:api.catalog.structures.filter(v=>v.id!==s.id)};assert.throws(()=>api.regionalTourStructures(missing,api.cervicalSpineTour));}
const spinePacket=await api.bodyReviewMaterial(cervical[0].id);
for(const mutate of [p=>p.guidedTours[0].tour.limitations='Approved',p=>p.guidedTours[0].limitations='Approved',p=>p.guidedTours[0].tour.contextIds=[],p=>p.guidedTours[0].tour.steps.reverse()]){
 const p=structuredClone(spinePacket);mutate(p);assert.equal(api.parseBodyReviewResponse(p,cervical[0].id),null);
}
console.log(JSON.stringify({reviewed:api.catalog.structures.length,tourBound:checked,otherTeachingUnchanged:api.catalog.structures.length-checked,priorThoraxEvidenceUnchanged:true,invalidPacketsRejected:13,missingSourcesRejected:16}));
