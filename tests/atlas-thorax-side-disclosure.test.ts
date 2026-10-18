import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
import {ATLAS_DELIVERY_POLICY} from '../lib/atlas-delivery-policy.ts';

const base='public/atlas-runtime/head-neck/';
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

const featureWebsite='f2f7adbb34af7d7a3bb9affa3ada082fe423ecf6';
const feature=(path:string)=>Buffer.from(execFileSync('git',['show',`${featureWebsite}:${path}`],{encoding:null,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}}));
const sourceRepo=currentAtlasDeliveryRoot();
test('shared Thorax focus discloses compound midline source limits under either side filter',()=>{
  const manifestBytes=feature(base+'manifest.json');
  assert.equal(sha(manifestBytes),'eaaf8eb1d53dc3728e07a5f3497a4a7c8018afdf0838f5b90a313282d77a2381');
  const manifest=JSON.parse(manifestBytes.toString());
  assert.equal(manifest.sourceCommit,'88cea927d48729769b96ad8fe680b0872b7e6687');
  for(const flag of ['patientDataIncluded','clinicalApproved','imagingConnection','standaloneReviewConnection'])
    assert.equal(manifest[flag],false,flag);
  const inputs=JSON.parse(feature(base+'source-inputs.json').toString('utf8')) as {path:string;sha256:string}[];
  assert.equal(inputs.find(row=>row.path==='content/thorax-respiratory-study.ts')?.sha256,
    '4631768eb5bf6e210231e0e3e9e3ba43a2fd6eccb23fda415c2964c964e9c0ba');
  assert.ok(!inputs.some(row=>/native-mr|local-mr-study|\.vmmr/i.test(row.path)),
    'private MRI checker remains outside the regional export');
  const scripts=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js'));
  const runtime=scripts.map(file=>{
    const bytes=feature(base+file.path);
    assert.equal(sha(bytes),file.sha256,file.path);
    return bytes.toString();
  }).join('\n');
  for(const phrase of [
    'respiratory-wall-overview',
    'respiratory-intercostal-comparison',
    'respiratory-diaphragm',
    'Left and right filters retain the same midline-labelled compound source surfaces; neither filter isolates a side.',
    'neither hemidiaphragm is separately selectable',
    'not rib-space subdivisions, contraction, or breathing motion',
    'Anatomical relationships require revision-bound radiologist review',
  ])assert.ok(runtime.includes(phrase),phrase);
  const inventoryBytes=feature('lib/atlas-model-inventory.json');
  assert.equal(sha(inventoryBytes),'b452f2b43d0183f76e20031885795ef034a3cabb856e2643d0e1c44ea839b1dc');
  const inventory=JSON.parse(inventoryBytes.toString());
  assert.equal(inventory.sources.find((source:{module:string})=>source.module==='head-neck')?.manifestSha256,sha(manifestBytes));
  assert.equal(inventory.models.length,137);
  assert.equal(inventory.models.flatMap((model:{paths:string[]})=>model.paths).length,144);
  assert.equal(ATLAS_DELIVERY_POLICY.audience,'administrator-review');
  assert.equal('approvedRevision' in ATLAS_DELIVERY_POLICY,false);
});

test('closed current atlas-thorax-side-disclosure delivery retains exact source, Review import and learner evidence',()=>{
 const pin=validateCurrentAtlasDelivery();
 assert.equal(pin.source,CURRENT_ATLAS_REVISION);
 const base='public/atlas-runtime/head-neck/';
 const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
 const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8'));
 const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
 const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(manifest.sourceCommit,pin.source);
 assert.equal(review.revision,pin.source);
 for(const flag of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection','imagingConnection'])assert.equal(manifest[flag],false,flag);
 for(const path of ['content/thorax-respiratory-study.ts']){
   const source=execFileSync('git',['show',`${pin.source}:${path}`],{encoding:null,cwd:sourceRepo,maxBuffer:32e6,windowsHide:true,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'}});
   assert.deepEqual(inputs.filter((row:{path:string})=>row.path===path),[{path,sha256:sha(source)}]);
   const entry=review.files.find((file:{path:string})=>file.path===path);
   assert(entry,`Review missing ${path}`);
   assert.equal(entry.sourceSha256,sha(source),path);
   assert.equal(entry.importedSha256,sha(readFileSync('atlas-review/'+path)),path);
 }
 const runtime=(manifest.files as {path:string;sha256:string}[]).filter(file=>file.path.endsWith('.js')).map(file=>{
   const bytes=readFileSync(base+file.path);assert.equal(sha(bytes),file.sha256,file.path);return bytes.toString();
 }).join('\n');
 for(const marker of [
   'respiratory-wall-overview',
   'respiratory-intercostal-comparison',
   'respiratory-diaphragm',
   'Left and right filters retain the same midline-labelled compound source surfaces; neither filter isolates a side.',
   'neither hemidiaphragm is separately selectable',
   'not rib-space subdivisions, contraction, or breathing motion',
   'Anatomical relationships require revision-bound radiologist review',
 ])assert(runtime.includes(marker),marker);
 assert.ok(!inputs.some((row:{path:string})=>/native-mr|local-mr-study|\.vmmr/i.test(row.path)),
   'private MRI checker remains outside the current regional export');
 const altered=structuredClone(manifest);altered.sourceCommit='0'.repeat(40);
 assert.throws(()=>validateCurrentAtlasDelivery({pin,read:path=>path==='public/atlas-runtime/head-neck/manifest.json'?Buffer.from(JSON.stringify(altered)):readFileSync(path)}),/Current delivery changed: public\/atlas-runtime\/head-neck\/manifest.json/);
});
