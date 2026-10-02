import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('right upper-limb learner and Clinical Review preserve assembled source and revision-bound evidence',async()=>{
  const source='871c57b7729476bb08cbf04d58732b90fc4b52c5';
  const baseline='8357c39cfacc14dc391be2c470fab14f661e1855';
  const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
  const saved=(path:string)=>execFileSync('git',['show',`${baseline}:${path}`],{maxBuffer:8e6});
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,source);
  for(const module of ['head-neck','shoulder'])
    assert.equal(json(`public/atlas-runtime/${module}/manifest.json`).sourceCommit,source);
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['lib/upper-limb-bone-tour.ts','lib/regional-tours.ts']){
    const file=review.files.find((entry:any)=>entry.path===path);
    assert.ok(file,path);
    assert.equal(inputs.find((entry:any)=>entry.path===path)?.sha256,file.sourceSha256,path);
    assert.equal(createHash('sha256').update(readFileSync(`atlas-review/${path}`)).digest('hex'),file.importedSha256,path);
  }
  const compile=async(contents:string)=>{
    const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
    return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  };
  const api=await compile("export * from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';import raw from './public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json';import {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export const catalog=bodyDisplayCatalog(raw as any);");
  const oldSource=Buffer.from(saved('atlas-review/lib/regional-tours.ts')).toString('utf8').replaceAll("from './","from './atlas-review/lib/");
  const old=await compile(oldSource);
  const tour=api.upperLimbBoneTour;
  const stops:[string,string,string,string,string,string[]][]=[
    ['clavicle','vm:anatomy:upper-limb:shoulder:right:bone:clavicle','Clavicle · Shoulder girdle','anterior','Begin at the clavicle, running from the sternum toward the scapular acromion. Its lateral end provides a bony link across the shoulder girdle.',['clavicle','scapula']],
    ['scapula','vm:anatomy:upper-limb:shoulder:right:bone:scapula','Scapula · Shoulder blade','posterior','Turn behind the shoulder to the scapula. Its spine leads toward the acromion; the lateral glenoid cavity receives the humeral head.',['scapula']],
    ['humerus','vm:anatomy:upper-limb:shoulder:right:bone:humerus','Humerus · Arm','anterior','Follow the humerus from its rounded head at the shoulder toward the elbow, where its distal surfaces meet the radius and ulna.',['humerus']],
    ['radius','vm:anatomy:body:forearm:right:bone:right-radius','Radius · Thumb side','anterior','In anatomical position, the radius lies on the thumb side of the forearm. Its broad distal end faces the scaphoid and lunate.',['radius','ulna']],
    ['ulna','vm:anatomy:body:forearm:right:bone:right-ulna','Ulna · Medial forearm','anterior','The ulna lies medially in anatomical position. Proximally it meets the humeral trochlea; distally it meets the radius, not the carpal bones directly.',['radius','ulna']],
    ['scaphoid','vm:anatomy:body:hand:right:bone:right-scaphoid','Scaphoid · Thumb-side wrist','anterior','Focus on the scaphoid at the thumb side of the proximal carpal row. The lunate remains faded beside it; both face the distal radius.',['scaphoid','lunate']],
    ['first-metacarpal','vm:anatomy:body:hand:right:bone:right-first-metacarpal-bone','First metacarpal · Thumb base','anterior','Finish at the first metacarpal of the thumb. The faded trapezium sits between its base and the more proximal carpal row.',['first-metacarpal','trapezium']],
  ];
  const context=[
    ['lunate','vm:anatomy:body:hand:right:bone:right-lunate'],
    ['trapezium','vm:anatomy:body:hand:right:bone:right-trapezium'],
  ];
  const byName=Object.fromEntries([...stops.map(([name,id])=>[name,id]),...context]);
  const sourceStructures:[string,string,string[],string][]=[
    [byName.clavicle,'FMA13322',['shoulder-arm'],'shoulder-arm-skeleton'],
    [byName.scapula,'FMA13395',['shoulder-arm'],'shoulder-arm-skeleton'],
    [byName.humerus,'FMA23130',['shoulder-arm','forearm'],'shoulder-arm-skeleton'],
    [byName.radius,'FMA23464',['forearm'],'forearm-skeleton'],
    [byName.ulna,'FMA23467',['forearm'],'forearm-skeleton'],
    [byName.scaphoid,'FMA24435',['hand'],'hand-skeleton'],
    [byName['first-metacarpal'],'FMA24464',['hand'],'hand-skeleton'],
  ];
  const contextStructures:[string,string,string[],string][]=[
    [byName.lunate,'FMA24437',['hand'],'hand-skeleton'],
    [byName.trapezium,'FMA24443',['hand'],'hand-skeleton'],
  ];
  const ids=sourceStructures.map(([id])=>id);
  const contextIds=contextStructures.map(([id])=>id);
  assert.equal(tour.id,'right-upper-limb-bone-orientation');
  assert.equal(tour.revision,'right-upper-limb-bone-orientation-v1');
  assert.equal(tour.status,'draft');
  assert.equal(tour.region,'whole-body');
  assert.deepEqual(tour.scopeRegions,['shoulder-arm','forearm','hand']);
  assert.deepEqual(tour.contextIds,contextIds);
  assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries([...sourceStructures,...contextStructures].map(([id,,,bundle])=>[id,bundle])));
  assert.deepEqual(tour.steps.map((step:any)=>[step.id,step.selectedId,step.title,step.view,step.caption,step.frameIds]),
    stops.map(([name,id,title,view,caption,frameNames])=>[name,id,title,view,caption,frameNames.map(frameName=>byName[frameName])]));
  assert.deepEqual(tour.steps.map((step:any)=>step.references),[
    ['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html'],
    ['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html'],
    ['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html'],
    ['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html'],
    ['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html','https://anatomy.ttuhscep.edu/anatomytables/joints_upperlimb.html'],
    ['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html'],
    ['https://anatomy.ttuhscep.edu/anatomytables/bones_upperlimb.html','https://anatomy.ttuhscep.edu/anatomytables/joints_upperlimb.html'],
  ]);
  assert.ok(tour.steps.every((step:any)=>step.durationMs===14000&&step.fadeOthers===true));
  assert.match(tour.limitations,/articular disc is unrendered/);
  assert.match(tour.limitations,/revision-bound radiologist review/);
  assert.deepEqual(api.regionalToursFor('whole-body').map((entry:any)=>entry.id),[api.lowerLimbBoneTour.id,tour.id]);
  const historical=api.regionalTours.filter((entry:any)=>entry.id!==api.pelvicRingTour.id&&entry.id!==api.circleWillisTour.id);
  assert.equal(historical.length,23);
  assert.equal(historical.reduce((sum:number,entry:any)=>sum+entry.steps.length,0),130);
  assert.deepEqual(historical.filter((entry:any)=>entry.id!==tour.id),old.regionalTours,'all 22 preceding tours remain exact');
  for(const structure of api.catalog.structures)
    assert.deepEqual(api.regionalTourEvidence(api.catalog,structure.id).filter((item:any)=>item.tour.id!==tour.id&&item.tour.id!==api.pelvicRingTour.id&&item.tour.id!==api.circleWillisTour.id),old.regionalTourEvidence(api.catalog,structure.id),`historical evidence for ${structure.id}`);

  const selected=api.regionalTourStructures(api.catalog,tour);
  assert.deepEqual(selected.map((structure:any)=>[structure.id,structure.fmaId,structure.regions,structure.bundle]),[...contextStructures,...sourceStructures]);
  for(const structure of selected){
    assert.equal(structure.laterality,'right');
    assert.equal(structure.validation.anatomicalReview,false);
  }
  for(const scopeRegions of [[],['shoulder-arm','hand'],['shoulder-arm','forearm','hand','hand'],['shoulder-arm','forearm','hand','leg']])
    assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,scopeRegions}));
  assert.throws(()=>api.regionalTourStructures(api.catalog,{...tour,region:'hand'}));
  const catalogPath='public/atlas-runtime/head-neck/models/bodyparts3d/full-body/catalog.json';
  assert.deepEqual(readFileSync(catalogPath),saved(catalogPath),'source catalog bytes remain assembled baseline');
  assert.deepEqual(json('lib/atlas-model-inventory.json').models,JSON.parse(Buffer.from(saved('lib/atlas-model-inventory.json')).toString('utf8')).models);
  const modelHashes:Record<string,string>={
    'shoulder-arm-skeleton':'f75517af8f2d72d1fd890c20fea3375948addab8eaee42f9217dcfd5754d3649',
    'forearm-skeleton':'7af54bdb11a8ae93d9236c6ed35b9a471543bc2a8a32867992a8917d22b1e0d5',
    'hand-skeleton':'5f61ad363b757aa0cfcf0d7be4bcedcf63cbfec9ff5728cace9d62aa0447eac1',
  };
  for(const [bundleId,hash] of Object.entries(modelHashes)){
    const bundle=api.catalog.bundles.find((entry:any)=>entry.id===bundleId);
    assert.ok(bundle,bundleId);
    const path=`public/atlas-runtime/head-neck${bundle.url.split('?')[0]}`;
    const bytes=readFileSync(path);
    assert.equal(bundle.sha256,hash);
    assert.equal(bytes.length,bundle.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
    assert.deepEqual(bytes,saved(path),`${bundleId} baseline model bytes`);
    for(const bundles of [api.catalog.bundles.filter((entry:any)=>entry.id!==bundleId),[...api.catalog.bundles,bundle]])
      assert.throws(()=>api.regionalTourStructures({...api.catalog,bundles},tour));
  }
  const oldPins=JSON.parse(Buffer.from(saved('atlas-review/content/body-review-display-pins.json')).toString('utf8'));
  // Retain this tour's exact delivered nine-pin delta. The later independent
  // skull-quiz delta against current pins is checked by atlas-cranial-bone-quiz.
  const pins=JSON.parse(Buffer.from(execFileSync('git',['show','736ad7a31aa8e6414493a534f66ce7810b0a4780:atlas-review/content/body-review-display-pins.json'],{maxBuffer:2e6})).toString('utf8'));
  assert.deepEqual(Object.fromEntries(Object.entries(pins).filter(([key])=>key!=='pins')),
    Object.fromEntries(Object.entries(oldPins).filter(([key])=>key!=='pins')));
  assert.equal(pins.pins.length,oldPins.pins.length);
  const before=new Map(oldPins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
  const after=new Map(pins.pins.map((pin:any)=>[pin.structureId,pin.sha256]));
  assert.equal(before.size,oldPins.pins.length);
  assert.equal(after.size,pins.pins.length);
  assert.deepEqual([...after.keys()].sort(),[...before.keys()].sort());
  assert.deepEqual([...after].filter(([id,hash])=>hash!==before.get(id)).map(([id])=>id).sort(),[...ids,...contextIds].sort(),'only nine review display pins change');

  const overview=api.regionalTourFrame(api.catalog,tour);
  for(const [index,step] of tour.steps.entries()){
    const frame=api.regionalTourFrame(api.catalog,tour,index);
    const framed=selected.filter((structure:any)=>step.frameIds.includes(structure.id));
    assert.deepEqual(frame,{
      min:[0,1,2].map(axis=>Math.min(...framed.map((structure:any)=>structure.bounds.min[axis]))),
      max:[0,1,2].map(axis=>Math.max(...framed.map((structure:any)=>structure.bounds.max[axis]))),
    },`step ${index} uses exact source bounds`);
    assert.ok(frame.min.every((value:number,axis:number)=>Number.isFinite(value)&&value<frame.max[axis]));
    assert.ok(frame.min.some((value:number,axis:number)=>value>overview.min[axis]||frame.max[axis]<overview.max[axis]),`step ${index} is contextual close-up`);
    for(const frameIds of [[],['missing'],[ids[0],ids[0]],[ids[(index+1)%7]]]){
      const changed=structuredClone(tour);
      changed.steps[index].frameIds=frameIds;
      assert.throws(()=>api.regionalTourFrame(api.catalog,changed,index));
    }
  }
  for(const index of [-1,7,0.5,NaN])assert.throws(()=>api.regionalTourFrame(api.catalog,tour,index));
  for(const structure of selected){
    for(const structures of [
      api.catalog.structures.filter((item:any)=>item.id!==structure.id),
      [...api.catalog.structures,structure],
      api.catalog.structures.map((item:any)=>item.id===structure.id?{...item,regions:['leg']}:item),
      api.catalog.structures.map((item:any)=>item.id===structure.id?{...item,bundle:'leg-skeleton'}:item),
    ])assert.throws(()=>api.regionalTourStructures({...api.catalog,structures},tour));
    const packet=await api.bodyReviewMaterial(structure.id);
    assert.equal(packet.schema,'vm-body-review-worksheet-3');
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.equal(packet.approval,false);
    assert.ok(await api.parseBodyReviewResponse(packet,structure.id));
    assert.deepEqual(packet.guidedTours,api.regionalTourEvidence(api.catalog,structure.id));
    const index=packet.guidedTours.findIndex((entry:any)=>entry.tour.id===tour.id);
    assert.ok(index>=0);
    const evidence=packet.guidedTours[index];
    assert.deepEqual(evidence.tour,tour);
    assert.deepEqual(evidence.structures,selected);
    assert.deepEqual(evidence.frame,overview);
    assert.equal(evidence.stepFrames.length,7);
    assert.equal(evidence.transitionMs,1800);
    assert.equal(evidence.transition,'quintic-orbit');
    assert.equal(evidence.separation,0);
    for(const [stepIndex,frame] of evidence.stepFrames.entries())
      assert.deepEqual(frame,api.regionalTourFrame(api.catalog,tour,stepIndex));
    for(const mutate of [
      (value:any)=>value.guidedTours.splice(index,1),
      (value:any)=>value.guidedTours.push(structuredClone(value.guidedTours[index])),
      (value:any)=>value.guidedTours[index].tour.steps.reverse(),
      (value:any)=>value.guidedTours[index].tour.revision+='-stale',
      (value:any)=>value.guidedTours[index].tour.steps[0].caption+=' changed',
      (value:any)=>value.guidedTours[index].tour.contextIds.pop(),
      (value:any)=>value.guidedTours[index].tour.requiredDisplayBundles={},
      (value:any)=>value.guidedTours[index].structures[0].fmaId='FMA0',
      (value:any)=>value.guidedTours[index].structures[0].sources[0].sha256='0'.repeat(64),
      (value:any)=>value.guidedTours[index].stepFrames[0].min[0]-=1,
      (value:any)=>value.guidedTours[index].transition='linear',
      (value:any)=>value.guidedTours[index].transitionMs=1000,
      (value:any)=>value.guidedTours[index].separation=1,
    ]){
      const changed=structuredClone(packet);
      mutate(changed);
      assert.equal(await api.parseBodyReviewResponse(changed,structure.id),null,`altered review evidence for ${structure.id}`);
    }
  }
});
