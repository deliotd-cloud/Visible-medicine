import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from './workspace-test-build.mjs';
const compiled=await build({stdin:{contents:"export * from './lib/body-display-catalog';export {bodyLesson} from './app/body-content';export {centralVesselImagingLesson} from './lib/central-vessel-imaging';export {contentTabs} from './lib/content-types';export {bodyReviewMaterial} from './lib/body-review-material';export * from './lib/study-links';export {practicePool} from './lib/anatomy-practice';export {requestedAnatomyBundles} from './lib/anatomy-load-state';export {abdominalArterialNeighbours,abdominalArterialPlan} from './lib/abdominal-arterial';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const raw=JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json'));
const before=JSON.stringify(raw),display=api.bodyDisplayCatalog(raw),{original,replacement,bundle,originalBundle}=api.celiacDisplayCorrection;
assert.equal(JSON.stringify(raw),before);
assert.equal(display.structures.length,1104);
assert.deepEqual(api.bodyDisplayCatalog(display),display);
assert.deepEqual(display.structures.filter(s=>s.id===original.id),[replacement]);
assert.deepEqual(replacement.sources,original.sources);
assert.deepEqual(replacement.anchor,original.anchor);
assert.deepEqual(replacement.bounds,original.bounds);
assert.deepEqual(replacement.center,original.center);
assert.deepEqual(replacement.validation,original.validation);
assert.deepEqual(replacement.provenance,original.provenance);
for(const t of api.contentTabs)assert.deepEqual(api.bodyLesson(replacement,t),api.bodyLesson(original,t));
for(const t of ['ct','mri','ultrasound'])assert.equal(api.centralVesselImagingLesson(replacement,t)?.readiness,'draft');
let rejected=0;
for(const mutate of [
 c=>c.structures.find(s=>s.id===original.id).sources.pop(),
 c=>c.structures.find(s=>s.id===original.id).anchor[0]+=.01,
 c=>c.structures.push(structuredClone(original)),
 c=>c.bundles.find(b=>b.id===originalBundle.id).sha256='0'.repeat(64),
 c=>c.bundles.push(structuredClone(bundle)),
 c=>c.coordinateSystem.sourceToSceneColumnMajor[0]+=.001,
 c=>c.sourceVersion='foreign',
]) {const bad=structuredClone(raw);mutate(bad);assert.throws(()=>api.bodyDisplayCatalog(bad));rejected++;}
for(const mutate of [
 c=>c.bundles=c.bundles.filter(b=>b.id!==bundle.id),
 c=>c.bundles.find(b=>b.id===bundle.id).sha256='0'.repeat(64),
 c=>c.structures.find(s=>s.id===original.id).sources[0].sha256='0'.repeat(64),
]) {const bad=structuredClone(display);mutate(bad);assert.throws(()=>api.bodyDisplayCatalog(bad));rejected++;}
for(const mutate of [s=>s.bundle='foreign',s=>s.anchor[0]+=.001,s=>s.sources.reverse(),s=>s.sources[0].sha256='0'.repeat(64),s=>s.nodeName+='foreign',s=>s.validation.anatomicalReview=true]) {
 const bad=structuredClone(replacement);mutate(bad);
 assert.deepEqual(api.celiacTeachingIdentity(bad),bad);
 for(const t of ['ct','mri','ultrasound'])assert.equal(api.centralVesselImagingLesson(bad,t),undefined);
 rejected++;
}
const link=api.makeStudyLink(display,'abdomen',replacement.id,'both');
assert(link);
const params=Object.fromEntries(new URL(link,'https://example.invalid').searchParams);
assert.equal(params.source,bundle.sha256);
assert.equal(api.resolveStudyLink(display,'abdomen',api.parseStudyLink(params)).status,'ready');
assert.deepEqual(api.resolveStudyLink(display,'abdomen',api.parseStudyLink({...params,source:originalBundle.sha256})),{status:'rejected',reason:'source-changed'});
assert.deepEqual(api.practicePool([replacement],[originalBundle.id]),[]);
assert.deepEqual(api.practicePool([replacement],[bundle.id]).map(s=>s.id),[replacement.id]);
const systems={skeleton:true,muscles:true,organs:true,nerves:true,vessels:true,connective:true};
assert.deepEqual(api.requestedAnatomyBundles([replacement],systems,[],false),[bundle.id]);
assert.deepEqual(api.requestedAnatomyBundles([replacement],systems,[replacement.id],false),[]);
const packet=await api.bodyReviewMaterial(replacement.id);
assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
assert.equal(packet.source.bundle.sha256,bundle.sha256);
assert.notEqual(packet.source.bundle.sha256,originalBundle.sha256);
assert.deepEqual(packet.source.structure.sources,original.sources);
const related=api.abdominalArterialNeighbours(display,'abdomen','both',replacement.id);
assert(related && related.rows.length>0);
assert.deepEqual(related.selected,replacement);
assert(api.abdominalArterialPlan(display,'abdomen','both',replacement.id));
assert.deepEqual(api.abdominalArterialNeighbours(raw,'abdomen','both',replacement.id),related);
for(const mutate of [
 d=>d.bundles.find(b=>b.id===bundle.id).sha256='0'.repeat(64),
 d=>d.bundles=d.bundles.filter(b=>b.id!==bundle.id),
 d=>d.structures.find(s=>s.id===replacement.id).sources.reverse(),
]) {
 const bad=structuredClone(display);mutate(bad);
 assert.equal(api.abdominalArterialNeighbours(bad,'abdomen','both',replacement.id),null);
 assert.equal(api.abdominalArterialPlan(bad,'abdomen','both',replacement.id),null);rejected++;
}
console.log(JSON.stringify({passed:true,unchangedTeachingTabs:api.contentTabs.length,mutationRejections:rejected,newStudyLink:true,oldSourceLinkRejected:true,practiceAndLoading:true,reviewApproval:false}));
