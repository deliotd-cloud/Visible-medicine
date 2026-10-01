import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='d35fab9730ca5420d7a65f0ba321d8cbfff03571';
const compile=async contents=>{
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const prior=await compile(execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const names=['right-talus','right-calcaneus','navicular-bone-of-right-foot','right-cuboid-bone','right-medial-cuneiform-bone','right-intermediate-cuneiform-bone','right-lateral-cuneiform-bone'];
const ids=names.map(name=>'vm:anatomy:body:foot:right:bone:'+name);
const tour=api.tarsalTour;
assert(tour,'Register and export tarsalTour from regional-tours before running this test');
assert.equal(tour.id,'right-tarsal-bone-orientation');
assert.equal(tour.revision,tour.id+'-v1');
assert.equal(tour.title,'Right foot: hindfoot & midfoot');
assert.equal(tour.region,'foot');
assert.equal(tour.status,'draft');
assert.deepEqual(tour.contextIds,[]);
assert.deepEqual(tour.steps.map(step=>step.selectedId),ids);
assert.deepEqual(tour.steps.map(step=>step.view),['superior','inferior','superior','right','superior','superior','superior']);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map(id=>[id,'foot-skeleton'])));
assert.equal(api.regionalToursFor('foot').length,2);
assert.equal(api.regionalTourFor('foot').id,api.footTour.id);
const historicalTours=api.regionalTours.filter(t=>t.id!==api.lowerLimbBoneTour.id&&t.id!==api.upperLimbBoneTour.id);
assert.equal(historicalTours.length,21);
assert.equal(historicalTours.reduce((count,t)=>count+t.steps.length,0),116);
assert.deepEqual(historicalTours.filter(t=>t.id!==tour.id),prior.regionalTours,'All twenty preceding tour definitions preserved');
for(const structure of api.catalog.structures){
  assert.deepEqual(api.regionalTourEvidence(api.catalog,structure.id).filter(evidence=>evidence.tour.id!==tour.id&&evidence.tour.id!==api.lowerLimbBoneTour.id&&evidence.tour.id!==api.upperLimbBoneTour.id),
    prior.regionalTourEvidence(api.catalog,structure.id),`Previous evidence preserved for ${structure.id}`);
}
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected.map(structure=>structure.id),ids);
assert.deepEqual(selected.map(structure=>structure.fmaId),['FMA24482','FMA24497','FMA24500','FMA24528','FMA24521','FMA24523','FMA24525']);
for(const structure of selected){
  assert.equal(structure.laterality,'right');
  assert.deepEqual(structure.regions,['foot']);
  assert.equal(structure.bundle,'foot-skeleton');
  assert.equal(structure.validation.anatomicalReview,false);
}
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(catalogPath),execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:8e6}));
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/models'],{encoding:'utf8'}).trim(),'','Displayed models unchanged');
const bundle=api.catalog.bundles.find(item=>item.id==='foot-skeleton');
assert(bundle);
const modelPath='public'+bundle.url.split('?')[0];
const bytes=readFileSync(modelPath);
const expectedHash='1b363def6136145a2a0faa31ca5edb46db8345631a4343c25919a3abf73d2d40';
assert.equal(bundle.sha256,expectedHash);
assert.equal(createHash('sha256').update(bytes).digest('hex'),expectedHash);
assert.equal(bytes.length,bundle.bytes);
assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+modelPath],{maxBuffer:4e6}));
for(const bundles of [api.catalog.bundles.filter(item=>item.id!==bundle.id),[...api.catalog.bundles,bundle]]){
  assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));
}
let rejectedSources=0,rejectedPackets=0;
for(const structure of selected){
  for(const structures of [
    api.catalog.structures.filter(item=>item.id!==structure.id),
    [...api.catalog.structures,structure],
    api.catalog.structures.map(item=>item.id===structure.id?{...item,regions:['leg']}:item),
    api.catalog.structures.map(item=>item.id===structure.id?{...item,bundle:'hand-skeleton'}:item),
  ]){
    assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));
    rejectedSources++;
  }
  const packet=await api.bodyReviewMaterial(structure.id);
  const evidence=api.regionalTourEvidence(api.catalog,structure.id);
  assert.equal(packet.approval,false);
  assert(await api.parseBodyReviewResponse(packet,structure.id));
  assert.deepEqual(packet.guidedTours,evidence);
  const index=packet.guidedTours.findIndex(item=>item.tour.id===tour.id);
  assert(index>=0);
  const added=evidence[index];
  assert.deepEqual(added.tour,tour);
  assert.deepEqual(added.structures,selected);
  assert.equal(added.stepFrames.length,7);
  assert.equal(added.transitionMs,1800);
  assert.equal(added.transition,'quintic-orbit');
  assert.equal(added.separation,0);
  for(const mutate of [
    value=>value.guidedTours.splice(index,1),
    value=>value.guidedTours.push(structuredClone(value.guidedTours[index])),
    value=>value.guidedTours[index].tour.steps.reverse(),
    value=>value.guidedTours[index].tour.revision+='-stale',
    value=>value.guidedTours[index].tour.steps[0].caption+=' changed',
    value=>value.guidedTours[index].tour.requiredDisplayBundles={},
    value=>value.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
    value=>value.guidedTours[index].stepFrames[0].min[0]-=1,
    value=>value.guidedTours[index].transition='linear',
  ]){
    const changed=structuredClone(packet);
    mutate(changed);
    assert.equal(await api.parseBodyReviewResponse(changed,structure.id),null);
    rejectedPackets++;
  }
}
for(const [index,step] of tour.steps.entries()){
  assert.equal(step.durationMs,14000);
  assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.frameIds,ids,'Every step retains the assembled seven-bone frame');
  assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html']);
  assert.deepEqual(api.regionalTourFrame(api.catalog,tour,index),api.regionalTourFrame(api.catalog,tour));
  for(const frameIds of [[],['missing'],[ids[0],ids[0]],[ids[(index+1)%7]]]){
    const changed=structuredClone(tour);
    changed.steps[index].frameIds=frameIds;
    assert.throws(()=>api.regionalTourFrame(api.catalog,changed,index));
  }
}
const referenceWords=tour.steps.map(step=>step.title+' '+step.caption).join(' ').split(/\s+/).length;
assert(referenceWords<=200);
assert.match(tour.limitations,/revision-bound radiologist review/);
assert.match(tour.limitations,/No weight-bearing simulation or validated joint-space measurement/);
assert.match(tour.limitations,/No CT\/MRI registration/);
console.log(JSON.stringify({tour:tour.id,targets:7,priorToursUnchanged:20,historicalTours:21,historicalStops:116,unchangedModelHashes:1,rejectedSources,rejectedPackets,referenceWords,clinicalApproval:false}));
