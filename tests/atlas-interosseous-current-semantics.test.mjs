import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';
import {emittedTeaching} from './atlas-emitted-teaching.ts';

test('current four interosseous arteries distinguish the CT module from separately source-bound MRI and ultrasound drafts',async()=>{
 currentAtlasDeliveryRoot();
 const result=await build({stdin:{contents:"export {bodyLesson} from './atlas-review/app/body-content';export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';export {forearmArterialImagingLesson} from './atlas-review/lib/forearm-arterial-imaging';export {elbowArterialMriLesson} from './atlas-review/lib/elbow-arterial-mri';export {commonInterosseousUsLesson} from './atlas-review/lib/common-interosseous-us';export {elbowArterialUsFollowupLesson} from './atlas-review/lib/elbow-arterial-us-followup';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const json=p=>JSON.parse(readFileSync(p));
 const pins=json('atlas-review/content/forearm-arterial-ct-pins.json'),catalog=api.bodyDisplayCatalog(json('atlas-review/public/models/bodyparts3d/full-body/catalog.json'));
 assert.deepEqual(pins.entries.map(e=>e.identity.fmaId).sort(),['FMA22807','FMA22808','FMA268667','FMA268669']);
 const base='public/atlas-runtime/head-neck/',manifest=json(base+'manifest.json');assert.equal(manifest.sourceCommit,CURRENT_ATLAS_REVISION);
 const emitted=emittedTeaching(base,manifest.files,true),contains=s=>emitted.includes(s)||emitted.includes(JSON.stringify(s).slice(1,-1));
 for(const row of pins.entries){
  const s=catalog.structures.find(s=>s.id===row.identity.id);assert.deepEqual(s,row.identity);assert.equal(s.validation.anatomicalReview,false);
  const ct=api.forearmArterialImagingLesson(s,'ct');assert(ct);assert.equal(ct.readiness,'draft');assert.deepEqual(api.bodyLesson(s,'ct'),ct);
  assert.match(ct.note,/No patient images, registration, diagnostic protocol or clinical approval/);
  for(const line of [ct.body,...ct.bullets,...ct.citations])assert(contains(line),'Actual current lesson/reference reaches learner');
  for(const tab of ['mri','ultrasound']){
   assert.equal(api.forearmArterialImagingLesson(s,tab),undefined,'CT draft cannot claim another modality');
   const provider=tab==='mri'?api.elbowArterialMriLesson:row.group==='common-interosseous'?api.commonInterosseousUsLesson:api.elbowArterialUsFollowupLesson;
   const separate=provider(s,tab);assert(separate,s.fmaId+' '+tab+' has separately admitted source-specific teaching');assert.equal(separate.readiness,'draft');
   assert.deepEqual(api.bodyLesson(s,tab),separate,s.fmaId+' '+tab+' actual dispatch');
   for(const line of [separate.body,...separate.bullets,...separate.citations])assert(contains(line),'Separate modality lesson reaches learner');
   for(const key of ['id','fmaId','laterality','nodeName','region','bundle']){const forged=structuredClone(s);forged[key]+='-foreign';assert.equal(provider(forged,tab),undefined,'Separate '+tab+' '+key+' remains source-bound');}
  }
  for(const key of ['id','fmaId','laterality','nodeName','region','bundle']){const forged=structuredClone(s);forged[key]+='-foreign';assert.equal(api.forearmArterialImagingLesson(forged,'ct'),undefined,key+' remains source-bound');}
 }
});
