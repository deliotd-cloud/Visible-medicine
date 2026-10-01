import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('hip-to-heel learner and Clinical Review retain exact whole-body teaching evidence',async()=>{
  const source='065062b5d5a9db1ee891dbd66fa890d7bb46b0fa';
  const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
  const review=json('atlas-review/manifest.json');
  assert.equal(review.revision,source);
  for(const module of ['head-neck','shoulder']){
    const base=`public/atlas-runtime/${module}/`;
    assert.equal(json(base+'manifest.json').sourceCommit,source);
  }
  const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
  for(const path of ['lib/lower-limb-bone-tour.ts','lib/regional-tours.ts']){
    const file=review.files.find((entry:any)=>entry.path===path);
    assert.ok(file,path);
    assert.equal(inputs.find((entry:any)=>entry.path===path)?.sha256,file.sourceSha256,path);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256,path);
  }
  const compile=async(contents:string)=>{
    const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
    return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  };
  const api=await compile("export * from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';");
  const previousSource=execFileSync('git',['show','ae7e39eff5315c5e47f3755e7b2e0f0527d6c1ea:atlas-review/lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './atlas-review/lib/");
  const previous=await compile(previousSource);
  const tour=api.lowerLimbBoneTour;
  const stops:[string,string,string,string,string][]=[
    ['pelvis','right-hip-bone','Right hip bone · Acetabulum','anterior','Begin at the hip bone. Ilium, ischium and pubis meet around its acetabulum.'],
    ['thigh','right-femur','Femur · Thigh','posterior','The femoral head meets the acetabulum; below, its condyles meet the tibia.'],
    ['leg','right-patella','Patella · Front of knee','anterior','Turn forward to the patella, set before the distal femur within the quadriceps tendon.'],
    ['leg','right-tibia','Tibia · Medial leg','anterior','Follow the medial leg bone from the knee toward its medial ankle prominence.'],
    ['leg','right-fibula','Fibula · Lateral leg','right','Beside the tibia, the fibular head meets it proximally; the distal end forms the lateral malleolus.'],
    ['foot','right-talus','Talus · Ankle','right','Between the medial and lateral malleoli, the talus rests above the calcaneus.'],
    ['foot','right-calcaneus','Calcaneus · Heel','posterior','Finish at the calcaneus beneath the talus, forming the bony heel.'],
  ];
  const ids=stops.map(([region,name])=>`vm:anatomy:body:${region}:right:bone:${name}`);
  const bundles=Object.fromEntries(stops.map(([region],index)=>[ids[index],`${region}-skeleton`]));
  assert.equal(tour.id,'right-lower-limb-bone-orientation');
  assert.equal(tour.revision,'right-lower-limb-bone-orientation-v1');
  assert.equal(tour.status,'draft');
  assert.equal(tour.region,'whole-body');
  assert.deepEqual(tour.scopeRegions,['pelvis','thigh','leg','foot']);
  assert.deepEqual(tour.contextIds,[]);
  assert.deepEqual(tour.requiredDisplayBundles,bundles);
  assert.deepEqual(tour.steps.map((step:any)=>[step.selectedId,step.title,step.view,step.caption]),stops.map(([, ,title,view,caption],index)=>[ids[index],title,view,caption]));
  for(const step of tour.steps)assert.deepEqual(step.frameIds,ids);
  assert.equal(api.regionalTourFor('whole-body').id,tour.id);
  assert.deepEqual(api.regionalToursFor('whole-body').map((entry:any)=>entry.id),[tour.id]);
  assert.equal(api.regionalTours.length,22);
  assert.equal(api.regionalTours.reduce((sum:number,entry:any)=>sum+entry.steps.length,0),123);
  assert.deepEqual(api.regionalTours.filter((entry:any)=>entry.id!==tour.id),previous.regionalTours,'all 21 earlier definitions remain exact');

  for(const id of ids){
    const packet=await api.bodyReviewMaterial(id);
    assert.equal(packet.schema,'vm-body-review-worksheet-3');
    assert.equal(packet.status,'worksheet-not-submitted');
    assert.equal(packet.approval,false);
    assert.ok(await api.parseBodyReviewResponse(packet,id));
    const evidence=packet.guidedTours.find((entry:any)=>entry.tour.id===tour.id);
    assert.ok(evidence,id);
    assert.deepEqual(evidence.tour,tour);
    assert.deepEqual(evidence.structures.map((structure:any)=>structure.id),ids);
    assert.deepEqual(evidence.bundles.map((bundle:any)=>bundle.id).sort(),[...new Set(Object.values(bundles))].sort());
    assert.equal(evidence.stepFrames.length,7);
    assert.equal(evidence.transitionMs,1800);
    assert.equal(evidence.transition,'quintic-orbit');
    assert.equal(evidence.separation,0);
    for(const [index,step] of evidence.tour.steps.entries()){
      assert.equal(step.caption,stops[index][4]);
      assert.deepEqual(step.frameIds,ids);
    }
    for(const mutate of [
      (value:any)=>{value.guidedTours=value.guidedTours.filter((entry:any)=>entry.tour.id!==tour.id);},
      (value:any)=>{value.guidedTours.find((entry:any)=>entry.tour.id===tour.id).tour.scopeRegions.pop();},
      (value:any)=>{value.guidedTours.find((entry:any)=>entry.tour.id===tour.id).tour.steps[0].caption+=' altered';},
      (value:any)=>{value.guidedTours.find((entry:any)=>entry.tour.id===tour.id).structures[0].sources[0].sha256='0'.repeat(64);},
      (value:any)=>{value.guidedTours.find((entry:any)=>entry.tour.id===tour.id).stepFrames[0].min[0]-=1;},
    ]){
      const changed=structuredClone(packet);mutate(changed);
      assert.equal(await api.parseBodyReviewResponse(changed,id),null,`altered tour evidence for ${id}`);
    }
  }
});
