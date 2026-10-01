import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

test('tarsal learner and review imports preserve source geometry, previous tours and independent imaging',async()=>{
 const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const prior=(p:string)=>JSON.parse(execFileSync('git',['show','3316fb7a:'+p],{encoding:'utf8',maxBuffer:32e6}));
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,'7d3010368fc53e3433e8df4f9e9d4ddb67e786e8');
 for(const module of ['head-neck','shoulder'])assert.equal(json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,review.revision);
 assert.deepEqual(json('lib/atlas-model-inventory.json').models,prior('lib/atlas-model-inventory.json').models);
 const inputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 for(const path of ['lib/tarsal-tour.ts','lib/regional-tours.ts']){
  const file=review.files.find((f:any)=>f.path===path);assert.equal(file.sourceSha256,inputs.find((f:any)=>f.path===path)?.sha256);
  assert.equal(file.importedSha256,createHash('sha256').update(readFileSync('atlas-review/'+path)).digest('hex'));
 }
 const compile=async(contents:string)=>{
  const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 };
 const api=await compile("export * from './atlas-review/lib/regional-tours';export * from './atlas-review/lib/body-review-material';export * from './atlas-review/lib/body-review-response';");
 const old=await compile(execFileSync('git',['show','3316fb7a:atlas-review/lib/regional-tours.ts'],{encoding:'utf8'}).replaceAll("from './","from './atlas-review/lib/"));
 const tour=api.tarsalTour;
 const names=['right-talus','right-calcaneus','navicular-bone-of-right-foot','right-cuboid-bone','right-medial-cuneiform-bone','right-intermediate-cuneiform-bone','right-lateral-cuneiform-bone'];
 const ids=names.map(n=>'vm:anatomy:body:foot:right:bone:'+n);
 assert.deepEqual(tour.steps.map((s:any)=>s.selectedId),ids);assert.equal(tour.status,'draft');
 assert.equal(api.regionalTourFor('foot').id,api.footTour.id);assert.equal(api.regionalToursFor('foot').length,2);
 assert.equal(api.regionalTours.length,23);assert.equal(api.regionalTours.reduce((n:number,t:any)=>n+t.steps.length,0),130);
 assert.deepEqual(api.regionalTours.filter((t:any)=>t.id!==tour.id&&t.id!==api.lowerLimbBoneTour.id&&t.id!==api.upperLimbBoneTour.id),old.regionalTours,'All twenty previous tour definitions retained');
 assert.deepEqual(tour.requiredDisplayBundles,Object.fromEntries(ids.map(id=>[id,'foot-skeleton'])));
 for(const id of ids){
  const packet=await api.bodyReviewMaterial(id);assert.equal(packet.approval,false);assert(await api.parseBodyReviewResponse(packet,id));
  const index=packet.guidedTours.findIndex((e:any)=>e.tour.id===tour.id),evidence=packet.guidedTours[index];assert.deepEqual(evidence.tour,tour);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);assert.equal(evidence.stepFrames.length,7);
  assert.deepEqual(packet.guidedTours.filter((e:any)=>e.tour.id!==tour.id&&e.tour.id!==api.lowerLimbBoneTour.id&&e.tour.id!==api.upperLimbBoneTour.id),old.regionalTourEvidence({structures:packet.guidedTours.flatMap((e:any)=>e.structures).filter((s:any,i:number,a:any[])=>a.findIndex(x=>x.id===s.id)===i),bundles:packet.guidedTours.flatMap((e:any)=>e.bundles).filter((b:any,i:number,a:any[])=>a.findIndex(x=>x.id===b.id)===i),coordinateSystem:evidence.coordinateSystem,sourceVersion:evidence.sourceVersion},id));
  for(const step of tour.steps)assert.deepEqual(step.frameIds,ids);
  for(const mutate of [(p:any)=>p.guidedTours.splice(index,1),(p:any)=>p.guidedTours[index].tour.steps[0].caption+=' changed',(p:any)=>p.guidedTours[index].tour.revision+='-stale',(p:any)=>p.guidedTours[index].stepFrames[0].min[0]-=1,(p:any)=>p.guidedTours[index].transition='linear']){
   const changed=structuredClone(packet);mutate(changed);assert.equal(await api.parseBodyReviewResponse(changed,id),null);
  }
 }
 // Preserve the historical tarsal delta; the hip-to-heel regression checks later pins.
 const oldPins=prior('atlas-review/content/body-review-display-pins.json'),pins=JSON.parse(execFileSync('git',['show','ae7e39ef:atlas-review/content/body-review-display-pins.json'],{encoding:'utf8',maxBuffer:4e6}));
 assert.deepEqual(pins.pins.filter((p:any,i:number)=>JSON.stringify(p)!==JSON.stringify(oldPins.pins[i])).map((p:any)=>p.structureId).sort(),[...ids].sort());
 const notes=readFileSync('atlas-review/app/tour-imaging-notes.tsx','utf8');
 assert.match(notes,/No scan loaded or spatial alignment/);assert.match(notes,/Imaging cases and paid lectures require their own access/);
});
