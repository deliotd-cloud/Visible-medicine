import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourceHashes={
 'lib/pelvic-venous-tour.ts':'3b83824e0f2d8d2d3fe3051e7290e8d69e952d3b6e66398d4172cf6d29d0d191',
 'content/pelvic-venous-tour-pins.json':'9446981afc162aaf3a4df1ff3796070c831ef9411973c3185d13eb017a88bbb8',
 'lib/regional-tours.ts':'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',
} as const;
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('pelvic venous learner and Review retain ten exact draft stops and reject altered packets',async()=>{
 const base='public/atlas-runtime/head-neck/';
 const learner=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const currentRevision=admitPreservedClinicalReview({revision,sourceHashes,learnerModules:['head-neck']});
 assert.equal(learner.sourceCommit,currentRevision);
 assert.equal(review.revision,currentRevision);

 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['lib/pelvic-venous-tour.ts','content/pelvic-venous-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find((file:{path:string})=>file.path===path);
  const imported=review.files.find((file:{path:string})=>file.path===path);
  assert(input&&imported,path);
  assert.equal(imported.sourceSha256,input.sha256,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256,path);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/pelvic-venous-tour-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'4d310848eed52f4d0a65ffc9da2b0ab2549eb013ce46cdf1c0743002010ae869');
 assert.equal(pins.tourRevision,'pelvic-venous-tour-20261010-r1');
 assert.deepEqual(pins.entries.map((entry:{fmaId:string})=>entry.fmaId),[
  'FMA18904','FMA18913','FMA18916','FMA18910','FMA18903',
  'FMA18912','FMA18918','FMA18906','FMA18915','FMA18909',
 ]);
 assert.deepEqual(pins.contextEntries.map((entry:{fmaId:string})=>entry.fmaId),[
  'FMA21387','FMA21388','FMA18887','FMA18888','FMA16586','FMA16587','FMA16202',
 ]);
 assert.equal(pins.entries.length+pins.contextEntries.length,17);
 for(const held of ['FMA18919','FMA18907']){
  assert(![...pins.entries,...pins.contextEntries].some((entry:{fmaId:string})=>entry.fmaId===held),held);
 }
 assert([...pins.entries,...pins.contextEntries].every((entry:{validation:{status:string;anatomicalReview:boolean}})=>
  entry.validation.status==='unvalidated'&&!entry.validation.anatomicalReview));

 const compiled=await build({stdin:{contents:"export {pelvicVenousTour} from './atlas-review/lib/pelvic-venous-tour';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const learnerJs=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
  const bytes=readFileSync(base+file.path);
  assert.equal(sha(bytes),file.sha256,file.path);
  return new TextDecoder().decode(bytes);
 }).join('\n');
 const tour=api.pelvicVenousTour;
 assert.equal(tour.id,'pelvic-venous-tributaries-orientation');
 assert.equal(tour.revision,pins.tourRevision);
 assert.equal(tour.region,'pelvis');
 assert.equal(tour.status,'draft');
 assert.equal(tour.steps.length,10);
 assert.deepEqual(tour.contextIds,pins.contextEntries.map((entry:{id:string})=>entry.id));
 assert.deepEqual(tour.steps.map((step:{selectedId:string})=>step.selectedId),pins.entries.map((entry:{id:string})=>entry.id));
 assert.deepEqual(tour.steps.map((step:{view:string})=>step.view),[
  'posterior','posterior','anterior','posterior','posterior',
  'posterior','posterior','posterior','anterior','posterior',
 ]);
 const contextByFma=new Map<string,string>(pins.contextEntries.map((entry:{fmaId:string;id:string})=>[entry.fmaId,entry.id]));
 const iliacFmas=['FMA21388','FMA18888','FMA18888','FMA18888','FMA21387',
  'FMA18887','FMA18887','FMA18887','FMA18887','FMA18887'];
 assert.deepEqual(tour.steps.map((step:{frameIds:string[];selectedId:string},index:number)=>step.frameIds),
  pins.entries.map((entry:{id:string},index:number)=>[entry.id,contextByFma.get(iliacFmas[index])]));
 const recordsById=new Map<string,{bounds:{min:number[];max:number[]}}>(
  [...pins.entries,...pins.contextEntries].map((entry:{id:string;bounds:{min:number[];max:number[]}})=>[entry.id,entry]));
 const expectedStepFrames=tour.steps.map((step:{frameIds:string[]})=>{
  const records=step.frameIds.map(id=>recordsById.get(id)!);
  return {min:[0,1,2].map(axis=>Math.min(...records.map(record=>record.bounds.min[axis]))),
   max:[0,1,2].map(axis=>Math.max(...records.map(record=>record.bounds.max[axis])))};
 });
 assert.deepEqual(tour.requiredDisplayBundles,
  Object.fromEntries([...pins.entries,...pins.contextEntries].map((entry:{id:string;bundle:string})=>[entry.id,entry.bundle])));
 for(const term of [/left internal pudendal/i,/left lateral sacral/i,/proximity does not prove/i,/patient registration/i,/radiologist sign-off/i])
  assert.match(tour.limitations,term);
 for(const step of tour.steps){
  assert(learnerJs.includes(step.caption),step.id);
  assert.equal(step.durationMs,14000);
  assert.equal(step.fadeOthers,true);
 }
 for(const held of ['FMA18919','FMA18907'])
  assert(!JSON.stringify(tour).includes(held),held);

 for(const entry of [...pins.entries,...pins.contextEntries]){
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  const index=packet.guidedTours.findIndex((item:{tour:{id:string}})=>item.tour.id===tour.id);
  assert(index>=0,entry.id);
  const evidence=packet.guidedTours[index];
  assert.deepEqual(evidence.tour,wire(tour));
  assert.deepEqual(evidence.structures,[...pins.contextEntries,...pins.entries]);
  assert.deepEqual(evidence.stepFrames,expectedStepFrames);
  assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  assert.equal(evidence.patientRegistered,undefined);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  for(const change of ['caption','missing','source','registration','revision']){
   const altered=wire(packet);
   const guided=altered.guidedTours[index];
   if(change==='caption')guided.tour.steps[0].caption='Altered';
   if(change==='missing')altered.guidedTours.splice(index,1);
   if(change==='source')guided.structures[0].sources[0].sha256='0'.repeat(64);
   if(change==='registration')guided.patientRegistered=true;
   if(change==='revision')guided.tour.revision='foreign-revision';
   assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,`${entry.id}: ${change}`);
  }
 }
});
