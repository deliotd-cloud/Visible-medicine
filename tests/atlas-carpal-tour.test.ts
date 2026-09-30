import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('carpal tour import preserves all models and delivers exact assembled source evidence',async()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const prior=(p:string)=>JSON.parse(execFileSync('git',['show','6302b12:'+p],{encoding:'utf8',maxBuffer:32e6}));
 const review=json('atlas-review/manifest.json'),before=prior('atlas-review/manifest.json');
 assert.equal(review.revision,'11ba63422686e0f8666bf18769c67485dc518d19');
 const saved=JSON.parse(execFileSync('git',['show','047d488a:atlas-review/manifest.json'],{encoding:'utf8'}));
 assert.deepEqual(saved.files.filter((f:any)=>before.files.find((p:any)=>p.path===f.path)?.sourceSha256!==f.sourceSha256).map((f:any)=>f.path).sort(),[
  'LICENSES/THIRD_PARTY_NOTICES.md','content/body-renderer-revision.json','lib/carpal-tour.ts','lib/regional-tours.ts',
 ]);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
 assert.equal(json('public/atlas-runtime/head-neck/manifest.json').sourceCommit,review.revision);
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of ['lib/carpal-tour.ts','lib/regional-tours.ts']){
  const file=review.files.find((f:any)=>f.path===path);
  assert.equal(file.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256);
  assert.equal(file.importedSha256,createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'));
 }
 const built=await build({stdin:{contents:"export * from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
 const tour=api.carpalTour,names=['scaphoid','lunate','triquetral','pisiform','trapezium','trapezoid','capitate','hamate'];
 const ids=names.map(n=>'vm:anatomy:body:hand:right:bone:right-'+n);
 assert.deepEqual(tour.steps.map((s:any)=>s.selectedId),ids);assert.equal(api.regionalTourFor('hand').id,api.handTour.id);
 assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map(id=>[id,'hand-skeleton'])));
 for(const id of ids){
  const packet=await api.bodyReviewMaterial(id);assert.equal(packet.approval,false);assert(api.parseBodyReviewResponse(packet,id));
  const evidence=packet.guidedTours.find((e:any)=>e.tour.id===tour.id);assert.deepEqual(evidence.tour,tour);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  for(const step of tour.steps)assert.deepEqual(step.frameIds,ids);
  for(const mutate of [(p:any)=>p.guidedTours=[],(p:any)=>p.guidedTours[0].tour.steps[0].caption+=' changed',(p:any)=>p.guidedTours[0].tour.revision+='-stale']){
   const changed=structuredClone(packet);mutate(changed);assert.equal(api.parseBodyReviewResponse(changed,id),null);
  }
 }
});
