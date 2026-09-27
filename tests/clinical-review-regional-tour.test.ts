import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('thoracic, cervical and coeliac tours ship complete source-bound review evidence', async () => {
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  const base='public/atlas-runtime/head-neck/';
  const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(learner.sourceCommit,review.revision);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  for(const path of ['lib/regional-tours.ts','app/regional-guided-learning.tsx','lib/tour-camera.ts','app/fitted-camera.tsx']) {
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
  for(const tour of [api.thoraxTour,api.cervicalSpineTour,api.celiacTour]) {
  const count=tour===api.celiacTour?6:8;
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
  }
  }
  const js=learner.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>readFileSync(base+f.path,'utf8')).join('\n');
  for(const label of ['Cervical spine: C1 to T1','cervical-spine-orientation','C7 · Vertebra prominens','Coeliac trunk & branches','celiac-branches-orientation-v2']) assert.ok(js.includes(label),label);
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
