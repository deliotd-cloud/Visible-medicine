// Lightweight JSX/source harness only; no scan, bundle, renderer, build or preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-head-pane-accessible-labels',prepared=json(stage+'/PREPARED.json');
assert.equal(sha(read(prepared.sourceReceipt)),prepared.sourceReceiptSha256);
const raw=read(stage+'/RAW/'+prepared.relative),code=read(stage+'/CODE/'+prepared.relative);
assert.equal(sha(raw),prepared.rawSha256);assert.deepEqual(raw,read(prepared.website+'/'+prepared.relative));
const nativeAttribute=" aria-label={`${expanded?'Restore':'Enlarge'} ${plane} image`}";
const surfaceAttribute=" aria-label={`${expanded==='3d'?'Restore':'Enlarge'} selected anatomy 3D scan view`}";
let inverse=code.toString();
for(const attribute of [nativeAttribute,surfaceAttribute]){assert.equal(inverse.split(attribute).length,2);inverse=inverse.replace(attribute,'');}
assert.deepEqual(Buffer.from(inverse),raw,'Only the two accessible names change; geometry, behavior and visible UI are byte-exact');
let testSource=read(stage+'/CODE/tests/head-pane-expansion-labels.test.mjs').toString();
for(const statement of ["import assert from 'node:assert/strict';","import test from 'node:test';","import {readFileSync} from 'node:fs';","import {createRequire} from 'node:module';","import {createNativeVolumeGeometry} from '../lib/head-atlas-geometry.mjs';","import {headSliceViewport} from '../lib/head-slice-viewport.ts';"]){assert.equal(testSource.split(statement).length,2);testSource=testSource.replace(statement,'');}
testSource=testSource.replaceAll('import.meta.url','moduleUrl');
const moduleUrl=pathToFileURL(prepared.website+'/tests/head-pane-expansion-labels.test.mjs').href;
const {createNativeVolumeGeometry}=await import(pathToFileURL(prepared.website+'/lib/head-atlas-geometry.mjs'));
const {headSliceViewport}=await import(pathToFileURL(prepared.website+'/lib/head-slice-viewport.ts'));
function run(bytes){
 const registered=[];
 const redirectedRead=(url,encoding)=>{
  assert.equal(new URL(url).href,pathToFileURL(prepared.website+'/'+prepared.relative).href,'Only the proposed component may be read');
  return encoding?bytes.toString(encoding):bytes;
 };
 new Function('assert','test','readFileSync','createRequire','moduleUrl','createNativeVolumeGeometry','headSliceViewport',testSource)(assert,(name,callback)=>registered.push([name,callback]),redirectedRead,createRequire,moduleUrl,createNativeVolumeGeometry,headSliceViewport);
 const results=[];for(const [name,callback] of registered){try{callback();results.push({name,passed:true});}catch(error){results.push({name,passed:false,error:error.message});}}
 return results;
}
const before=run(raw),after=run(code);
if(!after.every(row=>row.passed)){
 fs.writeFileSync(stage+'/FIRST_HARNESS_DIAGNOSTIC.json',JSON.stringify({before,after},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({before,after}));
}
assert.equal(before.length,9);assert.equal(before.filter(row=>!row.passed).length,8,'Baseline demonstrates all eight ambiguous pane actions');
assert.equal(after.length,9);assert(after.every(row=>row.passed),'All actual JSX labels and callbacks pass');
const mutations=[
 code.toString().replace(nativeAttribute,nativeAttribute.replace('${plane}','axial')),
 code.toString().replace(nativeAttribute,''),
 code.toString().replace(surfaceAttribute,surfaceAttribute.replace('selected anatomy 3D scan view','reference 3D Atlas')),
];
for(const mutated of mutations)assert(run(Buffer.from(mutated)).some(row=>!row.passed),'Wrong, missing or misleading pane label is refused');
const result={at:new Date().toISOString(),sourceReceipt:prepared.sourceReceipt,sourceReceiptSha256:prepared.sourceReceiptSha256,
 component:{path:prepared.relative,rawSha256:sha(raw),codeSha256:sha(code)},testSha256:sha(read(stage+'/CODE/tests/head-pane-expansion-labels.test.mjs')),
 baseline:{tests:before.length,pass:1,fail:8},proposed:{tests:after.length,pass:after.length,fail:0},mutationRefusals:mutations.length,
 originalBehaviorGeometryVisibleUiByteExact:true,currentCandidateChanged:false,reviewRebindPerformed:false,nativeAcceptance:false,browserOrScreenReaderAccepted:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/SOURCE_PROOF.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proof:stage+'/SOURCE_PROOF.json',sha256:sha(read(stage+'/SOURCE_PROOF.json')),baseline:result.baseline,proposed:result.proposed,mutationRefusals:mutations.length,previewChanged:false}));
