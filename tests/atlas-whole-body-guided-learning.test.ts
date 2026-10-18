import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const feature=(path:string)=>Buffer.from(execFileSync('git',['show',`c285a3871181565c35535ed65eb48d23fc13acd8:${path}`],{encoding:null,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));

// Delivery parity complements the Atlas actual-component event tests.
test('whole-body library delivers the tested selector and shared regional player',()=>{
  const root='public/atlas-runtime/head-neck/';
  const manifest=JSON.parse(feature(root+'manifest.json').toString('utf8'));
  const inputs=JSON.parse(feature(root+'source-inputs.json').toString('utf8'));
  const review=JSON.parse(feature('atlas-review/manifest.json').toString('utf8'));
  assert.equal(manifest.sourceCommit,'a10496da94d9d054306bbc48e5ae9c98239d82b5');
  for(const path of ['app/whole-body-guided-learning.tsx','app/whole-body-guided-learning.css','app/body-explorer.tsx','app/regional-guided-learning.tsx','lib/regional-tours.ts','lib/nested-guided-learning.ts','content/nested-guided-learning-bindings.v1.json']){
    assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,
      review.files.find((f:any)=>f.path===path)?.sourceSha256,path);
    assert.ok(inputs.some((f:any)=>f.path===path),path+' must exist');
  }
  const source=feature('atlas-review/app/whole-body-guided-learning.tsx').toString('utf8');
  assert.ok(source.includes('key={`${tour.id}:${tour.tour.revision}`}'));
  assert.ok(source.includes('key={`${tour.id}:${tour.eye.parentHash}:${tour.eye.sourceHash}:${JSON.stringify(tour.eye.guide)}`}'));
  assert.ok(source.includes('options.some(t=>t.id===id)'));
  assert.ok(source.includes("wholeBodyTourOptions.filter(t=>t.region===region)"));
  assert.ok(source.includes("nestedGuidedStudyOptions(catalog,region)"));
  assert.ok(source.includes('initialGuidedLearningExpanded'));
  assert.ok(source.includes('educationCatalog={catalog}'));
  assert.ok(source.includes('No guided tours are available for this region.'));
  assert.ok(source.includes('onExit={onExit}'));
  assert.ok(!/<iframe|window\.open|location\.(assign|href)/.test(source));
  const js=manifest.files.filter((f:any)=>f.path.endsWith('.js')).map((f:any)=>{
    const bytes=feature(root+f.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
    return bytes.toString();
  }).join('\n');
  assert.ok(js.includes('Guided tour library'));
  assert.ok(js.includes('whole-body-tour-picker'));
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection']) assert.equal(manifest[flag],false);
});

test('closed current whole-body library keeps exact source and emitted selector',()=>{
 const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const sourceRepo=currentAtlasDeliveryRoot();
 const root='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(root+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(root+'source-inputs.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(manifest.sourceCommit,pin.source);assert.equal(review.revision,pin.source);
 for(const path of ['app/whole-body-guided-learning.tsx','app/whole-body-guided-learning.css','app/body-explorer.tsx','app/regional-guided-learning.tsx','lib/regional-tours.ts','lib/nested-guided-learning.ts','content/nested-guided-learning-bindings.v1.json']){
  const source=execFileSync('git',['show',`${pin.source}:${path}`],{encoding:null,cwd:sourceRepo,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
  const entry=review.files.find((file:{path:string})=>file.path===path);assert(entry,path);
  assert.equal(entry.sourceSha256,sha(source),path);
  assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
  assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256:sha(source)}]);
 }
 const component=readFileSync('atlas-review/app/whole-body-guided-learning.tsx','utf8');
 for(const marker of [
  'key={`${tour.id}:${tour.tour.revision}`}',
  'key={`${tour.id}:${tour.eye.parentHash}:${tour.eye.sourceHash}:${JSON.stringify(tour.eye.guide)}`}',
  'wholeBodyTourOptions.filter(t=>t.region===region)',
  'nestedGuidedStudyOptions(catalog,region)',
  'initialGuidedLearningExpanded',
  'educationCatalog={catalog}',
  'No guided tours are available for this region.',
  'onExit={onExit}',
  // Discovery now narrows the admitted selection to visible source-bound options.
  'visible.some(option=>option.id===id)&&id!==tour.id',
  'pausedImaging?.suspend();setTourId(id)',
 ])assert(component.includes(marker),marker);
 assert.ok(!/<iframe|window\.open|location\.(assign|href)/.test(component));
 const emitted=manifest.files.filter((file:{path:string})=>file.path.endsWith('.js')).map((file:{path:string;sha256:string})=>{const bytes=readFileSync(root+file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();}).join('\n');
 for(const marker of ['Guided tour library','whole-body-tour-picker'])assert(emitted.includes(marker),marker);
 for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection'])assert.equal(manifest[flag],false,flag);
 const altered=structuredClone(manifest);altered.sourceCommit='0'.repeat(40);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:p=>p===root+'manifest.json'?Buffer.from(JSON.stringify(altered)):readFileSync(p)}),/Current delivery changed: public\/atlas-runtime\/head-neck\/manifest.json/);
});
