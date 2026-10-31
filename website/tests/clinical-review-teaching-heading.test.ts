import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {build} from 'esbuild';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

const featureRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const revision=CURRENT_ATLAS_REVISION;
const helperHash='167c480b486b97b89565dd34b9611bed0b7c7c59e3f9453983eec02af3ecd3e3';
const sourceRepo=currentAtlasDeliveryRoot();
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const source=(path:string)=>Buffer.from(execFileSync('git',['-C',sourceRepo,'show',`${revision}:${path}`]));

test('the delivered heading helper is revision-bound while two ultrasound drafts retain their raw Review titles',async()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,revision);
 currentAtlasDeliveryRoot();
 const historical=Buffer.from(execFileSync('git',['-C',sourceRepo,'show',`${featureRevision}:lib/teaching-heading.ts`]));
 const helper=source('lib/teaching-heading.ts');
 assert.deepEqual(helper,historical,'Original feature helper remains byte-identical');
 assert.equal(sha(helper),helperHash);
 const renderer=source('content/body-renderer-revision.json');
 const rendererJson=JSON.parse(renderer.toString('utf8'));
 assert.equal(rendererJson.dependencies.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts')?.sha256,helperHash);
 const priorRenderer=JSON.parse(execFileSync('git',['-C',sourceRepo,'show',`${featureRevision}:content/body-renderer-revision.json`]).toString());
 assert.equal(priorRenderer.dependencies.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts')?.sha256,helperHash);

 const review=json('atlas-review/manifest.json');
 assert.equal(review.revision,revision);
 const reviewHelper=review.files.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts');
 assert(reviewHelper);
 assert.equal(reviewHelper.sourceSha256,helperHash);
 assert.equal(reviewHelper.importedSha256,helperHash);
 const importedHelper=readFileSync('atlas-review/lib/teaching-heading.ts');
 assert.equal(sha(importedHelper),helperHash);
 const reviewRenderer=review.files.find((entry:{path:string})=>entry.path==='content/body-renderer-revision.json');
 assert(reviewRenderer);
 assert.equal(reviewRenderer.sourceSha256,sha(renderer));
 const importedRenderer=readFileSync('atlas-review/content/body-renderer-revision.json');
 assert.equal(reviewRenderer.importedSha256,sha(importedRenderer));
 assert.equal(JSON.parse(new TextDecoder().decode(importedRenderer)).dependencies.find((entry:{path:string})=>
  entry.path==='lib/teaching-heading.ts')?.sha256,helperHash);
 for(const module of ['head-neck','female-pelvis','lower-limb','shoulder']){
  const base=`public/atlas-runtime/${module}/`;
  const manifest=json(base+'manifest.json');
  assert.equal(manifest.sourceCommit,pin.runtimeSources[module],module);
  assert.equal(manifest.patientDataIncluded,false,module);
  assert.equal(manifest.clinicalApproved,false,module);
 }
 const headInputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 assert.equal(headInputs.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts')?.sha256,helperHash);
 assert.equal(headInputs.find((entry:{path:string})=>entry.path==='app/body-explorer.tsx')?.sha256,
  sha(source('app/body-explorer.tsx')));

 const originalFoldCommit='7736555f3880f804cab02b35719ac3e53bf00222';
 const originalFold=Buffer.from(execFileSync('git',['-C',sourceRepo,'show',
  `${originalFoldCommit}:content/abdominal-fold-ultrasound.ts`]));
 assert.equal(sha(originalFold),'884980bc5090348fc0c78a081f026f4b9923e3458171bce2499323eceab1df0d');
 const originalBuilder=Buffer.from(execFileSync('git',['-C',sourceRepo,'show',
  `${originalFoldCommit}:lib/abdominal-fold-ultrasound.ts`]));
 assert.equal(sha(originalBuilder),'c34ab10048031c2ee6b90f4fde2506d8a7a0d6b2fb309567dbc1e8f792a747f4');
 assert(originalBuilder.toString().includes('title:`${s.name} · ${topic.title} · draft`'));
 assert.equal(execFileSync('git',['-C',sourceRepo,'merge-base',originalFoldCommit,revision]).toString().trim(),
  originalFoldCommit,'Original repeated-title source precedes current delivery');
 assert.equal(sha(source('content/abdominal-fold-ultrasound.ts')),
  '973dfb99c8c8789d8437346d097502d69f096cc52fa6c109533b2a46624fbe66',
  'Exact current deduplicated topic source');

 const compiled=await build({stdin:{contents:[
  "export {bodyReviewMaterial} from './atlas-review/lib/body-review-material';",
  "export {abdominalFoldUltrasoundLesson} from './atlas-review/lib/abdominal-fold-ultrasound';",
 ].join('\n'),resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm'});
 const api=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
 const helperJs=await build({stdin:{contents:new TextDecoder().decode(importedHelper),loader:'ts'},write:false,platform:'node',format:'esm'});
 const {teachingHeading}=await import('data:text/javascript;base64,'+Buffer.from(helperJs.outputFiles[0].text).toString('base64'));
 const pins=json('atlas-review/content/abdominal-fold-ultrasound-pins.json');
 for(const [id,raw,display] of [
  ['vm:anatomy:body:abdomen:midline:membrane:transverse-mesocolon',
   'Transverse mesocolon · Transverse mesocolon · Ultrasound and EUS · draft',
   'Transverse mesocolon · Ultrasound and EUS · draft'],
  ['vm:anatomy:body:abdomen:unspecified:membrane:mesoappendix',
   'Mesoappendix · Mesoappendix · Ultrasound · draft',
   'Mesoappendix · Ultrasound · draft'],
 ] as const){
  const identity=pins.entries.find((entry:{identity:{id:string}})=>entry.identity.id===id)?.identity;
  assert(identity,id);
  const lesson=api.abdominalFoldUltrasoundLesson(identity,'ultrasound');
  const packet=await api.bodyReviewMaterial(id);
  const reviewLesson=packet?.topics.find((topic:{tab:string})=>topic.tab==='ultrasound');
  assert(lesson && reviewLesson,id);
  assert.equal(raw,identity.name+' · '+display,'Original repeated heading retained as historical witness');
  assert(originalFold.toString().includes("title: '"+display.replace(' · draft','')+"'"),id);
  assert.equal(lesson.title,display,id);
  assert.equal(reviewLesson.title,display,id);
  assert.equal(lesson.readiness,'draft',id);
  assert.equal(reviewLesson.readiness,'draft',id);
  assert.equal(packet.approval,false,id);
  assert.equal(packet.status,'worksheet-not-submitted',id);
  assert.equal(teachingHeading(lesson.title,identity.name),display,id);
 }
 assert.equal(teachingHeading('Other · Ultrasound','Mesoappendix'),'Other · Ultrasound');
 assert.equal(teachingHeading('Mesoappendix · Mesoappendix · Mesoappendix · Ultrasound · draft','Mesoappendix'),
  'Mesoappendix · Ultrasound · draft');
 assert.equal(teachingHeading('Mesoappendix · Right · Mesoappendix · Ultrasound','Mesoappendix'),
  'Mesoappendix · Right · Mesoappendix · Ultrasound');
});


test('heading current source and Review binding reject altered hashes and bytes',()=>{
 currentAtlasDeliveryRoot();
 const helper=source('lib/teaching-heading.ts');
 const review=json('atlas-review/manifest.json');
 const imported=readFileSync('atlas-review/lib/teaching-heading.ts');
 const headInputs=json('public/atlas-runtime/head-neck/source-inputs.json');
 const verify=(manifest:any,bytes:Uint8Array,inputs:any)=>{
  const row=manifest.files.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts');assert(row);
  assert.equal(row.sourceSha256,sha(helper),'committed helper');
  assert.equal(row.importedSha256,sha(bytes),'Review helper bytes');
  assert.deepEqual(inputs.filter((entry:{path:string})=>entry.path==='lib/teaching-heading.ts'),
   [{path:'lib/teaching-heading.ts',sha256:sha(helper)}],'head-neck source input');
 };
 verify(review,imported,headInputs);
 const sourceForged=structuredClone(review);sourceForged.files.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts').sourceSha256='0'.repeat(64);
 assert.throws(()=>verify(sourceForged,imported,headInputs),/committed helper/);
 const importForged=structuredClone(review);importForged.files.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts').importedSha256='0'.repeat(64);
 assert.throws(()=>verify(importForged,imported,headInputs),/Review helper bytes/);
 const corrupted=Buffer.from(imported);corrupted[0]^=1;
 assert.throws(()=>verify(review,corrupted,headInputs),/Review helper bytes/);
 const inputForged=structuredClone(headInputs);inputForged.find((entry:{path:string})=>entry.path==='lib/teaching-heading.ts').sha256='0'.repeat(64);
 assert.throws(()=>verify(review,imported,inputForged),/head-neck source input/);
});
