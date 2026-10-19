import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {admitPreservedClinicalReview} from './clinical-review-current-admission.mjs';
const sourceHashes={
 'lib/forearm-arterial-tour.ts':'5a39f29d9195a4c1f154ea01adbdf0c3824177c363590f5e808009992634ae1d',
 'content/forearm-arterial-tour-pins.json':'4f39db9be069d2f91c373b8835fa1b55a7487677d42b783f32b1cb2938b292a5',
 'lib/regional-tours.ts':'88f195fd9dbfcd4033a5012eeb760f358cca16da7f48cbca8671ef92c69bea97',
} as const;
const sha=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
const wire=<T>(value:T):T=>JSON.parse(JSON.stringify(value));

test('forearm-arterial learner and Review share four exact draft stops without procedural or registration claims',async()=>{
 const base='public/atlas-runtime/head-neck/',learner=JSON.parse(readFileSync(base+'manifest.json','utf8')),review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const currentRevision=admitPreservedClinicalReview({revision:'9fba9a1e24b6669aafd48e945d55fc0939d50ab2',sourceHashes,learnerModules:['head-neck']});
 assert.equal(learner.sourceCommit,currentRevision);assert.equal(review.revision,learner.sourceCommit);
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 for(const path of ['lib/forearm-arterial-tour.ts','content/forearm-arterial-tour-pins.json','lib/regional-tours.ts']){
  const input=inputs.find((f:{path:string})=>f.path===path),imported=review.files.find((f:{path:string})=>f.path===path);
  assert(input&&imported,path);assert.equal(imported.sourceSha256,input.sha256);assert.equal(sha(readFileSync('atlas-review/'+path)),input.sha256);
 }
 const pins=JSON.parse(readFileSync('atlas-review/content/forearm-arterial-tour-pins.json','utf8'));
 assert.equal(sha(JSON.stringify(pins)),'aea55738c5d1f6cc960c799180d478ed820721e9ee5885ae17204bdc25041bdd');
 const compiled=await build({stdin:{contents:"export {forearmArterialTour} from './atlas-review/lib/forearm-arterial-tour';export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';export {parseBodyReviewResponse} from './atlas-review/lib/body-review-response';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const js=learner.files.filter((f:{path:string})=>f.path.endsWith('.js')).map((f:{path:string;sha256:string})=>{const b=readFileSync(base+f.path);assert.equal(sha(b),f.sha256);return new TextDecoder().decode(b);}).join('\n');
 const tour=api.forearmArterialTour;assert.equal(tour.status,'draft');assert.equal(tour.steps.length,4);assert.equal(tour.region,'forearm');
 assert.equal(tour.revision,'right-forearm-arterial-orientation-v1');assert.equal(pins.entries.length,4);assert.equal(pins.contextEntries.length,2);
 for(const term of [/continuous vessel route/,/procedural path/,/unvalidated/,/patient-space registration/])assert.match(tour.limitations,term);
 assert.deepEqual(tour.steps.map((s:{selectedId:string})=>s.selectedId),pins.entries.map((s:{id:string})=>s.id));
 for(const step of tour.steps){assert(js.includes(step.caption));assert.equal(step.durationMs,14000);assert.equal(step.fadeOthers,true);assert(step.frameIds.includes(step.selectedId));}
 for(const entry of [...pins.entries,...pins.contextEntries]){
  const packet=wire(await api.bodyReviewMaterial(entry.id));assert.equal(packet.approval,false);assert.equal(packet.status,'worksheet-not-submitted');
  const evidence=packet.guidedTours.find((e:{tour:{id:string}})=>e.tour.id===tour.id);assert(evidence);assert.deepEqual(evidence.tour,wire(tour));
  const byId=(a:{id:string},b:{id:string})=>a.id.localeCompare(b.id);
  assert.deepEqual([...evidence.structures].sort(byId),[...pins.entries,...pins.contextEntries].sort(byId));
  assert.equal(evidence.stepFrames.length,4);assert.equal(evidence.transitionMs,1800);assert.equal(evidence.transition,'quintic-orbit');assert.equal(evidence.separation,0);
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
