import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='e8a7ceca9fe7c82c744345f1854bafb6055853af';
const previousRevision='065062b5d5a9db1ee891dbd66fa890d7bb46b0fa';
const compile=async contents=>{
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const prior=await compile(execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const previousTour=(await compile(execFileSync('git',['show',previousRevision+':lib/lower-limb-bone-tour.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"))).lowerLimbBoneTour;
const source=[
  ['vm:anatomy:body:pelvis:right:bone:right-hip-bone','FMA16586',['pelvis','thigh'],'pelvis-skeleton'],
  ['vm:anatomy:body:thigh:right:bone:right-femur','FMA24474',['thigh','pelvis','leg'],'thigh-skeleton'],
  ['vm:anatomy:body:leg:right:bone:right-patella','FMA24486',['leg'],'leg-skeleton'],
  ['vm:anatomy:body:leg:right:bone:right-tibia','FMA24477',['leg'],'leg-skeleton'],
  ['vm:anatomy:body:leg:right:bone:right-fibula','FMA24480',['leg'],'leg-skeleton'],
  ['vm:anatomy:body:foot:right:bone:right-talus','FMA24482',['foot'],'foot-skeleton'],
  ['vm:anatomy:body:foot:right:bone:right-calcaneus','FMA24497',['foot'],'foot-skeleton'],
];
const ids=source.map(([id])=>id);
const tour=api.lowerLimbBoneTour;
assert(tour,'Register and export lowerLimbBoneTour from regional-tours before running this test');
assert.equal(tour.id,'right-lower-limb-bone-orientation');
assert.equal(tour.revision,tour.id+'-v2');
assert.equal(tour.region,'whole-body');
assert.deepEqual(tour.scopeRegions,['pelvis','thigh','leg','foot']);
assert.equal(tour.status,'draft');
assert.deepEqual(tour.contextIds,[]);
assert.deepEqual(tour.steps.map(step=>step.selectedId),ids);
assert.deepEqual(tour.steps.map(step=>step.view),['anterior','posterior','anterior','anterior','right','right','posterior']);
assert.deepEqual(tour.steps.map(({frameIds,...step})=>step),previousTour.steps.map(({frameIds,...step})=>step),
  'Targets, captions, views, durations and all other stop content remain identical to v1');
assert.deepEqual(tour.requiredDisplayBundles,previousTour.requiredDisplayBundles);
assert.deepEqual(tour.scopeRegions,previousTour.scopeRegions);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(source.map(([id,,,bundle])=>[id,bundle])));
assert.equal(api.regionalTours.length,22);
assert.equal(api.regionalTours.reduce((count,t)=>count+t.steps.length,0),123);
assert.deepEqual(api.regionalTours.filter(t=>t.id!==tour.id),prior.regionalTours,'All 21 previous tour definitions preserved');
for(const structure of api.catalog.structures){
  assert.deepEqual(api.regionalTourEvidence(api.catalog,structure.id).filter(evidence=>evidence.tour.id!==tour.id),
    prior.regionalTourEvidence(api.catalog,structure.id),`Previous evidence preserved for ${structure.id}`);
}
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected.map(s=>[s.id,s.fmaId,s.regions,s.bundle]),source);
assert.deepEqual(selected,api.regionalTourStructures(api.catalog,previousTour),'All seven assembled selections retain their source identity');
const overview=api.regionalTourFrame(api.catalog,previousTour);
assert.deepEqual(api.regionalTourFrame(api.catalog,tour),overview,'The full assembled overview remains available');
for(const structure of selected){
  assert.equal(structure.laterality,'right');
  assert.equal(structure.validation.anatomicalReview,false);
}
for(const scopeRegions of [[],['pelvis','leg','foot'],['pelvis','thigh','leg','leg','foot'],['pelvis','thigh','leg','foot','invented']]){
  assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,scopeRegions}),`Invalid scope ${scopeRegions}`);
}
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,region:'leg'}),'Cross-region scope requires whole-body tour');
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(catalogPath),execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:8e6}));
assert.equal(execFileSync('git',['diff','--name-only',baseline,'--','public/models'],{encoding:'utf8'}).trim(),'','Displayed models unchanged');
const expectedHashes={
  'pelvis-skeleton':'58e1008b8064e8a61ce659e0246615960826772abe7070f66496eadcd86f4746',
  'thigh-skeleton':'27bd799bd85387beea9fab40cbe2f83a5e780983170db4dfd1d2e0eda8fd2b59',
  'leg-skeleton':'8885078bc114d8cf5c2ebd12f393761965b2016bf6f5fc196c83549527e2c0af',
  'foot-skeleton':'1b363def6136145a2a0faa31ca5edb46db8345631a4343c25919a3abf73d2d40',
};
for(const [bundleId,expectedHash] of Object.entries(expectedHashes)){
  const bundle=api.catalog.bundles.find(item=>item.id===bundleId);
  assert(bundle);
  const modelPath='public'+bundle.url.split('?')[0];
  const bytes=readFileSync(modelPath);
  assert.equal(bundle.sha256,expectedHash);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expectedHash);
  assert.equal(bytes.length,bundle.bytes);
  assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+modelPath],{maxBuffer:4e6}));
  for(const bundles of [api.catalog.bundles.filter(item=>item.id!==bundleId),[...api.catalog.bundles,bundle]]){
    assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));
  }
}
let rejectedSources=0,rejectedPackets=0;
for(const structure of selected){
  for(const structures of [
    api.catalog.structures.filter(item=>item.id!==structure.id),
    [...api.catalog.structures,structure],
    api.catalog.structures.map(item=>item.id===structure.id?{...item,regions:['hand']}:item),
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
  for(const [stepIndex,frame] of added.stepFrames.entries())
    assert.deepEqual(frame,api.regionalTourFrame(api.catalog,tour,stepIndex));
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
    value=>value.guidedTours[index].tour.scopeRegions.splice(1,1),
    value=>value.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
    value=>value.guidedTours[index].stepFrames[0].min[0]-=1,
    value=>value.guidedTours[index].transition='linear',
  ]){
    const changed=structuredClone(packet);
    mutate(changed);
    assert.equal(await api.parseBodyReviewResponse(changed,structure.id),null);
    rejectedPackets++;
  }
  const staleV1=structuredClone(packet);
  staleV1.guidedTours[index].tour=structuredClone(previousTour);
  staleV1.guidedTours[index].stepFrames=previousTour.steps.map(()=>structuredClone(overview));
  assert.equal(await api.parseBodyReviewResponse(staleV1,structure.id),null,'The superseded v1 review packet must be rejected');
  rejectedPackets++;
}
const expectedFrames=[[ids[0]],[ids[1]],[ids[2]],[ids[3],ids[4]],[ids[3],ids[4]],[ids[5],ids[6]],[ids[5],ids[6]]];
for(const [index,step] of tour.steps.entries()){
  assert.equal(step.durationMs,14000);
  assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.frameIds,expectedFrames[index],'The camera focuses on its selected bone and specified neighbour');
  assert.deepEqual(step.references,['https://anatomy.ttuhscep.edu/anatomytables/bones_lowerlimb.html']);
  const frame=api.regionalTourFrame(api.catalog,tour,index);
  assert(frame.min.every((value,axis)=>Number.isFinite(value)&&value<frame.max[axis]));
  assert(frame.min.every((value,axis)=>value>=overview.min[axis]&&frame.max[axis]<=overview.max[axis]));
  assert(frame.min.some((value,axis)=>value>overview.min[axis]||frame.max[axis]<overview.max[axis]),
    'Every camera frame is smaller than the old seven-bone frame');
  for(const id of step.frameIds){
    const bounds=selected.find(structure=>structure.id===id).bounds;
    assert(bounds.min.every((value,axis)=>value>=frame.min[axis]&&bounds.max[axis]<=frame.max[axis]),
      `${id} must fit completely in stop ${index}'s camera frame`);
  }
  assert(selected.some(structure=>!step.frameIds.includes(structure.id)&&
    structure.bounds.min.some((value,axis)=>value<frame.min[axis]||structure.bounds.max[axis]>frame.max[axis])),
    'The assembled off-frame bones remain selected even when outside the camera viewport');
  for(const frameIds of [[],['missing'],[ids[0],ids[0]],[ids[(index+1)%7]]]){
    const changed=structuredClone(tour);
    changed.steps[index].frameIds=frameIds;
    assert.throws(()=>api.regionalTourFrame(api.catalog,changed,index));
  }
}
for(const index of [-1,7,0.5,NaN])assert.throws(()=>api.regionalTourFrame(api.catalog,tour,index));
const pinsPath='content/body-review-display-pins.json';
const previousPins=JSON.parse(execFileSync('git',['show',previousRevision+':'+pinsPath],{encoding:'utf8',maxBuffer:2e6}));
const currentPins=JSON.parse(readFileSync(pinsPath,'utf8'));
assert.deepEqual(Object.fromEntries(Object.entries(currentPins).filter(([key])=>key!=='pins')),
  Object.fromEntries(Object.entries(previousPins).filter(([key])=>key!=='pins')));
assert.equal(currentPins.pins.length,previousPins.pins.length);
const oldPinMap=new Map(previousPins.pins.map(pin=>[pin.structureId,pin.sha256]));
const newPinMap=new Map(currentPins.pins.map(pin=>[pin.structureId,pin.sha256]));
assert.equal(oldPinMap.size,previousPins.pins.length);
assert.equal(newPinMap.size,currentPins.pins.length);
assert.deepEqual([...newPinMap.keys()].sort(),[...oldPinMap.keys()].sort());
const changedPins=[...newPinMap].filter(([id,hash])=>hash!==oldPinMap.get(id)).map(([id])=>id).sort();
assert.deepEqual(changedPins,[...ids].sort(),'Only the seven target display-review pins may change');
const referenceWords=tour.steps.map(step=>step.title+' '+step.caption).join(' ').split(/\s+/).length;
assert(referenceWords<=140);
assert.match(tour.limitations,/revision-bound radiologist review/);
assert.match(tour.limitations,/No weight-bearing or validated joint-space measurement/);
assert.match(tour.limitations,/patient registration/);
console.log(JSON.stringify({tour:tour.id,revision:tour.revision,targets:7,contextualFrames:7,changedDisplayPins:changedPins.length,priorToursUnchanged:21,tours:22,stops:123,unchangedModelHashes:4,rejectedSources,rejectedPackets,referenceWords,clinicalApproval:false}));
