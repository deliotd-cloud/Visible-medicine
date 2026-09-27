import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

test('thoracic tour ships with the same complete source-bound review evidence', async () => {
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
  const ids=new Set([...api.thoraxTour.contextIds,...api.thoraxTour.steps.map((s:any)=>s.selectedId)]);
  assert.equal(ids.size,8);
  for(const id of ids) {
    const packet=await api.bodyReviewMaterial(id);
    assert.equal(packet.schema,'vm-body-review-worksheet-3');
    assert.ok(api.parseBodyReviewResponse(packet,id));
    assert.equal(packet.guidedTours.length,1);
    assert.deepEqual(packet.guidedTours[0].tour,api.thoraxTour);
    assert.equal(packet.guidedTours[0].structures.length,8);
    assert.equal(packet.guidedTours[0].transitionMs,1800);
    assert.equal(packet.guidedTours[0].transition,'quintic-orbit');
    const context=await api.bodyReviewContext(id);
    assert.ok(context.checklists.teaching.some((c:any)=>c.id==='guided-tour'));
    assert.equal(context.revisions.imaging,null);
    for(const mutate of [
      (p:any)=>{p.guidedTours=[];},
      (p:any)=>{p.guidedTours[0].tour.steps[0].caption='Changed unreviewed caption';},
      (p:any)=>{p.schema='vm-body-review-worksheet-2';},
    ]) {const altered=structuredClone(packet);mutate(altered);assert.equal(api.parseBodyReviewResponse(altered,id),null);}
  }
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
