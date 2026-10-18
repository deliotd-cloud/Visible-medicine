import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('diaphragm learner and Review retain five source-pinned draft stops and refuse altered evidence',async()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,revision);
 assert.equal(review.revision,revision);

 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['lib/diaphragm-tour.ts','content/diaphragm-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find((file:{path:string})=>file.path===path);
  const imported=review.files.find((file:{path:string})=>file.path===path);
  assert(input&&imported,path);
  assert.equal(imported.sourceSha256,input.sha256,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256,path);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/diaphragm-tour-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'4e7a96d5ecb4da20f445e4ef1c814e8d2d1bb05c6f2bb4bc17f8e5c185869856');
 assert.equal(pins.baseline,'214cec892da967a8057ab1647003200e4f934d92');
 assert.equal(pins.tourRevision,'diaphragm-tour-20261010-r1');
 assert.deepEqual(pins.entries.map((entry:{fmaId:string})=>entry.fmaId),
  ['FMA13295','FMA7131','FMA87217','FMA3789','FMA10951']);
 assert.deepEqual(pins.contextEntries.map((entry:{fmaId:string})=>entry.fmaId),['FMA7148']);
 assert.deepEqual(pins.entries.slice(3).map((entry:{regions:string[]})=>entry.regions),
  [['abdomen','pelvis','thorax'],['abdomen','pelvis','thorax']]);
 assert.deepEqual(pins.entries.slice(3).map((entry:{bounds:{min:number[];max:number[]}})=>entry.bounds),[
  {min:[-0.009028740227222443,1.4869097471237183,0.32476097345352173],max:[0.200547993183136,3.359100341796875,0.8277599811553955]},
  {min:[-0.2682560086250305,1.5089203119277954,0.5355200171470642],max:[-0.02058500051498413,3.9053003787994385,0.787899911403656]},
 ]);
 assert.deepEqual(pins.bundles.map((bundle:{id:string;sha256:string;bytes:number})=>[bundle.id,bundle.sha256,bundle.bytes]),[
  ['thorax-muscles','3bbf7759e54e34272175de042ef4e26c24412b9f073a2f8eea3ce4fe79ebb682',14990372],
  ['thorax-organs','612b6d095c42e78b0aca151bb295b0d5fd48488c5aace250ca707eff96788316',3711452],
  ['abdomen-organs','5e224f77acade0a27068f45faf3b24839ec13a4d3cb8de283952263ecc1e3124',6383736],
  ['thorax-vessels-recovery','0c82e1cb2960c6f2474f2b4759974adab5871d8074a2f4e3712e1c3a37a48ca7',1131748],
  ['abdomen-vessels-recovery','e41d66684de08fd9bd7dfca340acb63cbf7714eb09a3ea9594184f497c509abe',477592],
 ]);
 assert([...pins.entries,...pins.contextEntries].every((entry:{validation:{status:string;anatomicalReview:boolean}})=>
  entry.validation.status==='unvalidated'&&!entry.validation.anatomicalReview));

 const compiled=await build({stdin:{contents:"export {diaphragmTour} from './atlas-review/lib/diaphragm-tour';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
  const bytes=readFileSync(base+file.path);
  assert.equal(sha(bytes),file.sha256,file.path);
  return new TextDecoder().decode(bytes);
 }).join('\n');
 const tour=api.diaphragmTour;
 assert.equal(tour.id,'diaphragm-boundary-orientation');
 assert.equal(tour.revision,pins.tourRevision);
 assert.equal(tour.status,'draft');
 assert.equal(tour.region,'whole-body');
 assert.deepEqual(tour.scopeRegions,['thorax','abdomen','pelvis']);
 assert.deepEqual(tour.contextIds,pins.contextEntries.map((entry:{id:string})=>entry.id));
 assert.deepEqual(tour.steps.map((step:{selectedId:string})=>step.selectedId),pins.entries.map((entry:{id:string})=>entry.id));
 assert.deepEqual(tour.steps.map((step:{view:string})=>step.view),['anterior','anterior','posterior','posterior','anterior']);
 const ids=pins.entries.map((entry:{id:string})=>entry.id);
 const stomach=pins.contextEntries[0].id;
 assert.deepEqual(tour.steps.map((step:{frameIds:string[]})=>step.frameIds),[
  [ids[0],ids[1],stomach],[ids[0],ids[1],stomach],
  [ids[0],ids[2],ids[3]],[ids[0],ids[2],ids[3]],[ids[0],ids[4]],
 ]);
 assert.deepEqual(tour.requiredDisplayBundles,
  Object.fromEntries([...pins.entries,...pins.contextEntries].map((entry:{id:string;bundle:string})=>[entry.id,entry.bundle])));
 for(const term of [/openings/i,/continuity/i,/breathing motion/i,/patient registration/i,/radiologist sign-off/i])
  assert.match(tour.limitations,term);
 for(const step of tour.steps){
  assert(learnerJs.includes(step.caption),step.id);
  assert.equal(step.durationMs,14000);
  assert.equal(step.fadeOthers,true);
 }

 const recordsById=new Map<string,{bounds:{min:number[];max:number[]}}>(
  [...pins.entries,...pins.contextEntries].map((entry:{id:string;bounds:{min:number[];max:number[]}})=>[entry.id,entry]));
 const bounds=(frameIds:string[])=>{
  const records=frameIds.map(id=>recordsById.get(id)!);
  return {min:[0,1,2].map(axis=>Math.min(...records.map(record=>record.bounds.min[axis]))),
   max:[0,1,2].map(axis=>Math.max(...records.map(record=>record.bounds.max[axis])))};
 };
 const expectedStepFrames=tour.steps.map((step:{frameIds:string[]})=>bounds(step.frameIds));
 for(const entry of [...pins.entries,...pins.contextEntries]){
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  const index=packet.guidedTours.findIndex((item:{tour:{id:string}})=>item.tour.id===tour.id);
  assert(index>=0,entry.id);
  const evidence=packet.guidedTours[index];
  assert.deepEqual(evidence.tour,wire(tour));
  assert.deepEqual(evidence.structures,[...pins.contextEntries,...pins.entries]);
  assert.deepEqual([...evidence.bundles].sort((a:{id:string},b:{id:string})=>a.id.localeCompare(b.id)),
   [...pins.bundles].sort((a:{id:string},b:{id:string})=>a.id.localeCompare(b.id)));
  assert.deepEqual(evidence.coordinateSystem,pins.coordinateSystem);
  assert.equal(evidence.sourceVersion,pins.sourceVersion);
  assert.equal(evidence.limitations,tour.limitations);
  assert.deepEqual(evidence.frame,bounds(ids));
  assert.deepEqual(evidence.stepFrames,expectedStepFrames);
  assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  assert.equal(evidence.patientRegistered,undefined);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  for(const change of ['caption','missing','source','frame','scope','registration','revision']){
   const altered=wire(packet);
   const guided=altered.guidedTours[index];
   if(change==='caption')guided.tour.steps[0].caption='Altered';
   if(change==='missing')altered.guidedTours.splice(index,1);
   if(change==='source')guided.structures[0].sources[0].sha256='0'.repeat(64);
   if(change==='frame')guided.stepFrames[0].max[0]+=0.1;
   if(change==='scope')guided.tour.scopeRegions=['thorax','abdomen'];
   if(change==='registration')guided.patientRegistered=true;
   if(change==='revision')guided.tour.revision='foreign-revision';
   assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,`${entry.id}: ${change}`);
  }
 }
});
