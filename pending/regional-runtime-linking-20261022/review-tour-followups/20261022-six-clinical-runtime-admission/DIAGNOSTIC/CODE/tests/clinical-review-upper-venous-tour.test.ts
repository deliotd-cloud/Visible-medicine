import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {boundLiveAtlasHistory} from './atlas-bound-live-history.mjs';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const authoredRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2',currentRevision=CURRENT_ATLAS_REVISION;
assert.equal(currentRevision,validateCurrentAtlasDelivery().source);
const sourceRoot=currentAtlasDeliveryRoot();
const {exactSourceHistoryApi}=await import(pathToFileURL(sourceRoot+'/scripts/exact-source-history-api.mjs').href);
const exactSource=(revision:string,path:string)=>execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot,windowsHide:true,maxBuffer:32e6,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
test('upper-limb venous learner and Review share six exact draft stops without flow or registration claims',async()=>{
 const base='public/atlas-runtime/head-neck/',learner=JSON.parse(readFileSync(base+'manifest.json','utf8')),review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 assert.equal(learner.sourceCommit,currentRevision);assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['lib/upper-venous-tour.ts','content/upper-venous-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256);assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/upper-venous-tour-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'596dbc3ec764b5b0f9c590a1d9b7223098b740f024197d95a0c31df1715015c2');
 const compiled=await build({stdin:{contents:"export {upperVenousTour} from './atlas-review/lib/upper-venous-tour';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const js=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 const authored=await exactSourceHistoryApi(authoredRevision,'regional-tour-security');
 const bound=await boundLiveAtlasHistory(currentRevision);
 for(const path of ['lib/upper-venous-tour.ts','content/upper-venous-tour-pins.json'])assert.deepEqual(readFileSync('atlas-review/'+path),exactSource(authoredRevision,path),'Exact authored tour source '+path);
 const tour=api.upperVenousTour;assert.deepEqual(wire(tour),wire(authored.upperVenousTour),'Complete authored tour remains unchanged');assert.equal(tour.status,'draft');assert.equal(tour.steps.length,6);assert.equal(tour.region,'whole-body');
 assert.equal(tour.revision,'right-upper-limb-venous-orientation-v1');assert.equal(pins.entries.length,6);assert.equal(pins.contextEntries.length,4);
 assert.match(tour.limitations,/not the direction of blood flow/);assert.match(tour.steps[3].title,/Medial brachial/);
 assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),pins.entries.map((s:{id:string})=>s.id));
 for(const step of tour.steps){assert(js.includes(step.caption));assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.frameIds.includes(step.selectedId));}
 for(const entry of [...pins.entries,...pins.contextEntries]){
  const packet=wire(await api.bodyReviewMaterial(entry.id));assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  assert.deepEqual(packet,wire(await bound.bodyReviewMaterial(entry.id)),'Complete Website-renderer-bound current packet');
  const evidence=packet.guidedTours.find((e:{tour:{id:string}})=>e.tour.id===tour.id);assert(evidence);assert.deepEqual(evidence.tour,wire(tour));
  const byId=(a:{id:string},b:{id:string})=>a.id.localeCompare(b.id);
  assert.deepEqual([...evidence.structures].sort(byId),[...pins.entries,...pins.contextEntries].sort(byId));
  assert.equal(evidence.stepFrames.length,6);assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
  assert.deepEqual(await api.parseBodyReviewResponse(packet,entry.id),packet);
  for(const change of ['caption','omitted','registration','source','old-revision']){
   const altered=wire(packet),i=altered.guidedTours.findIndex((e:{tour:{id:string}})=>e.tour.id===tour.id);
   if(change==='caption')altered.guidedTours[i].tour.steps[0].caption='Altered';
   if(change==='omitted')altered.guidedTours.splice(i,1);
   if(change==='registration')altered.guidedTours[i].patientRegistered=true;
   if(change==='source')altered.guidedTours[i].structures[0].sources[0].sha256='0'.repeat(64);
   if(change==='old-revision')altered.guidedTours[i].tour.revision='foreign-revision';
   assert.equal(await api.parseBodyReviewResponse(altered,entry.id),null,change);
  }
 }
});
