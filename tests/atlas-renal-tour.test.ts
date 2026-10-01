import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('renal learner and review imports bind the same unchanged geometry and four-step draft',async()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8')),review=json('atlas-review/manifest.json');
 assert.equal(review.revision,'bc03ed3f7324819f4bfa3e7cd0afb7203cc8e3b8');
 for(const module of ['head-neck','shoulder'])assert.equal(json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,review.revision);
 const prior=JSON.parse(execFileSync('git',['show','9baaa9e5:lib/atlas-model-inventory.json'],{encoding:'utf8'}));
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior.models);
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of ['lib/renal-tour.ts','lib/regional-tours.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert.equal(file.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256);
  assert.equal(file.importedSha256,createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'));
 }
 const result=await build({stdin:{contents:"export * from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')),tour=api.renalTour;
 const ids=['right:organ:right-kidney','right:vessel:right-renal-artery','left:organ:left-kidney','left:vessel:left-renal-artery'].map(n=>'vm:anatomy:body:abdomen:'+n);
 assert.deepEqual(tour.steps.map((s:any)=>s.selectedId),ids);assert.equal(tour.status,'draft');assert.equal(api.regionalTourFor('abdomen').id,api.celiacTour.id);
 assert.equal(api.regionalTours.length,23);assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),130);
 for(const id of [...ids,...tour.contextIds]){
  const packet=await api.bodyReviewMaterial(id);assert.equal(packet.approval,false);assert((await api.parseBodyReviewResponse(packet,id)));
  const index=packet.guidedTours.findIndex((e:any)=>e.tour.id===tour.id),evidence=packet.guidedTours[index];assert.deepEqual(evidence.tour,tour);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);assert.equal(evidence.stepFrames.length,4);
  for(const step of tour.steps)assert.deepEqual(step.frameIds,ids);
  for(const mutate of [(p:any)=>p.guidedTours.splice(index,1),(p:any)=>p.guidedTours[index].tour.steps[0].caption+=' changed',(p:any)=>p.guidedTours[index].tour.revision+='-stale',(p:any)=>p.guidedTours[index].stepFrames[0].min[0]-=1]){
   const changed=structuredClone(packet);mutate(changed);assert.equal((await api.parseBodyReviewResponse(changed,id)),null);
  }
 }
});
