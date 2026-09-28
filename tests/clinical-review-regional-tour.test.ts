import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('all twelve regional tours ship complete source-bound review evidence', async () => {
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const base='public/atlas-runtime/head-neck/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(learner.sourceCommit,review.revision);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  for(const path of ['lib/regional-tours.ts','lib/chest-wall-tour.ts','app/regional-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx']) {
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
  assert.equal(api.upperArmTour.steps.length,6);
  assert.equal(api.regionalTourFor('shoulder-arm').id,'right-upper-arm-muscle-orientation');
  assert.equal(api.upperArmTour.revision,'right-upper-arm-muscle-orientation-v1');
  assert.deepEqual(api.footTour.steps.map((s:any)=>s.view),['superior','inferior','inferior','inferior','inferior']);
  for(const [name,region,id] of [['larynxTour','head-neck','laryngeal-framework-orientation'],['malePelvisTour','pelvis','male-pelvic-viscera-orientation']]) {
    assert.equal(api[name].status,'draft');assert.equal(api[name].steps.length,5);
    assert.equal(api.regionalTourFor(region).id,id);assert.equal(api[name].revision,id+'-v1');
    assert.deepEqual(api[name].steps.map((s:any)=>s.view),['anterior','right','posterior','posterior','left']);
  }
  assert.equal(api.regionalTours.length,12);
  assert.equal(api.chestWallTour.status,'draft');
  assert.equal(api.chestWallTour.steps.length,6);
  assert.deepEqual(api.regionalToursFor('thorax').map((t:any)=>t.id),[api.thoraxTour.id,api.chestWallTour.id]);
  assert.equal(api.regionalTourFor('thorax').id,api.thoraxTour.id);
  assert.deepEqual(api.chestWallTour.steps.map((s:any)=>s.view),['right','right','right','posterior','posterior','superior']);
  for(const tour of api.regionalTours) {
  const count=tour===api.chestWallTour?9:({thorax:8,spine:8,abdomen:6,forearm:7,thigh:6,leg:7,hand:7,foot:8,'shoulder-arm':8,'head-neck':6,pelvis:8} as Record<string,number>)[tour.region];
  const ids=new Set([...tour.contextIds,...tour.steps.map((s:any)=>s.selectedId)]);
  assert.equal(ids.size,count);
  for(const id of ids) {
    const packet=await api.bodyReviewMaterial(id);
    assert.equal(packet.schema,'vm-body-review-worksheet-3');
    assert.ok(api.parseBodyReviewResponse(packet,id));
    assert.equal(packet.guidedTours.length,1);
    assert.deepEqual(packet.guidedTours[0].tour,tour);
    assert.equal(packet.guidedTours[0].structures.length,count);
    assert.equal(packet.guidedTours[0].transitionMs,1800);
    assert.equal(packet.guidedTours[0].transition,'quintic-orbit');
    const context=await api.bodyReviewContext(id);
    assert.ok(context.checklists.teaching.some((c:any)=>c.id==='guided-tour'));
    assert.equal(context.revisions.imaging,null);
    for(const mutate of [
      (p:any)=>{p.guidedTours=[];},
      (p:any)=>{p.guidedTours[0].tour.steps[0].caption='Changed unreviewed caption';},
      (p:any)=>{p.schema='vm-body-review-worksheet-2';},
      (p:any)=>{p.guidedTours[0].limitations='Approved';},
      (p:any)=>{p.guidedTours[0].structures.find((s:any)=>s.id!==id).sources[0].sha256='0'.repeat(64);},
      (p:any)=>{p.guidedTours[0].structures.find((s:any)=>s.id!==id).bounds.min[0]-=1;},
      (p:any)=>{p.guidedTours[0].sourceVersion+='-altered';},
    ]) {const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,id),null);}
    if(tour===api.celiacTour) {
      const evidence=packet.guidedTours[0];
      assert.equal(evidence.structures.find((s:any)=>s.id===tour.steps[0].selectedId).bundle,'celiac-display-corrected');
      assert.equal(evidence.stepFrames.length,5);
      assert.ok(evidence.stepFrames[0].max[0]-evidence.stepFrames[0].min[0]<(evidence.frame.max[0]-evidence.frame.min[0])/2);
      for(const mutate of [
        (p:any)=>{delete p.guidedTours[0].stepFrames;},
        (p:any)=>{p.guidedTours[0].stepFrames[0].min[0]-=1;},
        (p:any)=>{delete p.guidedTours[0].tour.requiredDisplayBundles;},
      ]) {const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,id),null);}
    }
    if(['head-neck','pelvis'].includes(tour.region)) {
      const e=packet.guidedTours[0];
      assert.equal(e.stepFrames.length,5);
      assert.deepEqual(e.bundles.map((b:any)=>b.id).sort(),tour.region==='head-neck'
        ?['head-neck-connective-recovery','head-neck-organs-visceral-detail','head-neck-skeleton']
        :['pelvis-organs','pelvis-organs-recovery','pelvis-skeleton','spine-skeleton']);
      assert.ok(e.structures.every((s:any)=>!s.id.includes('independent')));
      for(const step of tour.steps)assert.deepEqual(step.frameIds,[step.selectedId]);
      for(const mutate of [(p:any)=>{p.guidedTours[0].tour.contextIds=['independent-female-pelvis'];},(p:any)=>{p.guidedTours[0].stepFrames[0].max[1]+=1;}]) {
        const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,id),null);
      }
    }
    if(['forearm','thigh','leg','hand','foot','shoulder-arm'].includes(tour.region)) {
      const evidence=packet.guidedTours[0];
      assert.ok(evidence.structures.every((s:any)=>s.laterality==='right'));
      assert.deepEqual(evidence.bundles.map((b:any)=>b.id).sort(),[
        tour.region+'-muscles',...(['thigh','shoulder-arm'].includes(tour.region)?[tour.region+'-muscles-dissection']:[]),tour.region+'-skeleton',
      ]);
      assert.equal(evidence.stepFrames.length,tour.steps.length);
      for(const step of evidence.tour.steps)assert.deepEqual(step.frameIds,[step.selectedId]);
      for(const mutate of [
        (p:any)=>{delete p.guidedTours[0].stepFrames;},
        (p:any)=>{p.guidedTours[0].stepFrames[4].max[0]+=1;},
        (p:any)=>{p.guidedTours[0].structures[0].laterality='left';},
        (p:any)=>{delete p.guidedTours[0].structures[0].laterality;},
      ]) {const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,id),null);}
    }
  }
  }
  const js=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  for(const region of ['thigh','leg','hand','foot','upper-arm'])assert.ok(js.includes('right-'+region+'-muscle-orientation-v1'));
  for(const id of ['laryngeal-framework-orientation-v1','male-pelvic-viscera-orientation-v1'])assert.ok(js.includes(id));
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
    assert.equal(manifest.sourceCommit,review.revision);
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
