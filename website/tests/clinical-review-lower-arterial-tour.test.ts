import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const sha=(value:Uint8Array|string)=>createHash('sha256').update(value).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('learner and review share the exact nine-stop arterial tour without approval or registration',async()=>{
 const base='public/atlas-runtime/head-neck/';
const historicalBytes=readFileSync('tests/fixtures/historical-cardiac-chest-head-neck-manifest.json');
 assert.equal(sha(historicalBytes),'09189d13a033c9c251de2a21672b3d34fbc32fc743cdaf439bffa450e47ef34b');
 const admittedTest=readFileSync('tests/fixtures/raw-clinical-review-lower-arterial-tour.test.ts.raw');
 assert.equal(sha(admittedTest),'386e3b5ad6fb98dd97a8aa33e4433bc1e677bc06af76ea1f1892d7cceaac7a47');
 assert(admittedTest.toString().includes("assert.equal(maxTours,5,'right hip context also participates in the pelvic venous tour')"));
 const historicalLearner=JSON.parse(historicalBytes.toString());
 assert.equal(historicalLearner.sourceCommit,'9fba9a1e24b6669aafd48e945d55fc0939d50ab2');
 const currentDelivery=validateCurrentAtlasDelivery();
 const bytes=readFileSync(base+'manifest.json');
 assert.equal(sha(bytes),currentDelivery.documents[base+'manifest.json']);
 const learner=JSON.parse(bytes.toString()),review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,CURRENT_ATLAS_REVISION);assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['lib/lower-arterial-tour.ts','content/lower-arterial-tour-pins.json','lib/regional-tours.ts',
  'lib/pelvic-ring-tour.ts','lib/lower-limb-bone-tour.ts','lib/lower-venous-tour.ts',
  'content/lower-venous-tour-v2-pins.json','lib/pelvic-venous-tour.ts','content/pelvic-venous-tour-pins.json']){
  const input=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256);
  assert.equal(imported.importedSha256,input.sha256,path+' exact Review import');
  assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256);
  const committed=execFileSync('git',['-C',currentAtlasDeliveryRoot(),'show',`${CURRENT_ATLAS_REVISION}:${path}`],
   {windowsHide:true,maxBuffer:4e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  assert.equal(sha(committed),input.sha256,path+' exact committed Atlas source');
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/lower-arterial-tour-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'1e9a070c81a7c35f4ae5d6cd255bf22bf39fe02183f88d918fb25d4325d22b31');
 const result=await build({stdin:{contents:"export {lowerArterialTour,regionalTours} from './atlas-review/lib/regional-tours';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const js=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 const tour=api.lowerArterialTour;assert.equal(tour.status,'draft');assert.equal(tour.steps.length,9);assert.equal(tour.region,'whole-body');
 assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),pins.entries.map((s:{id:string})=>s.id));
 assert.equal(tour.revision,'right-lower-limb-arterial-orientation-v2');
 assert.equal(pins.contextEntries.length,9);assert.equal(pins.bundles.length,8);
 assert.deepEqual(tour.contextIds,pins.contextEntries.map((entry:{id:string})=>entry.id));
 for(const step of tour.steps)assert(js.includes(step.caption));
 const admitted=[...pins.entries,...pins.contextEntries];
 const rightHipTours=['male-pelvic-viscera-orientation','right-lower-limb-bone-orientation',
  'pelvic-ring-hip-orientation','right-lower-limb-venous-orientation',
  'right-lower-limb-arterial-orientation','pelvic-venous-tributaries-orientation'].sort();
 const sourceHistory=await import(pathToFileURL(currentAtlasDeliveryRoot()+'/scripts/exact-source-history-api.mjs').href);
 const historical=await sourceHistory.exactSourceHistoryApi('9fba9a1e24b6669aafd48e945d55fc0939d50ab2','review-security');
 const hipId=admitted.find((entry:{id:string})=>entry.id.endsWith(':right-hip-bone'))?.id;
 assert(hipId,'Exact source-bound right hip identity');
 const historicalHip=wire(await historical.bodyReviewMaterial(hipId));
 assert.deepEqual(historicalHip.guidedTours.map((e:{tour:{id:string}})=>e.tour.id).sort(),rightHipTours,
  'First delivery retains exactly six right-hip tours');
 const currentSource=await sourceHistory.exactSourceHistoryApi(CURRENT_ATLAS_REVISION,'review-security');
 assert.deepEqual(api.regionalTours,currentSource.regionalTours,'Imported current tours match exact committed Atlas source');
 const sourceTourIds=(id:string)=>currentSource.regionalTours
  .filter((tour:{contextIds:string[];steps:{selectedId:string}[]})=>
   [...tour.contextIds,...tour.steps.map(step=>step.selectedId)].includes(id))
  .map((tour:{id:string})=>tour.id).sort();
 const currentRightHipTours=[...rightHipTours,'coccygeus-pelvic-landmarks'].sort();
 assert.deepEqual(sourceTourIds(hipId),currentRightHipTours,'Seven current right-hip tours are source-bound');
 const femurId=admitted.find((entry:{id:string})=>entry.id.endsWith(':right-femur'))?.id;
 assert(femurId,'Exact source-bound right femur identity');
 const currentFemurTours=['pelvic-ring-hip-orientation','right-hamstring-orientation',
  'right-knee-quadriceps-to-tibia','right-lower-limb-arterial-orientation',
  'right-lower-limb-bone-orientation','right-lower-limb-venous-orientation',
  'right-medial-thigh-orientation','right-thigh-muscle-orientation'].sort();
 assert.deepEqual(sourceTourIds(femurId),currentFemurTours,'Eight current femur tours are source-bound');
 let maxTours=0;
 for(const entry of admitted){
  const packet=wire(await api.bodyReviewMaterial(entry.id));
  maxTours=Math.max(maxTours,packet.guidedTours.length);
  assert.deepEqual(packet.guidedTours.map((e:{tour:{id:string}})=>e.tour.id).sort(),sourceTourIds(entry.id),
   `${entry.id}: complete current source-bound tour set`);
  assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  const evidence=packet.guidedTours.find((e:{tour:{id:string}})=>e.tour.id===tour.id);assert(evidence);
  assert.deepEqual(evidence.tour,wire(tour));
  const byId=(a:{id:string},b:{id:string})=>a.id.localeCompare(b.id);
  assert.deepEqual([...evidence.structures].sort(byId),[...admitted].sort(byId));
  assert.equal(evidence.separation,0);assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');
  assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  if(entry.id.endsWith(':right-hip-bone')){
   assert.deepEqual(packet.guidedTours.map((e:{tour:{id:string}})=>e.tour.id).sort(),currentRightHipTours);
   for(const guided of packet.guidedTours)for(const step of guided.tour.steps)assert(js.includes(step.caption));
  }
  for(const field of ['caption','omitted','registration','context','duplicate','old-revision']){
   const changed=wire(packet),index=changed.guidedTours.findIndex((e:{tour:{id:string}})=>e.tour.id===tour.id);
   if(field==='caption')changed.guidedTours[index].tour.steps[0].caption='Altered';
   if(field==='omitted')changed.guidedTours.splice(index,1);
   if(field==='registration')changed.guidedTours[index].patientRegistered=true;
   if(field==='context')changed.guidedTours[index].tour.contextIds.pop();
   if(field==='duplicate')changed.guidedTours.push(wire(changed.guidedTours[index]));
   if(field==='old-revision')changed.guidedTours[index].tour.revision='right-lower-limb-arterial-orientation-v1';
   assert.equal(await api.parseBodyReviewResponse(changed,entry.id),null,field);
  }
 }
 assert.equal(maxTours,currentFemurTours.length,'Current right femur has the source-bound maximum across admitted structures');
});
