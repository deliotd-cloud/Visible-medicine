import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourcePaths={
 'lib/urinary-tract-tour.ts':'af6e7539e892ce1841e82e2a47400610f95f9e2f69fadbd02e598280a4e5dee7',
 'content/urinary-tract-tour-pins.json':'0baad27ec922fa9300880575823b9b0c7a6cdcf946db7985571d0cf1373e3172',
 'lib/regional-tours.ts':'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',
};
const bundleHashes={
 'abdomen-organs':'5e224f77acade0a27068f45faf3b24839ec13a4d3cb8de283952263ecc1e3124',
 'pelvis-organs':'90baaeb1c521a6b2546e99576bce4b231c6e068b4fa3d48dbd4cb7eb355f93c3',
 'abdomen-organs-recovery':'9ed6f0864a2b37edc4c36ffbb84fdab9cacf34c6069d93455f1ffcb6eee711ab',
};
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('urinary tract learner and Review retain five exact draft stops and reject altered packets',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,revision);
 let learner:any;
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,revision,module);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  for(const [path,expected] of Object.entries(sourcePaths)){
   const input=inputs.find((f:{path:string})=>f.path===path);
   // This cross-region root-body tour belongs only to the shared regional
   // runtime. Independent specimens/shoulder detail must not acquire it.
   if(module!=='head-neck'){
    assert.equal(input,undefined,`${module} must preserve its separate source scope: ${path}`);
    continue;
   }
   assert(input,`${module}: ${path}`);
   assert.equal(input.sha256,expected,`${module}: ${path}`);
  }
  if(module==='head-neck')learner=manifest;
 }
 for(const [path,expected] of Object.entries(sourcePaths)){
  const imported=review.files.find((f:{path:string})=>f.path===path);
  assert(imported,path);
  assert.equal(imported.sourceSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/urinary-tract-tour-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'838bb6175f4ae84ed1323e71a0551a6f1132694d825c13ba1754b6209ee5a949');
 assert.equal(pins.baseline,'cb412b50a1415c5662a346e509b23326799247f9');
 assert.deepEqual(pins.entries.map((entry:{fmaId:string})=>entry.fmaId),['FMA7204','FMA15571','FMA7205','FMA15572','FMA15900']);
 assert.deepEqual(pins.contextEntries,[]);
 assert.deepEqual(Object.fromEntries(pins.bundles.map((bundle:{id:string;sha256:string})=>[bundle.id,bundle.sha256])),bundleHashes);
 assert.deepEqual(pins.bundles.map((bundle:{bytes:number})=>bundle.bytes),[6383736,49544,74092]);
 assert.deepEqual(pins.entries.map((entry:{bundle:string})=>entry.bundle),['abdomen-organs','abdomen-organs-recovery','abdomen-organs','abdomen-organs-recovery','pelvis-organs']);
 assert.deepEqual(pins.entries.map((entry:{provenance:{recovered:boolean}})=>entry.provenance.recovered),[false,true,false,true,false]);
 assert(pins.entries.every((entry:{validation:{status:string;anatomicalReview:boolean}})=>entry.validation.status==='unvalidated'&&!entry.validation.anatomicalReview));

 const compiled=await build({stdin:{contents:"export {urinaryTractTour} from './atlas-review/lib/urinary-tract-tour';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const base='public/atlas-runtime/head-neck/';
 const learnerJs=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
  const bytes=readFileSync(base+file.path);
  assert.equal(sha(bytes),file.sha256,file.path);
  return new TextDecoder().decode(bytes);
 }).join('\n');
 const tour=api.urinaryTractTour;
 assert.equal(tour.id,'urinary-tract-orientation');
 assert.equal(tour.revision,'urinary-tract-tour-20261010-r1');
 assert.equal(tour.status,'draft');
 assert.equal(tour.region,'whole-body');
 assert.deepEqual(tour.scopeRegions,['abdomen','pelvis']);
 assert.deepEqual(tour.contextIds,[]);
 assert.deepEqual(tour.steps.map((step:{selectedId:string})=>step.selectedId),pins.entries.map((entry:{id:string})=>entry.id));
 assert.deepEqual(tour.steps.map((step:{view:string})=>step.view),['posterior','right','posterior','left','anterior']);
 assert.deepEqual(tour.steps.map((step:{frameIds:string[]})=>step.frameIds),[
  [pins.entries[0].id,pins.entries[1].id,pins.entries[4].id],
  [pins.entries[0].id,pins.entries[1].id,pins.entries[4].id],
  [pins.entries[2].id,pins.entries[3].id,pins.entries[4].id],
  [pins.entries[2].id,pins.entries[3].id,pins.entries[4].id],
  pins.entries.map((entry:{id:string})=>entry.id),
 ]);
 for(const term of [/external source surfaces/i,/recovered/i,/lumen/i,/urine flow/i,/registration/i,/male root/i,/female-generalised/i,/radiologist sign-off/i])assert.match(tour.limitations,term);
 for(const step of tour.steps){
  assert(learnerJs.includes(step.caption),step.id);
  assert.equal(step.durationMs,14000);
  assert.equal(step.fadeOthers,true);
 }
 for(const entry of pins.entries){
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  assert.equal(packet.approval,false);
  assert.equal(packet.status,'worksheet-not-submitted');
  const index=packet.guidedTours.findIndex((item:{tour:{id:string}})=>item.tour.id===tour.id);
  assert(index>=0,entry.id);
  const evidence=packet.guidedTours[index];
  assert.deepEqual(evidence.tour,wire(tour));
  assert.deepEqual(evidence.structures,pins.entries);
  assert.equal(evidence.stepFrames.length,5);
  assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  for(const change of ['caption','missing','reordered','source','registration','revision']){
   const altered=wire(packet);
   const guided=altered.guidedTours[index];
   if(change==='caption')guided.tour.steps[0].caption='Altered';
   if(change==='missing')altered.guidedTours.splice(index,1);
   if(change==='reordered')guided.tour.steps.reverse();
   if(change==='source')guided.structures[0].sources[0].sha256='0'.repeat(64);
   if(change==='registration')guided.patientRegistered=true;
   if(change==='revision')guided.tour.revision='foreign-revision';
   assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,`${entry.id}: ${change}`);
  }
 }
});
