import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';
const featureRevision='9fba9a1e24b6669aafd48e945d55fc0939d50ab2';
const featureTree='1bd327fb20a52b35bec584675c457173c548e24b';
const revision=CURRENT_ATLAS_REVISION;
const sha=(bytes: string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url));
const json=(path:string)=>JSON.parse(read(path).toString());
const bindings=[
 ['app/regional-guided-learning.tsx','bcc7a99b91d355c9a9ccbcd9ae7781742bd68f5222c2b4705bfffccff83c1899','head-neck','onFocus={revokePlayback}','onFocusCapture={revokePlayback}'],
 ['app/shoulder-tour-player.tsx','a8082eea11ede929839604410186df591aa42fb5d98aee8ebf533b0cb797b00e','shoulder','onFocus={onReadImaging}','onFocusCapture={onReadImaging}'],
];
test('Both learner modules and protected Review bind the verified reading-focus pause source',()=>{
 const pin=validateCurrentAtlasDelivery(),sourceRoot=currentAtlasDeliveryRoot();
 assert.equal(pin.source,revision);
 assert.equal(execFileSync('git',['rev-parse',featureRevision+'^{tree}'],{cwd:sourceRoot,encoding:'utf8'}).trim(),featureTree);
 const review=json('atlas-review/manifest.json');assert.equal(review.revision,revision);
 for(const [path,hash,module,caption,resources]of bindings){
  const source=review.files.find((f:any)=>f.path===path);assert(source);assert.equal(source.sourceSha256,hash);
  const committed=execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot});
  const historical=execFileSync('git',['show',featureRevision+':'+path],{cwd:sourceRoot});
  assert.deepEqual(committed,historical,path+': immutable reading-focus source held');
  assert.equal(sha(committed),hash,path+': exact committed source');
  const imported=read('atlas-review/'+path);assert.equal(sha(imported),source.importedSha256);
  assert(imported.toString().includes(caption));assert(imported.toString().includes(resources));
  const prefix='public/atlas-runtime/'+module+'/',manifest=json(prefix+'manifest.json');
  assert.equal(manifest.sourceCommit,revision);
  for(const property of ['patientDataIncluded','clinicalApproved','standaloneReviewConnection'])assert.equal(manifest[property],false);
  const inputs=json(prefix+'source-inputs.json');assert.equal(inputs.find((f:any)=>f.path===path)?.sha256,hash);
  for(const f of manifest.files.filter((f:any)=>!f.path.endsWith('.glb')))assert.equal(sha(read(prefix+f.path)),f.sha256,f.path);
 }
 const viewer=json('public/atlas-review-viewer/manifest.json');assert.equal(viewer.sourceCommit,revision);assert.equal(viewer.websiteIntegrationSha256,review.websiteIntegrationSha256);
});


test('reading-focus pause refuses altered committed source, Review and learner metadata',()=>{
 const sourceRoot=currentAtlasDeliveryRoot(),review=json('atlas-review/manifest.json');
 for(const [path,,module] of bindings){
  const committed=execFileSync('git',['show',revision+':'+path],{cwd:sourceRoot});
  const imported=read('atlas-review/'+path),inputs=json('public/atlas-runtime/'+module+'/source-inputs.json');
  const verify=(manifest:any,learnerInputs:any,bytes:Buffer=imported)=>{
   const source=manifest.files.find((file:any)=>file.path===path);assert(source);
   assert.equal(source.sourceSha256,sha(committed),'committed source');
   assert.equal(source.importedSha256,sha(bytes),'Review import');
   assert.deepEqual(learnerInputs.filter((file:any)=>file.path===path),[{path,sha256:sha(committed)}],'learner input');
  };
  verify(review,inputs);
  const forgedSource=structuredClone(review);forgedSource.files.find((file:any)=>file.path===path).sourceSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedSource,inputs),/committed source/);
  const forgedImport=structuredClone(review);forgedImport.files.find((file:any)=>file.path===path).importedSha256='0'.repeat(64);
  assert.throws(()=>verify(forgedImport,inputs),/Review import/);
  const changed=Buffer.from(imported);changed[0]^=1;assert.throws(()=>verify(review,inputs,changed),/Review import/);
  const forgedInput=structuredClone(inputs);forgedInput.find((file:any)=>file.path===path).sha256='0'.repeat(64);
  assert.throws(()=>verify(review,forgedInput),/learner input/);
 }
});
