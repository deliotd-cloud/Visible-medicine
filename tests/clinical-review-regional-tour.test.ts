import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('all twenty-eight regional tours ship complete source-bound review evidence', async () => {
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const base='public/atlas-runtime/head-neck/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(learner.sourceCommit,'1517521a5ee3eed985fff01bcd8608965b693fae');
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  for(const path of ['lib/lower-venous-tour.ts','lib/regional-tours.ts','lib/tarsal-tour.ts','lib/upper-limb-bone-tour.ts','lib/chest-wall-tour.ts','lib/orbital-tour.ts','lib/intrinsic-larynx-tour.ts','lib/male-duct-tour.ts','lib/deep-brain-tour.ts','lib/subscapular-tour.ts','app/regional-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx']) {
    const file=review.files.find((f:any)=>f.path===path); assert.ok(file,path);
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,file.sourceSha256,path);
    assert.equal(createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'),file.importedSha256);
  }
  for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(learner[flag],false);
  const result=await build({stdin:{contents:`
    export * from './atlas-review/lib/regional-tours';
    export * from './atlas-review/lib/body-review-material';
    export * from './atlas-review/lib/body-review-response';
    export * from './atlas-review/lib/body-review-context';
  `,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  assert.equal(api.thoraxTour.status,'draft'); assert.equal(api.thoraxTour.steps.length,6);
  assert.equal(api.cervicalSpineTour.status,'draft');assert.equal(api.cervicalSpineTour.steps.length,5);
  assert.equal(api.regionalTourFor('spine').id,'cervical-spine-orientation');
  assert.equal(api.celiacTour.status,'draft');assert.equal(api.celiacTour.steps.length,5);
  assert.equal(api.celiacTour.revision,'celiac-branches-orientation-v2');
  assert.equal(api.regionalTourFor('abdomen').id,'celiac-branches-orientation');
  assert.equal(api.forearmTour.status,'draft');assert.equal(api.forearmTour.steps.length,5);
  assert.equal(api.regionalTourFor('forearm').id,'right-forearm-muscle-orientation');
  assert.equal(api.forearmTour.revision,'right-forearm-muscle-orientation-v1');
  for(const region of ['thigh','leg','hand','foot']) {
    const tour=api[region+'Tour'];
    assert.equal(tour.status,'draft');assert.equal(tour.steps.length,5);
    assert.equal(api.regionalTourFor(region).id,'right-'+region+'-muscle-orientation');
    assert.equal(tour.revision,tour.id+'-v1');
  }
  assert.equal(api.upperArmTour.status,'draft');
  assert.equal(api.subscapularTour.status,'draft');assert.equal(api.subscapularTour.steps.length,4);
  assert.equal(api.subscapularTour.revision,'right-subscapular-arterial-relationships-v1');
  assert.deepEqual(api.regionalToursFor('shoulder-arm').map((t:any)=>t.id),[api.upperArmTour.id,api.subscapularTour.id]);
  assert.equal(api.upperArmTour.steps.length,6);
  assert.equal(api.regionalTourFor('shoulder-arm').id,'right-upper-arm-muscle-orientation');
  assert.equal(api.upperArmTour.revision,'right-upper-arm-muscle-orientation-v1');
  assert.deepEqual(api.footTour.steps.map((s:any)=>s.view),['superior','inferior','inferior','inferior','inferior']);
  for(const [name,region,id] of [['larynxTour','head-neck','laryngeal-framework-orientation'],['malePelvisTour','pelvis','male-pelvic-viscera-orientation']]) {
    assert.equal(api[name].status,'draft');assert.equal(api[name].steps.length,5);
    assert.equal(api.regionalTourFor(region).id,id);assert.equal(api[name].revision,id+'-v1');
    assert.deepEqual(api[name].steps.map((s:any)=>s.view),['anterior','right','posterior','posterior','left']);
  }
  const completedHandTours=api.regionalTours.filter((t:any)=>t.id!==api.lowerVenousTour.id);
  assert.equal(completedHandTours.length,27);
  assert.equal(completedHandTours.reduce((sum:number,tour:any)=>sum+tour.steps.length,0),157);
  const earlierTours=completedHandTours.filter((t:any)=>t.id!==api.handArterialTour.id);
  assert.equal(earlierTours.length,26);
  assert.equal(earlierTours.reduce((sum:number,tour:any)=>sum+tour.steps.length,0),150);
  assert.equal(api.regionalTours.length,28);
  assert.equal(api.regionalTours.reduce((sum:number,tour:any)=>sum+tour.steps.length,0),163);
  assert.deepEqual(api.regionalToursFor('hand').map((t:any)=>t.id),[api.handTour.id,api.carpalTour.id,api.handArterialTour.id]);
  assert.equal(api.tarsalTour.status,'draft');assert.equal(api.tarsalTour.steps.length,7);
  assert.deepEqual(api.regionalToursFor('foot').map((t:any)=>t.id),[api.footTour.id,api.tarsalTour.id]);
  assert.equal(api.renalTour.status,'draft');assert.equal(api.renalTour.steps.length,4);
  assert.deepEqual(api.regionalToursFor('abdomen').map((t:any)=>t.id),[api.celiacTour.id,api.renalTour.id,api.hepatobiliaryTour.id]);
  assert.equal(api.carpalTour.status,'draft');assert.equal(api.carpalTour.steps.length,8);
  assert.deepEqual(api.regionalToursFor('hand').filter((t:any)=>t.id!==api.handArterialTour.id).map((t:any)=>t.id),[api.handTour.id,api.carpalTour.id]);
  assert.equal(api.lumbarTour.status,'draft');assert.equal(api.lumbarTour.steps.length,5);
  assert.deepEqual(api.regionalToursFor('spine').map((t:any)=>t.id),[api.cervicalSpineTour.id,api.lumbarTour.id]);
  assert.equal(api.deepBrainTour.status,'draft');
  assert.equal(api.deepBrainTour.steps.length,6);
  assert.equal(api.deepBrainTour.revision,'deep-brain-commissures-limbic-landmarks-v1');
  assert.equal(api.maleDuctTour.status,'draft');
  assert.equal(api.maleDuctTour.steps.length,6);
  assert.deepEqual(api.regionalToursFor('pelvis').map((t:any)=>t.id),[api.malePelvisTour.id,api.maleDuctTour.id,api.pelvicRingTour.id]);
  assert.equal(api.orbitalTour.status,'draft');
  assert.equal(api.orbitalTour.steps.length,6);
  assert.deepEqual(api.regionalToursFor('head-neck').map((t:any)=>t.id),[api.larynxTour.id,api.orbitalTour.id,api.intrinsicLarynxTour.id,api.deepBrainTour.id,api.circleWillisTour.id]);
  assert.equal(api.chestWallTour.status,'draft');
  assert.equal(api.chestWallTour.steps.length,6);
  assert.deepEqual(api.regionalToursFor('thorax').map((t:any)=>t.id),[api.thoraxTour.id,api.chestWallTour.id]);
  assert.equal(api.regionalTourFor('thorax').id,api.thoraxTour.id);
  assert.deepEqual(api.chestWallTour.steps.map((s:any)=>s.view),['right','right','right','posterior','posterior','superior']);
  for(const tour of api.regionalTours.filter((tour:any)=>tour.id!==api.upperLimbBoneTour.id&&tour.id!==api.hepatobiliaryTour.id&&tour.id!==api.hepatobiliaryTour.id)) {
  const count=tour===api.lowerVenousTour?6:tour===api.circleWillisTour?10:tour===api.pelvicRingTour?5:tour===api.lowerLimbBoneTour?7:tour===api.renalTour?5:tour===api.carpalTour?8:tour===api.tarsalTour?7:tour===api.lumbarTour?5:tour===api.subscapularTour?5:tour===api.deepBrainTour?7:tour===api.intrinsicLarynxTour?10:tour===api.orbitalTour?7:tour===api.chestWallTour?9:({thorax:8,spine:8,abdomen:6,forearm:7,thigh:6,leg:7,hand:7,foot:8,'shoulder-arm':8,'head-neck':6,pelvis:8} as Record<string,number>)[tour.region];
  const ids=new Set([...tour.contextIds,...tour.steps.map((s:any)=>s.selectedId)]);
  assert.equal(ids.size,count);
  for(const id of ids) {
    const packet=await api.bodyReviewMaterial(id);
    assert.equal(packet.schema,'vm-body-review-worksheet-3');
    assert.ok((await api.parseBodyReviewResponse(packet,id)));
    const shared=api.intrinsicLarynxTour.contextIds.includes(id);
    const sharedPelvis=['urinary-bladder','prostate','right-seminal-vesicle'].some(name=>id.endsWith(':'+name));
    const sharedLumbar=id==='vm:anatomy:body:spine:midline:bone:sacrum';
    const sharedAorta=id==='vm:anatomy:body:abdomen:midline:vessel:abdominal-aorta';
    const sharedTarsal=id==='vm:anatomy:body:foot:right:bone:right-calcaneus';
    const previousCount=shared||sharedPelvis||sharedLumbar||sharedAorta||sharedTarsal||api.subscapularTour.contextIds.includes(id)?2:1;
    const gainsHipHeel=api.lowerLimbBoneTour.steps.some((s:any)=>s.selectedId===id)&&!id.endsWith(':right-patella');
    const gainsUpperLimb=[...api.upperLimbBoneTour.contextIds,...api.upperLimbBoneTour.steps.map((step:any)=>step.selectedId)].includes(id);
    const gainsPelvicRing=api.pelvicRingTour.steps.some((step:any)=>step.selectedId===id);
    const priorCount=id==='vm:anatomy:body:thigh:left:bone:left-femur'?0:previousCount;
    assert.equal(packet.guidedTours.length,priorCount+(gainsHipHeel?1:0)+(gainsUpperLimb?1:0)+(gainsPelvicRing?1:0));
    if(sharedTarsal){
      assert.deepEqual(packet.guidedTours.map((e:any)=>e.tour.id),[api.footTour.id,api.tarsalTour.id,api.lowerLimbBoneTour.id]);
      for(const omitted of [api.footTour.id,api.tarsalTour.id,api.lowerLimbBoneTour.id]){
        const changed=structuredClone(packet);changed.guidedTours=changed.guidedTours.filter((e:any)=>e.tour.id!==omitted);
        assert.equal((await api.parseBodyReviewResponse(changed,id)),null,'All three calcaneal teaching sequences are review material');
      }
    }
    if(sharedAorta)assert.deepEqual(packet.guidedTours.map((e:any)=>e.tour.id),[api.celiacTour.id,api.renalTour.id]);
    if(sharedLumbar){
      assert.deepEqual(packet.guidedTours.map((e:any)=>e.tour.id),[api.malePelvisTour.id,api.lumbarTour.id,api.pelvicRingTour.id]);
      for(const omitted of [api.malePelvisTour.id,api.lumbarTour.id,api.pelvicRingTour.id]){
        const changed=structuredClone(packet);changed.guidedTours=changed.guidedTours.filter((e:any)=>e.tour.id!==omitted);
        assert.equal((await api.parseBodyReviewResponse(changed,id)),null,'All three sacral teaching sequences are review material');
      }
    }
    const tourIndex=packet.guidedTours.findIndex((e:any)=>e.tour.id===tour.id);assert.ok(tourIndex>=0);
    if(shared){
      assert.deepEqual(packet.guidedTours.map((e:any)=>e.tour.id),[api.larynxTour.id,api.intrinsicLarynxTour.id]);
      for(const omitted of [api.larynxTour.id,api.intrinsicLarynxTour.id]){
        const changed=structuredClone(packet);changed.guidedTours=changed.guidedTours.filter((e:any)=>e.tour.id!==omitted);
        assert.equal((await api.parseBodyReviewResponse(changed,id)),null,'Neither shared tour can be omitted');
      }
    }
    if(sharedPelvis){
      assert.deepEqual(packet.guidedTours.map((e:any)=>e.tour.id),[api.malePelvisTour.id,api.maleDuctTour.id]);
      for(const omitted of [api.malePelvisTour.id,api.maleDuctTour.id]){
        const changed=structuredClone(packet);changed.guidedTours=changed.guidedTours.filter((e:any)=>e.tour.id!==omitted);
        assert.equal((await api.parseBodyReviewResponse(changed,id)),null,'Neither shared pelvic tour can be omitted');
      }
    }
    assert.deepEqual(packet.guidedTours[tourIndex].tour,tour);
    if(api.subscapularTour.contextIds.includes(id)){
      const required=[api.upperArmTour.id,api.subscapularTour.id,...(gainsUpperLimb?[api.upperLimbBoneTour.id]:[])];
      assert.deepEqual(packet.guidedTours.map((e:any)=>e.tour.id),required);
      for(const omitted of required){
        const changed=structuredClone(packet);changed.guidedTours=changed.guidedTours.filter((e:any)=>e.tour.id!==omitted);
        assert.equal((await api.parseBodyReviewResponse(changed,id)),null,'Shared scapula requires every complete tour record');
      }
    }
    assert.equal(packet.guidedTours[tourIndex].structures.length,count);
    assert.equal(packet.guidedTours[tourIndex].transitionMs,1800);
    assert.equal(packet.guidedTours[tourIndex].transition,'quintic-orbit');
    const context=await api.bodyReviewContext(id);
    assert.ok(context.checklists.teaching.some((c:any)=>c.id==='guided-tour'));
    assert.equal(context.revisions.imaging,null);
    for(const mutate of [
      (p:any)=>{p.guidedTours=[];},
      (p:any)=>{p.guidedTours[tourIndex].tour.steps[0].caption='Changed unreviewed caption';},
      (p:any)=>{p.schema='vm-body-review-worksheet-2';},
      (p:any)=>{p.guidedTours[tourIndex].limitations='Approved';},
      (p:any)=>{p.guidedTours[tourIndex].structures.find((s:any)=>s.id!==id).sources[0].sha256='0'.repeat(64);},
      (p:any)=>{p.guidedTours[tourIndex].structures.find((s:any)=>s.id!==id).bounds.min[0]-=1;},
      (p:any)=>{p.guidedTours[tourIndex].sourceVersion+='-altered';},
    ]) {const altered=structuredClone(packet);mutate(altered);assert.equal((await api.parseBodyReviewResponse(altered,id)),null);}
    if(tour===api.celiacTour) {
      const evidence=packet.guidedTours[tourIndex];
      assert.equal(evidence.structures.find((s:any)=>s.id===tour.steps[0].selectedId).bundle,'celiac-display-corrected');
      assert.equal(evidence.stepFrames.length,5);
      assert.ok(evidence.stepFrames[0].max[0]-evidence.stepFrames[0].min[0]<(evidence.frame.max[0]-evidence.frame.min[0])/2);
      for(const mutate of [
        (p:any)=>{delete p.guidedTours[tourIndex].stepFrames;},
        (p:any)=>{p.guidedTours[tourIndex].stepFrames[0].min[0]-=1;},
        (p:any)=>{delete p.guidedTours[tourIndex].tour.requiredDisplayBundles;},
      ]) {const altered=structuredClone(packet);mutate(altered);assert.equal((await api.parseBodyReviewResponse(altered,id)),null);}
    }
    if(tour===api.intrinsicLarynxTour) {
      const e=packet.guidedTours[tourIndex];
      assert.equal(tour.status,'draft');assert.equal(packet.approval,false);
      assert.equal(e.stepFrames.length,7);assert.equal(tour.steps.length,7);
      assert.deepEqual(e.bundles.map((b:any)=>b.id).sort(),['head-neck-connective-recovery','head-neck-muscles']);
      assert.equal(e.structures.filter((s:any)=>s.category==='muscle').length,7);
      for(const mutate of [
        (p:any)=>{p.guidedTours[tourIndex].tour.steps.reverse();},
        (p:any)=>{p.guidedTours[tourIndex].stepFrames[6].max[0]+=1;},
        (p:any)=>{p.guidedTours.push(structuredClone(p.guidedTours[tourIndex]));},
      ]){const changed=structuredClone(packet);mutate(changed);assert.equal((await api.parseBodyReviewResponse(changed,id)),null);}
    }
    if(tour===api.orbitalTour) {
      const e=packet.guidedTours[tourIndex],globe=tour.contextIds[0];
      assert.equal(e.stepFrames.length,6);
      assert.equal(packet.approval,false);
      assert.deepEqual(e.bundles.map((b:any)=>b.id).sort(),['eye-corrected-parent','head-neck-muscles']);
      assert.ok(e.structures.every((s:any)=>s.laterality==='right'));
      assert.equal(e.structures.find((s:any)=>s.id===globe).bundle,'eye-corrected-parent');
      for(const step of tour.steps)assert.deepEqual(step.frameIds,[step.selectedId,globe]);
      for(const mutate of [
        (p:any)=>{p.guidedTours[tourIndex].structures.find((s:any)=>s.id===globe).bundle='head-neck-organs-recovery';},
        (p:any)=>{p.guidedTours[tourIndex].tour.steps.reverse();},
        (p:any)=>{p.guidedTours[tourIndex].stepFrames[5].max[0]+=1;},
      ]) {const altered=structuredClone(packet);mutate(altered);assert.equal((await api.parseBodyReviewResponse(altered,id)),null);}
    }
    if(tour===api.maleDuctTour) {
      const e=packet.guidedTours[tourIndex];
      assert.equal(packet.approval,false);assert.equal(e.stepFrames.length,6);
      assert.deepEqual(e.bundles.map((b:any)=>b.id).sort(),['abdomen-organs-recovery','deferent-ducts','pelvis-organs','pelvis-organs-gaps','pelvis-organs-recovery']);
      assert.equal(e.structures.find((s:any)=>s.id.endsWith(':right-deferent-duct')).fmaId,'FMA19235');
      assert.match(tour.limitations,/Not a continuous sperm-flow simulation/);
      for(const mutate of [
        (p:any)=>{p.guidedTours[tourIndex].tour.steps.reverse();},
        (p:any)=>{p.guidedTours[tourIndex].stepFrames[5].max[0]+=1;},
        (p:any)=>{p.guidedTours[tourIndex].structures.find((s:any)=>s.id.endsWith(':right-deferent-duct')).fmaId='FMA19236';},
      ]){const changed=structuredClone(packet);mutate(changed);assert.equal((await api.parseBodyReviewResponse(changed,id)),null);}
    }
    if(tour===api.deepBrainTour) {
      const e=packet.guidedTours[tourIndex];
      assert.equal(e.stepFrames.length,6);assert.equal(packet.approval,false);
      assert.deepEqual(e.bundles.map((b:any)=>b.id),['head-neck-nerves-deep-brain']);
      assert.deepEqual(tour.steps.map((s:any)=>e.structures.find((x:any)=>x.id===s.selectedId).fmaId),['FMA86464','FMA61961','FMA72924','FMA72925','FMA72832','FMA74877']);
      assert.ok(!e.structures.some((s:any)=>s.fmaId==='FMA61970'));
      assert.match(tour.limitations,/hippocampus is not shown/);
      for(const mutate of [(p:any)=>{p.guidedTours[tourIndex].tour.steps.reverse();},(p:any)=>{p.guidedTours[tourIndex].stepFrames[5].min[0]-=1;},(p:any)=>{p.guidedTours[tourIndex].structures[0].sources[0].sha256='0'.repeat(64);}]) {
        const altered=structuredClone(packet);mutate(altered);assert.equal((await api.parseBodyReviewResponse(altered,id)),null);
      }
    }
    if(tour===api.larynxTour||tour===api.malePelvisTour) {
      const e=packet.guidedTours[tourIndex];
      assert.equal(e.stepFrames.length,5);
      assert.deepEqual(e.bundles.map((b:any)=>b.id).sort(),tour.region==='head-neck'
        ?['head-neck-connective-recovery','head-neck-organs-visceral-detail','head-neck-skeleton']
        :['pelvis-organs','pelvis-organs-recovery','pelvis-skeleton','spine-skeleton']);
      assert.ok(e.structures.every((s:any)=>!s.id.includes('independent')));
      for(const step of tour.steps)assert.deepEqual(step.frameIds,[step.selectedId]);
      for(const mutate of [(p:any)=>{p.guidedTours[tourIndex].tour.contextIds=['independent-female-pelvis'];},(p:any)=>{p.guidedTours[tourIndex].stepFrames[0].max[1]+=1;}]) {
        const altered=structuredClone(packet);mutate(altered);assert.equal((await api.parseBodyReviewResponse(altered,id)),null);
      }
    }
    if(tour===api.subscapularTour){
      const e=packet.guidedTours[tourIndex];
      assert.equal(e.stepFrames.length,4);
      assert.deepEqual(e.bundles.map((b:any)=>b.id).sort(),['shoulder-arm-skeleton','shoulder-arm-vessels-recovery','subscapular-arteries']);
      assert.ok(e.structures.every((s:any)=>s.laterality==='right'));
      for(const mutate of [
        (p:any)=>{delete p.guidedTours[tourIndex].stepFrames;},
        (p:any)=>{p.guidedTours[tourIndex].stepFrames[3].max[0]+=1;},
        (p:any)=>{p.guidedTours[tourIndex].structures[0].laterality='left';},
        (p:any)=>{delete p.guidedTours[tourIndex].tour.requiredDisplayBundles;},
      ]){const altered=structuredClone(packet);mutate(altered);assert.equal((await api.parseBodyReviewResponse(altered,id)),null);}
    }
    if(tour===api.carpalTour||tour===api.tarsalTour){
      const evidence=packet.guidedTours[tourIndex];
      assert.deepEqual(evidence.bundles.map((b:any)=>b.id),[tour===api.carpalTour?'hand-skeleton':'foot-skeleton']);
      assert.ok(evidence.structures.every((s:any)=>s.laterality==='right'&&s.category==='bone'));
      assert.equal(evidence.stepFrames.length,tour===api.carpalTour?8:7);
      for(const step of tour.steps)assert.deepEqual(step.frameIds,tour.steps.map((s:any)=>s.selectedId));
    }
    if(tour===api.handArterialTour){
      const evidence=packet.guidedTours[tourIndex];
      assert.deepEqual(evidence.bundles.map((b:any)=>b.id).sort(),['hand-vessels-hand-vascular','hand-vessels-recovery']);
      assert.ok(evidence.structures.every((s:any)=>s.laterality==='right'&&s.category==='vessel'));
      assert.equal(evidence.stepFrames.length,7);
      assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.transitionMs,1800);
      assert.deepEqual(tour.contextIds,[]);assert.equal(evidence.separation,0);
      for(const step of tour.steps)assert.ok(step.frameIds.includes(step.selectedId));
    }
    if(tour!==api.carpalTour&&tour!==api.tarsalTour&&tour!==api.subscapularTour&&tour!==api.handArterialTour&&['forearm','thigh','leg','hand','foot','shoulder-arm'].includes(tour.region)) {
      const evidence=packet.guidedTours[tourIndex];
      assert.ok(evidence.structures.every((s:any)=>s.laterality==='right'));
      assert.deepEqual(evidence.bundles.map((b:any)=>b.id).sort(),[
        tour.region+'-muscles',...(['thigh','shoulder-arm'].includes(tour.region)?[tour.region+'-muscles-dissection']:[]),tour.region+'-skeleton',
      ]);
      assert.equal(evidence.stepFrames.length,tour.steps.length);
      for(const step of evidence.tour.steps)assert.deepEqual(step.frameIds,[step.selectedId]);
      for(const mutate of [
        (p:any)=>{delete p.guidedTours[tourIndex].stepFrames;},
        (p:any)=>{p.guidedTours[tourIndex].stepFrames[4].max[0]+=1;},
        (p:any)=>{p.guidedTours[tourIndex].structures[0].laterality='left';},
        (p:any)=>{delete p.guidedTours[tourIndex].structures[0].laterality;},
      ]) {const altered=structuredClone(packet);mutate(altered);assert.equal((await api.parseBodyReviewResponse(altered,id)),null);}
    }
  }
  }
  const js=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  assert.ok(js.includes('right-subscapular-arterial-relationships-v1'));
  for(const region of ['thigh','leg','hand','foot','upper-arm'])assert.ok(js.includes('right-'+region+'-muscle-orientation-v1'));
  for(const id of ['laryngeal-framework-orientation-v1','male-pelvic-viscera-orientation-v1','right-orbital-muscle-orientation-v1','intrinsic-larynx-muscle-orientation-v1','male-pelvic-duct-landmarks-v1'])assert.ok(js.includes(id));
  for(const label of ['Cervical spine: C1 to T1','cervical-spine-orientation','C7 · Vertebra prominens','Coeliac trunk & branches','celiac-branches-orientation-v2','Right forearm: muscle orientation','right-forearm-muscle-orientation-v1','Pronator quadratus · Distal close-up']) assert.ok(js.includes(label),label);
  assert.ok(readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8').includes('{evidence.tour.region} learner'));
  assert.ok(readFileSync('atlas-review/app/review/body/review-dashboard.tsx','utf8').includes('Camera close-up:'));
});

test('regional learner and review retain compact guided teaching and reading pause',()=>{
  const inputs=JSON.parse(readFileSync('public/atlas-runtime/head-neck/source-inputs.json','utf8'));
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  for(const path of ['app/regional-guided-learning.tsx','app/regional-guided-learning.css','app/body-explorer.tsx']) {
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,review.files.find((f:any)=>f.path===path)?.sourceSha256,path);
  }
  const player=readFileSync('atlas-review/app/regional-guided-learning.tsx','utf8');
  assert.ok(player.includes("setExplanationOpen(!window.matchMedia('(max-width: 600px)').matches)"));
  assert.ok(player.includes('<details className="regional-tour-explanation" open={explanationOpen}'));
  assert.ok(player.includes('if(open){setPlaying(false);setMotionPaused(true);}'));
  const css=readFileSync('atlas-review/app/regional-guided-learning.css','utf8');
  assert.ok(css.includes('[data-shared-header="true"][data-guided-learning="true"]>.region-heading-compact'));
});

test('all structure-check hosts deliver the corrected success/retry component',()=>{
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const path='app/structure-quick-check.tsx';
  const source=readFileSync('atlas-review/'+path,'utf8');
  assert.ok(source.includes('isCorrect ? "Practise again" : "Try again"'));
  for(const module of ['shoulder','head-neck']) {
    const base=`public/atlas-runtime/${module}/`;
    const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
    const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
    assert.equal(manifest.sourceCommit,'1517521a5ee3eed985fff01bcd8608965b693fae');
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,review.files.find((f:any)=>f.path===path)?.sourceSha256);
    const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
    for(const text of ['Practise again','Try again','Correct.','Incorrect.']) assert.ok(js.includes(text),module+': '+text);
  }
  // Independent specimen viewers use a different identification exercise.
  for(const module of ['lower-limb','female-pelvis']) {
    const inputs=JSON.parse(readFileSync(`public/atlas-runtime/${module}/source-inputs.json`,'utf8'));
    assert.ok(!inputs.some((f:any)=>f.path===path),'unexpected additional quick-check host');
  }
});
