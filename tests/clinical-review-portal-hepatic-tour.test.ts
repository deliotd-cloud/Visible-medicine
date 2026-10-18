import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const sourceCommit='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const revision='portal-hepatic-venous-relationships-20261014-r1';
const base='public/atlas-runtime/head-neck/';
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
type Entry={id:string;name:string;fmaId:string;bundle:string;bounds:{min:number[];max:number[]};validation:{anatomicalReview:boolean};sources:{sha256:string}[]};
type File={path:string;sha256:string;sourceSha256?:string};

const apiPromise=build({stdin:{contents:"export {portalHepaticTour,portalHepaticTourMatches} from './atlas-review/lib/portal-hepatic-tour';export {regionalTourStructures,regionalTourStepFrames} from './atlas-review/lib/regional-tours';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {bodyReviewContext} from './atlas-review/lib/body-review-context';export {blankBodyReview} from './atlas-review/lib/body-review-decisions';export {postBodyDecision} from './atlas-review/lib/body-review-api';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {default as rawCatalog} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'}).then(result=>import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')));

test('portal/hepatic guide binds the exact imported sources, frames and draft Review evidence',async()=>{
 const learner=json(base+'manifest.json'),review=json('atlas-review/manifest.json');
 assert.equal(learner.patientDataIncluded,false);assert.equal(review.revision,sourceCommit);
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])
  assert.equal(json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,sourceCommit,module);
 const inputs:File[]=json(base+'source-inputs.json');
 for(const path of ['lib/portal-hepatic-tour.ts','content/portal-hepatic-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find(f=>f.path===path),imported=review.files.find((f:File)=>f.path===path);
  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256,path);
 }
 const reviewMaterial=review.files.find((f:File)=>f.path==='lib/body-review-material.ts');
 assert(reviewMaterial);assert.equal(sha(readFileSync('atlas-review/lib/body-review-material.ts')),reviewMaterial.sourceSha256);
 const pins=json('atlas-review/content/portal-hepatic-tour-pins.json');
 assert.equal(sha(JSON.stringify(pins)),'7429d92e7eadb56a81f75759371fb0678cb7936998b37f203b9350ecbe35b261');
 assert.equal(pins.baseline,'b9269c83867fbcae73e0de19ae6ca818fefb713a');assert.equal(pins.tourRevision,revision);
 const targets:Entry[]=pins.entries,context:Entry[]=pins.contextEntries,all=[...targets,...context];
 assert.deepEqual(targets.map(s=>s.fmaId),['FMA14332','FMA14331','FMA15391','FMA50735','FMA14338','FMA14340','FMA14339','FMA10951']);
 assert.deepEqual(context.map(s=>s.fmaId),['FMA7197','FMA7198','FMA7196']);
 assert.equal(new Set(all.map(s=>s.id)).size,11);
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),['abdomen-organs','abdomen-vessels-mesenteric','abdomen-vessels-recovery','hepatic-veins','pancreas-corrected-parent','portal-veins']);
 const api=await apiPromise,catalog=api.bodyDisplayCatalog(api.rawCatalog),tour=api.portalHepaticTour;
 assert.equal(catalog.structures.length,1104);assert.equal(api.portalHepaticTourMatches(catalog,tour),true);
 assert.equal(tour.id,'portal-hepatic-venous-relationships');assert.equal(tour.region,'abdomen');assert.equal(tour.revision,revision);assert.equal(tour.status,'draft');
 assert.deepEqual(tour.contextIds,context.map(s=>s.id));assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),targets.map(s=>s.id));
 assert.deepEqual(tour.steps.map((s:{title:string})=>s.title),targets.map(s=>s.name));
 assert.deepEqual(tour.steps.map((s:{view:string})=>s.view),['anterior','posterior','left','anterior','right','anterior','left','posterior']);
 assert.deepEqual(tour.steps.map((s:{frameIds:string[]})=>s.frameIds),[[0,1,3,9],[0,1,3,9],[1,2,3],[0,1,3,9],[4,5,6],[4,5,6],[4,5,6],[4,5,6,7]].map(group=>group.map(i=>all[i].id)));
 assert.deepEqual(api.regionalTourStructures(catalog,tour),[...context,...targets]);
 const frames=api.regionalTourStepFrames(catalog,tour);assert.equal(frames.length,8);
 for(const [i,step] of tour.steps.entries()){
  const local:Entry[]=step.frameIds.map((id:string)=>{const found=all.find(s=>s.id===id);assert(found,id);return found;});
  assert.deepEqual(frames[i],{min:[0,1,2].map(axis=>Math.min(...local.map(s=>s.bounds.min[axis]))),max:[0,1,2].map(axis=>Math.max(...local.map(s=>s.bounds.max[axis])))});
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.caption.trim());
 }
 const learnerJs=learner.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const step of tour.steps)assert(learnerJs.includes(step.caption),step.id);
 for(const entry of all){
  assert.equal(entry.validation.anatomicalReview,false);
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.equal(packet.topics.length,9);
  assert.deepEqual(packet.source.structure,entry);
  const guided=packet.guidedTours.filter((g:{tour:{id:string}})=>g.tour.id===tour.id);assert.equal(guided.length,1);
  const evidence=guided[0];assert.deepEqual(evidence.tour,wire(tour));assert.deepEqual(evidence.structures,[...context,...targets]);
  assert.deepEqual(evidence.stepFrames,frames);assert.deepEqual(evidence.bundles,pins.bundles);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  assert.equal(evidence.patientRegistered,undefined);assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
 }
});

test('portal/hepatic source and altered Review submissions fail before private storage',async()=>{
 const api=await apiPromise,catalog=api.bodyDisplayCatalog(api.rawCatalog),tour=api.portalHepaticTour;
 const pins=json('atlas-review/content/portal-hepatic-tour-pins.json');
 const all:Entry[]=[...pins.entries,...pins.contextEntries];
 for(const entry of all){
  assert.equal(api.portalHepaticTourMatches({...catalog,structures:catalog.structures.filter((s:Entry)=>s.id!==entry.id)},tour),false,entry.id+' missing');
  assert.equal(api.portalHepaticTourMatches({...catalog,structures:[...catalog.structures,entry]},tour),false,entry.id+' duplicate');
  const altered=wire(entry);altered.sources[0].sha256='0'.repeat(64);
  assert.equal(api.portalHepaticTourMatches({...catalog,structures:catalog.structures.map((s:Entry)=>s.id===entry.id?altered:s)},tour),false,entry.id+' source');
 }
 for(const bundle of pins.bundles){
  assert.equal(api.portalHepaticTourMatches({...catalog,bundles:catalog.bundles.filter((b:{id:string})=>b.id!==bundle.id)},tour),false,bundle.id+' missing');
  assert.equal(api.portalHepaticTourMatches({...catalog,bundles:[...catalog.bundles,bundle]},tour),false,bundle.id+' duplicate');
 }
 for(const change of [(bad:any)=>bad.steps.reverse(),(bad:any)=>bad.steps[0].frameIds.reverse(),(bad:any)=>{bad.revision='foreign';},(bad:any)=>{bad.contextIds=[];}]){
  const bad=wire(tour);change(bad);assert.equal(api.portalHepaticTourMatches(catalog,bad),false);
 }
 let storageCalls=0;const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
 for(const entry of all){
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  for(const change of ['removed','duplicate','caption','source','context','frame','revision','bundle','transition','registration','approval']){
   const bad=wire(packet),at=bad.guidedTours.findIndex((g:{tour:{id:string}})=>g.tour.id===tour.id),item=bad.guidedTours[at];
   assert(at>=0);
   if(change==='removed')bad.guidedTours.splice(at,1);
   if(change==='duplicate')bad.guidedTours.push(wire(item));
   if(change==='caption')item.tour.steps[0].caption='Altered';
   if(change==='source')item.structures[0].sources[0].sha256='0'.repeat(64);
   if(change==='context')item.tour.contextIds=[];
   if(change==='frame')item.stepFrames[0].max[0]+=0.1;
   if(change==='revision')item.tour.revision='foreign';
   if(change==='bundle')item.bundles[0].sha256='0'.repeat(64);
   if(change==='transition')item.transitionMs=0;
   if(change==='registration')item.patientRegistered=true;
   if(change==='approval')bad.approval=true;
   assert.equal(await api.parseBodyReviewResponse(bad,entry.id),null,`${entry.id}: ${change}`);
  }
  const context=await api.bodyReviewContext(entry.id);
  const decision={catalogScope:context.catalogScope,structureId:entry.id,track:'teaching',expectedVersion:0,
   materialHash:context.materialHash,revisionHash:context.revisions.teaching,checklistVersion:context.checklistVersion,
   draft:api.blankBodyReview(context,'teaching')};
  const save=(input:unknown)=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-portal-hepatic-reviewer'},body:JSON.stringify(input),
  }),storage);
  assert.equal((await save({...decision,materialHash:'0'.repeat(64)})).status,409,entry.id+' stale material');
  assert.equal((await save({...decision,revisionHash:'0'.repeat(64)})).status,409,entry.id+' stale revision');
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await save(forged)).status,422,entry.id+' forged checklist');
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await save(approval)).status,422,entry.id+' forged approval');
 }
 assert.equal(storageCalls,0);
});
