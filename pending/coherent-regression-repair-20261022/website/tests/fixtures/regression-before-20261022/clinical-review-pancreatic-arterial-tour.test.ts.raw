import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
type Entry={id:string;name:string;fmaId:string;bundle:string;bounds:{min:number[];max:number[]};validation:{anatomicalReview:boolean}};
type File={path:string;sha256:string;sourceSha256?:string};

test('pancreatic arterial guide binds fourteen exact source records, frames and draft Review evidence',async()=>{
 const base='public/atlas-runtime/head-neck/',learner=json(base+'manifest.json'),review=json('atlas-review/manifest.json');
 assert.equal(learner.patientDataIncluded,false);assert.equal(review.revision,learner.sourceCommit);
 for(const module of ['head-neck','shoulder','lower-limb','female-pelvis'])assert.equal(json('public/atlas-runtime/'+module+'/manifest.json').sourceCommit,review.revision);
 const inputs:File[]=json(base+'source-inputs.json');
 for(const path of ['lib/pancreatic-arterial-tour.ts','content/pancreatic-arterial-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find(f=>f.path===path),imported=review.files.find((f:File)=>f.path===path);
  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256,path);
 }
 const pins=json('atlas-review/content/pancreatic-arterial-tour-pins.json');
 assert.equal(sha(JSON.stringify(pins)),'c4937798b398b806fc0b765582ccf9a49047187ee0edb2bb6d7a7289bee75e0d');
 assert.equal(pins.baseline,'1604303bb9377dd2390e840c079652eb59c47fb0');
 assert.equal(pins.tourRevision,'pancreatic-arterial-relationships-20261012-r1');
 assert.deepEqual(pins.entries.map((e:Entry)=>e.fmaId),['FMA14782','FMA14784','FMA14805','FMA70479','FMA70480','FMA14787','FMA14790','FMA14792','FMA14793']);
 assert.deepEqual(pins.contextEntries.map((e:Entry)=>e.fmaId),['FMA7198','FMA7196','FMA14749','FMA14773','FMA76574']);
 assert.deepEqual(pins.bundles.map((b:{id:string})=>b.id).sort(),['abdomen-organs','abdomen-vessels-recovery','abdomen-vessels-visceral-detail','pancreas-corrected-parent']);
 const compiled=await build({stdin:{contents:"export {pancreaticArterialTour,pancreaticArterialTourMatches} from './atlas-review/lib/pancreatic-arterial-tour';export {regionalTourStructures,regionalTourStepFrames} from './atlas-review/lib/regional-tours';export {bodyReviewMaterial,bodyReviewSummaries} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';export {bodyReviewContext} from './atlas-review/lib/body-review-context';export {blankBodyReview} from './atlas-review/lib/body-review-decisions';export {postBodyDecision} from './atlas-review/lib/body-review-api';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {contentTabs} from './atlas-review/lib/content-types';export {default as rawCatalog} from './atlas-review/public/models/bodyparts3d/full-body/catalog.json';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const catalog=api.bodyDisplayCatalog(api.rawCatalog),tour=api.pancreaticArterialTour;
 const entries:Entry[]=pins.entries,context:Entry[]=pins.contextEntries,resolved=[...context,...[0,3,1,4,2,5,6,7,8].map(i=>entries[i])];
 assert.equal(catalog.structures.length,1104);assert.equal(api.bodyReviewSummaries.length*api.contentTabs.length,9936);
 assert.equal(api.pancreaticArterialTourMatches(catalog,tour),true);
 assert.deepEqual(api.regionalTourStructures(catalog,tour),resolved);
 assert.equal(tour.id,'pancreatic-arterial-relationships');assert.equal(tour.region,'abdomen');assert.equal(tour.revision,pins.tourRevision);assert.equal(tour.status,'draft');
 assert.deepEqual(tour.contextIds,context.map(s=>s.id));
 assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),[0,3,1,4,2,5,6,7,8].map(i=>entries[i].id));
 assert.deepEqual(tour.steps.map((s:{title:string})=>s.title),[0,3,1,4,2,5,6,7,8].map(i=>entries[i].name));
 const frames=api.regionalTourStepFrames(catalog,tour);assert.equal(frames.length,9);
 for(const [i,step] of tour.steps.entries()){
  const local=step.frameIds.map((id:string)=>resolved.find(s=>s.id===id));assert(local.every(Boolean));
  assert.deepEqual(frames[i],{min:[0,1,2].map(a=>Math.min(...local.map((s:Entry)=>s.bounds.min[a]))),max:[0,1,2].map(a=>Math.max(...local.map((s:Entry)=>s.bounds.max[a])))});
  assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.caption.trim());
 }
 const learnerJs=learner.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{const bytes=readFileSync(base+f.path);assert.equal(sha(bytes),f.sha256);return bytes.toString();}).join('\n');
 for(const step of tour.steps)assert(learnerJs.includes(step.caption),step.id);
 let storageCalls=0;const storage={prepare(){storageCalls++;throw Error('Rejected request reached private storage');}};
 for(const entry of resolved){
  assert.equal(entry.validation.anatomicalReview,false);
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');assert.equal(packet.topics.length,9);
  assert.deepEqual(packet.source.structure,entry);
  const guided=packet.guidedTours.filter((g:{tour:{id:string}})=>g.tour.id===tour.id);assert.equal(guided.length,1);
  const evidence=guided[0];assert.deepEqual(evidence.tour,wire(tour));assert.deepEqual(evidence.structures,resolved);
  assert.deepEqual(evidence.stepFrames,frames);assert.deepEqual(evidence.bundles,pins.bundles);
  assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  assert.equal(evidence.patientRegistered,undefined);assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  for(const change of ['removed','duplicate','caption','source','context','frame','revision','registration','approval']){
   const bad=wire(packet),item=bad.guidedTours.find((g:{tour:{id:string}})=>g.tour.id===tour.id);
   if(change==='removed')bad.guidedTours.splice(bad.guidedTours.indexOf(item),1);
   if(change==='duplicate')bad.guidedTours.push(wire(item));
   if(change==='caption')item.tour.steps[0].caption='Altered';
   if(change==='source')item.structures[0].sources[0].sha256='0'.repeat(64);
   if(change==='context')item.tour.contextIds=[];
   if(change==='frame')item.stepFrames[0].max[0]+=0.1;
   if(change==='revision')item.tour.revision='foreign';
   if(change==='registration')item.patientRegistered=true;
   if(change==='approval')bad.approval=true;
   assert.equal(await api.parseBodyReviewResponse(bad,entry.id),null,`${entry.id}: ${change}`);
  }
  const reviewContext=await api.bodyReviewContext(entry.id);
  const decision={catalogScope:reviewContext.catalogScope,structureId:entry.id,track:'teaching',expectedVersion:0,
   materialHash:reviewContext.materialHash,revisionHash:reviewContext.revisions.teaching,checklistVersion:reviewContext.checklistVersion,
   draft:api.blankBodyReview(reviewContext,'teaching')};
  const save=(input:unknown)=>api.postBodyDecision(new Request('https://review.test/api/body-decisions',{
   method:'POST',headers:{origin:'https://review.test','content-type':'application/json','oai-authenticated-user-id':'synthetic-pancreatic-tour-reviewer'},body:JSON.stringify(input),
  }),storage);
  assert.equal((await save({...decision,materialHash:'0'.repeat(64)})).status,409,`${entry.id}: stale material before storage`);
  assert.equal((await save({...decision,revisionHash:'0'.repeat(64)})).status,409,`${entry.id}: stale revision before storage`);
  const forged=wire(decision);forged.draft.checks.foreign=true;
  assert.equal((await save(forged)).status,422,`${entry.id}: forged checklist before storage`);
  const approval=wire(decision);approval.draft.status='approved';
  assert.equal((await save(approval)).status,422,`${entry.id}: unreviewed approval before storage`);
 }
 assert.equal(storageCalls,0);
});
