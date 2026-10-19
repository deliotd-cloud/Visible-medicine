import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const revision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const sourcePaths={
 'lib/digestive-tract-tour.ts':'f6c6827b751c28c6b2009da2956736253ef68b659b64585a6e3ae0b1000a845b',
 'content/digestive-tract-tour-pins.json':'f71eb900d2ff1e65e2146017b278f79b7eeb137b0362424f658492d496880d8f',
 'lib/regional-tours.ts':'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',
};
const bundleHashes={
 'thorax-organs':'612b6d095c42e78b0aca151bb295b0d5fd48488c5aace250ca707eff96788316',
 'abdomen-organs':'5e224f77acade0a27068f45faf3b24839ec13a4d3cb8de283952263ecc1e3124',
 'pelvis-organs-recovery':'d2876cb12fa3f6c71170d18bd6813f96783c47fe12ddf68263bf12e0cae98629',
 'abdomen-organs-inventory':'beb3ff34d8e0d64041f6639fea2a4aefff6e11f04f5ed0a9f9d62cec85257a42',
};
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('digestive tract learner and Review retain six exact draft stops and reject altered packets',async()=>{
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(review.revision,revision);
 let learner:any;
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,revision,module);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
  for(const [path,expected] of Object.entries(sourcePaths)){
   const input=inputs.find((file:{path:string})=>file.path===path);
   // The shared regional learner owns this root-body tour; independent
   // specimens and shoulder detail retain their separate source scopes.
   if(module!=='head-neck'){
    assert.equal(input,undefined,`${module}: unrelated root tour input ${path}`);
    continue;
   }
   assert(input,`${module}: ${path}`);
   assert.equal(input.sha256,expected,`${module}: ${path}`);
  }
  if(module==='head-neck')learner=manifest;
 }
 for(const [path,expected] of Object.entries(sourcePaths)){
  const imported=review.files.find((file:{path:string})=>file.path===path);
  assert(imported,path);
  assert.equal(imported.sourceSha256,expected,path);
  assert.equal(sha(readFileSync('atlas-review/'+path)),expected,path);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/digestive-tract-tour-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'c52bb736167322a1d49205d1dbd5e2c8ca9e08581f7fa2f538c490d07096e9d2');
 assert.equal(pins.baseline,'0a4d4ae6115ee6894734d0ce6efed38cb693f441');
 assert.equal(pins.tourRevision,'digestive-tract-tour-20261010-r1');
 assert.deepEqual(pins.entries.map((entry:{fmaId:string})=>entry.fmaId),['FMA7131','FMA7148','FMA7200','FMA7201','FMA14542','FMA14544']);
 assert.deepEqual(pins.contextEntries,[]);
 assert.deepEqual(Object.fromEntries(pins.bundles.map((bundle:{id:string;sha256:string})=>[bundle.id,bundle.sha256])),bundleHashes);
 assert.deepEqual(pins.bundles.map((bundle:{bytes:number})=>bundle.bytes),[3711452,6383736,73348,40896]);
 assert.deepEqual(pins.entries.map((entry:{bundle:string})=>entry.bundle),[
  'thorax-organs','abdomen-organs','abdomen-organs','abdomen-organs','abdomen-organs-inventory','pelvis-organs-recovery',
 ]);
 assert.deepEqual(pins.entries.map((entry:{provenance:{recovered:boolean}})=>entry.provenance.recovered),[false,false,false,false,true,true]);
 assert(pins.entries.every((entry:{validation:{status:string;anatomicalReview:boolean}})=>entry.validation.status==='unvalidated'&&!entry.validation.anatomicalReview));

 const compiled=await build({stdin:{contents:"export {digestiveTractTour} from './atlas-review/lib/digestive-tract-tour';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const base='public/atlas-runtime/head-neck/';
 const learnerJs=learner.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{
  const bytes=readFileSync(base+file.path);
  assert.equal(sha(bytes),file.sha256,file.path);
  return new TextDecoder().decode(bytes);
 }).join('\n');
 const tour=api.digestiveTractTour;
 assert.equal(tour.id,'digestive-tract-orientation');
 assert.equal(tour.revision,pins.tourRevision);
 assert.equal(tour.status,'draft');
 assert.equal(tour.region,'whole-body');
 assert.deepEqual(tour.scopeRegions,['thorax','abdomen','pelvis']);
 assert.deepEqual(tour.contextIds,[]);
 assert.deepEqual(tour.steps.map((step:{selectedId:string})=>step.selectedId),pins.entries.map((entry:{id:string})=>entry.id));
 assert.deepEqual(tour.steps.map((step:{view:string})=>step.view),Array(6).fill('anterior'));
 assert.deepEqual(tour.steps.map((step:{frameIds:string[]})=>step.frameIds),[
  [pins.entries[0].id,pins.entries[1].id],
  [pins.entries[0].id,pins.entries[1].id,pins.entries[2].id],
  [pins.entries[1].id,pins.entries[2].id,pins.entries[3].id],
  [pins.entries[2].id,pins.entries[3].id,pins.entries[4].id],
  [pins.entries[3].id,pins.entries[4].id,pins.entries[5].id],
  pins.entries.map((entry:{id:string})=>entry.id),
 ]);
 for(const term of [/external source surfaces/i,/aggregate surfaces/i,/recovered surface/i,/lumen continuity/i,/registration/i,/male root/i,/radiologist sign-off/i])assert.match(tour.limitations,term);
 assert.match(tour.steps[4].caption,/side pouch/i);
 assert.match(tour.steps[4].caption,/not a mandatory step/i);
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
  assert.equal(evidence.stepFrames.length,6);
  assert.equal(evidence.transitionMs,1800);
  assert.equal(evidence.transition,'quintic-orbit');
  assert.equal(evidence.separation,0);
  assert.equal(evidence.patientRegistered,undefined);
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
