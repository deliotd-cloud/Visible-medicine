import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from './workspace-test-build.mjs';

const baseline='8cfd73cda5077ea608720c3c4d88d8e51371e2ef';
const compile=async contents=>{
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
};
const api=await compile(`export * from './lib/regional-tours';export * from './lib/body-review-material';export * from './lib/body-review-response';import raw from './public/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);`);
const prior=await compile(execFileSync('git',['show',baseline+':lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './lib/"));
const tour=api.upperLimbBoneTour;
assert(tour,'Register and export upperLimbBoneTour from regional-tours before running this test');
const source=[
  ['vm:anatomy:upper-limb:shoulder:right:bone:clavicle','FMA13322',['shoulder-arm'],'shoulder-arm-skeleton'],
  ['vm:anatomy:upper-limb:shoulder:right:bone:scapula','FMA13395',['shoulder-arm'],'shoulder-arm-skeleton'],
  ['vm:anatomy:upper-limb:shoulder:right:bone:humerus','FMA23130',['shoulder-arm','forearm'],'shoulder-arm-skeleton'],
  ['vm:anatomy:body:forearm:right:bone:right-radius','FMA23464',['forearm'],'forearm-skeleton'],
  ['vm:anatomy:body:forearm:right:bone:right-ulna','FMA23467',['forearm'],'forearm-skeleton'],
  ['vm:anatomy:body:hand:right:bone:right-scaphoid','FMA24435',['hand'],'hand-skeleton'],
  ['vm:anatomy:body:hand:right:bone:right-first-metacarpal-bone','FMA24464',['hand'],'hand-skeleton'],
];
const context=[
  ['vm:anatomy:body:hand:right:bone:right-lunate','FMA24437',['hand'],'hand-skeleton'],
  ['vm:anatomy:body:hand:right:bone:right-trapezium','FMA24443',['hand'],'hand-skeleton'],
];
const ids=source.map(([id])=>id);
const contextIds=context.map(([id])=>id);
assert.equal(tour.id,'right-upper-limb-bone-orientation');
assert.equal(tour.revision,tour.id+'-v1');
assert.equal(tour.status,'draft');
assert.equal(tour.region,'whole-body');
assert.deepEqual(tour.scopeRegions,['shoulder-arm','forearm','hand']);
assert.deepEqual(tour.contextIds,contextIds);
assert.deepEqual(tour.steps.map(step=>step.selectedId),ids);
assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries([...source,...context].map(([id,,,bundle])=>[id,bundle])));
assert.deepEqual(api.regionalTours.filter(item=>item.id!==tour.id&&item.id!==api.pelvicRingTour.id),prior.regionalTours,'All 22 historical tours remain exact');
assert.equal(api.regionalTours.filter(t=>t.id!==api.pelvicRingTour.id).length,prior.regionalTours.length+1);
for(const structure of api.catalog.structures){
  assert.deepEqual(api.regionalTourEvidence(api.catalog,structure.id).filter(item=>item.tour.id!==tour.id&&item.tour.id!==api.pelvicRingTour.id),
    prior.regionalTourEvidence(api.catalog,structure.id),`Historical evidence remains exact for ${structure.id}`);
}
const selected=api.regionalTourStructures(api.catalog,tour);
assert.deepEqual(selected.map(item=>[item.id,item.fmaId,item.regions,item.bundle]),[...context,...source]);
for(const structure of selected){
  assert.equal(structure.laterality,'right');
  assert.equal(structure.validation.anatomicalReview,false);
}
for(const scopeRegions of [[],['shoulder-arm','hand'],['shoulder-arm','forearm','hand','hand'],['shoulder-arm','forearm','hand','leg']])
  assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,scopeRegions}));
assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,region:'hand'}));
const catalogPath='public/models/bodyparts3d/full-body/catalog.json';
assert.deepEqual(readFileSync(catalogPath),execFileSync('git',['show',baseline+':'+catalogPath],{maxBuffer:8e6}));
const hashes={
  'shoulder-arm-skeleton':'f75517af8f2d72d1fd890c20fea3375948addab8eaee42f9217dcfd5754d3649',
  'forearm-skeleton':'7af54bdb11a8ae93d9236c6ed35b9a471543bc2a8a32867992a8917d22b1e0d5',
  'hand-skeleton':'5f61ad363b757aa0cfcf0d7be4bcedcf63cbfec9ff5728cace9d62aa0447eac1',
};
for(const [bundleId,expectedHash] of Object.entries(hashes)){
  const bundle=api.catalog.bundles.find(item=>item.id===bundleId);
  assert(bundle);
  const path='public'+bundle.url.split('?')[0];
  const bytes=readFileSync(path);
  assert.equal(bundle.sha256,expectedHash);
  assert.equal(bytes.length,bundle.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expectedHash);
  assert.deepEqual(bytes,execFileSync('git',['show',baseline+':'+path],{maxBuffer:4e6}));
  for(const bundles of [api.catalog.bundles.filter(item=>item.id!==bundleId),[...api.catalog.bundles,bundle]])
    assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));
}
const pinsPath='content/body-review-display-pins.json';
const previousPins=JSON.parse(execFileSync('git',['show',baseline+':'+pinsPath],{encoding:'utf8',maxBuffer:2e6}));
// Pin this milestone's exact delta; later independent teaching has its own
// current-pin regression proof in test-cranial-bone-quiz-history.mjs.
const currentPins=JSON.parse(execFileSync('git',['show','bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8:'+pinsPath],{encoding:'utf8',maxBuffer:2e6}));
assert.deepEqual(Object.fromEntries(Object.entries(currentPins).filter(([key])=>key!=='pins')),
  Object.fromEntries(Object.entries(previousPins).filter(([key])=>key!=='pins')));
assert.equal(currentPins.pins.length,previousPins.pins.length);
const oldPinMap=new Map(previousPins.pins.map(pin=>[pin.structureId,pin.sha256]));
const newPinMap=new Map(currentPins.pins.map(pin=>[pin.structureId,pin.sha256]));
assert.equal(oldPinMap.size,previousPins.pins.length);
assert.equal(newPinMap.size,currentPins.pins.length);
assert.deepEqual([...newPinMap.keys()].sort(),[...oldPinMap.keys()].sort());
const changedPins=[...newPinMap].filter(([id,hash])=>hash!==oldPinMap.get(id)).map(([id])=>id).sort();
assert.deepEqual(changedPins,[...ids,...contextIds].sort(),'Only nine selected/context review pins may change');
let rejectedSources=0,rejectedPackets=0;
for(const structure of selected){
  for(const structures of [
    api.catalog.structures.filter(item=>item.id!==structure.id),
    [...api.catalog.structures,structure],
    api.catalog.structures.map(item=>item.id===structure.id?{...item,regions:['leg']}:item),
    api.catalog.structures.map(item=>item.id===structure.id?{...item,bundle:'leg-skeleton'}:item),
  ]){
    assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));
    rejectedSources++;
  }
  const packet=await api.bodyReviewMaterial(structure.id);
  assert.equal(packet.approval,false);
  assert(await api.parseBodyReviewResponse(packet,structure.id));
  assert.deepEqual(packet.guidedTours,api.regionalTourEvidence(api.catalog,structure.id));
  const index=packet.guidedTours.findIndex(item=>item.tour.id===tour.id);
  assert(index>=0);
  const evidence=packet.guidedTours[index];
  assert.deepEqual(evidence.tour,tour);
  assert.deepEqual(evidence.structures,selected);
  assert.equal(evidence.stepFrames.length,7);
  assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  for(const [stepIndex,frame] of evidence.stepFrames.entries())
    assert.deepEqual(frame,api.regionalTourFrame(api.catalog,tour,stepIndex));
  for(const mutate of [
    value=>value.guidedTours.splice(index,1),
    value=>value.guidedTours.push(structuredClone(value.guidedTours[index])),
    value=>value.guidedTours[index].tour.steps.reverse(),
    value=>value.guidedTours[index].tour.revision+='-stale',
    value=>value.guidedTours[index].tour.steps[0].caption+=' changed',
    value=>value.guidedTours[index].tour.contextIds.pop(),
    value=>value.guidedTours[index].tour.requiredDisplayBundles={},
    value=>value.guidedTours[index].structures[0].fmaId='FMA0',
    value=>value.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
    value=>value.guidedTours[index].stepFrames[0].min[0]-=1,
    value=>value.guidedTours[index].transition='linear',
    value=>value.guidedTours[index].transitionMs=1000,
    value=>value.guidedTours[index].separation=1,
  ]){
    const changed=structuredClone(packet);
    mutate(changed);
    assert.equal(await api.parseBodyReviewResponse(changed,structure.id),null);
    rejectedPackets++;
  }
}
const expectedFrames=[
  [ids[0],ids[1]],[ids[1]],[ids[2]],[ids[3],ids[4]],[ids[3],ids[4]],
  [ids[5],contextIds[0]],[ids[6],contextIds[1]],
];
const overview=api.regionalTourFrame(api.catalog,tour);
for(const [index,step] of tour.steps.entries()){
  assert.equal(step.durationMs,14000);
  assert.equal(step.fadeOthers,true);
  assert.deepEqual(step.frameIds,expectedFrames[index]);
  assert(step.caption.split(/\s+/).length>=18&&step.caption.split(/\s+/).length<=27);
  assert(step.references.every(url=>[
    'https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html',
    'https://anatomy.ttuhscep.edu/anatomytables/joints_upperlimb.html',
  ].includes(url)));
  const frame=api.regionalTourFrame(api.catalog,tour,index);
  assert(frame.min.every((value,axis)=>Number.isFinite(value)&&value<frame.max[axis]));
  assert(frame.min.some((value,axis)=>value>overview.min[axis]||frame.max[axis]<overview.max[axis]));
  for(const id of step.frameIds){
    const bounds=selected.find(item=>item.id===id).bounds;
    assert(bounds.min.every((value,axis)=>value>=frame.min[axis]&&bounds.max[axis]<=frame.max[axis]));
  }
  for(const frameIds of [[],['missing'],[ids[0],ids[0]],[ids[(index+1)%7]]]){
    const changed=structuredClone(tour);
    changed.steps[index].frameIds=frameIds;
    assert.throws(()=>api.regionalTourFrame(api.catalog,changed,index));
  }
}
for(const index of [-1,7,0.5,NaN])assert.throws(()=>api.regionalTourFrame(api.catalog,tour,index));
assert.match(tour.limitations,/articular disc is unrendered/);
assert.match(tour.limitations,/revision-bound radiologist review/);
console.log(JSON.stringify({tour:tour.id,targets:7,context:2,priorToursUnchanged:prior.regionalTours.length,unchangedModelHashes:3,changedDisplayPins:changedPins.length,rejectedSources,rejectedPackets,clinicalApproval:false}));
