import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {historicalReviewAe84Read,historicalReviewAe84Pin} from './historical-review-ae84.mjs';
import {colicC32OriginalSha256,colicHistoricalRoleSeams,colicCurrentEpochSeams} from './colic-role-contract-20261101.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const here=new URL('./',import.meta.url);
const read=path=>readFileSync(new URL(path,here));
function one(source,from,to){
 assert.equal(source.split(from).length,2,'Exactly one declared seam: '+from.slice(0,90));
 return source.replace(from,to);
}
const seams={
 'colic-current-admission.test.mjs':[
  ["import {fileURLToPath,pathToFileURL} from 'node:url';", "import {fileURLToPath,pathToFileURL} from 'node:url';\nimport {historicalReviewAe84Read,historicalReviewAe84Pin} from './historical-review-ae84.mjs';"],
  ["const read=path=>readFileSync(join(website,path));", "const readLive=path=>readFileSync(join(website,path));\nconst read=path=>historicalReviewAe84Read(path,readLive);"],
  ["const pin=JSON.parse(pinBytes);", "const pin=historicalReviewAe84Pin(readLive);"],
  ["assert.deepEqual(delivery.validateCurrentAtlasDelivery(),pin);", "assert.deepEqual(delivery.validateCurrentAtlasDelivery({pin,read}),pin);"],
  ["delivery.validateCurrentAtlasDelivery({pin:oldPin})", "delivery.validateCurrentAtlasDelivery({pin:oldPin,read})"],
  ["delivery.validateCurrentAtlasDelivery({pin:bad})", "delivery.validateCurrentAtlasDelivery({pin:bad,read})"],
  ["delivery.validateCurrentAtlasDelivery({pin:stale})", "delivery.validateCurrentAtlasDelivery({pin:stale,read})"],
  ["delivery.validateCurrentAtlasDelivery({pin:missing})", "delivery.validateCurrentAtlasDelivery({pin:missing,read})"],
  ["delivery.validateCurrentAtlasDelivery({pin:foreign})", "delivery.validateCurrentAtlasDelivery({pin:foreign,read})"],
 ],
 'clinical-review-desktop-layout.test.mjs':[
  ["test('current delivery remains separately bound to the clean Atlas source',()=>{", "test('ae84 delivery remains separately bound to the clean Atlas source',async()=>{\n const {historicalReviewAe84Read,historicalReviewAe84Pin}=await import('./historical-review-ae84.mjs');\n const readAe84=path=>historicalReviewAe84Read(path,read);"],
  [" const current=validateCurrentAtlasDelivery();\n assert.equal(current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');", " const current=validateCurrentAtlasDelivery({pin:historicalReviewAe84Pin(read),read:readAe84});\n assert.equal(current.source,'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');"],
  [" const bindingBytes=read('atlas-review/integration-inputs.json');\n assert.equal(sha(bindingBytes),'325359cf86b75fd2d35661c9b3d051924a719c794f9f298b3174d77f8173fb76');", " const bindingBytes=readAe84('atlas-review/integration-inputs.json');\n assert.equal(sha(bindingBytes),'325359cf86b75fd2d35661c9b3d051924a719c794f9f298b3174d77f8173fb76');"],
 ],
};
const originalHashes={
 'colic-current-admission.test.mjs':'f4d74cae889c1712fb96cf442578aad918e9542b11750e9b8a197ec4cab6b01f',
 'clinical-review-desktop-layout.test.mjs':'a0c4ad2500ba988fde1cd074fa4aeaf7a3cc090eeaf32e1f7bdc548e427f32fa',
};

for(const [name,edits]of Object.entries(seams))test('complete ae84 source preserved outside declared reader seams: '+name,()=>{
 const raw=read('fixtures/ae84-review/'+name+'.raw');
 assert.equal(sha(raw),originalHashes[name],'Authentic complete old test source');
 let expected=raw.toString('utf8');
 for(const [from,to]of edits)expected=one(expected,from,to);
 if(name==='colic-current-admission.test.mjs'){
  // The initial ae84 reader migration preceded legitimate historical/current role separation.
  for(const [from,to]of colicHistoricalRoleSeams)expected=one(expected,from,to);
  const c32=read('fixtures/colic-role-contract-20261101/colic-current-admission.c32-original.mjs.raw');
  assert.equal(sha(c32),colicC32OriginalSha256,'Authentic complete c32 role theorem');
  assert.equal(expected,c32.toString('utf8'),'Every original ae84 assertion plus explicit role additions');
  for(const [from,to]of colicCurrentEpochSeams)expected=one(expected,from,to);
  let reversed=expected;
  for(const [from,to]of [...colicCurrentEpochSeams].reverse())reversed=one(reversed,to,from);
  assert.equal(reversed,c32.toString('utf8'),'Current successor seams reverse to complete c32 source');
  for(const [from,to]of [...colicHistoricalRoleSeams].reverse())reversed=one(reversed,to,from);
  for(const [from,to]of [...edits].reverse())reversed=one(reversed,to,from);
  assert.equal(reversed,raw.toString('utf8'),'Role seams reverse to authentic complete ae84 source');
 }
 if(name==='clinical-review-desktop-layout.test.mjs')for(const [from,to]of [[" const readAe84=path=>historicalReviewAe84Read(path,read);"," const {historicalReferenceDelivery}=await import('./reference-catalogue-historical-delivery.mjs');\n const readAe84=historicalReferenceDelivery(read);"],[" const current=validateCurrentAtlasDelivery({pin:historicalReviewAe84Pin(read),read:readAe84});"," const current=historicalReviewAe84Pin(read);\n assert.throws(()=>validateCurrentAtlasDelivery({pin:current}),'Historical ae84 cannot be admitted as current');"]])expected=one(expected,from,to);
 assert.equal(read(name).toString('utf8'),expected,'Complete old assertions and bodies survive');
});

test('ae84 overlay refuses tampering and missing frozen bytes',()=>{
 const live=()=>{throw Error('No live fallback for frozen path');};
 const path='atlas-review/integration-inputs.json';
 assert.equal(sha(historicalReviewAe84Read(path,live)),'325359cf86b75fd2d35661c9b3d051924a719c794f9f298b3174d77f8173fb76');
 assert.throws(()=>historicalReviewAe84Read(path,live,()=>Buffer.from('tampered')),/Authentic ae84 overlay/);
 assert.throws(()=>historicalReviewAe84Read(path,live,()=>{throw Error('missing ae84 bytes');}),/missing ae84 bytes/);
 for(const [imported,digest]of [
  ['atlas-review/content/body-renderer-revision.json','2cc64d315bb4ab3cbc4ec0d9cf27d1e1e8ca4095f2b92b05a7e4cf60c0871f2a'],
  ['atlas-review/content/review-revisions.json','71dcbe9f122c990b3001eb564e5a1a621c1c3edf5cc4fb02c9e239ea9ee8352b'],
 ]){
  assert.equal(sha(historicalReviewAe84Read(imported,live)),digest);
  assert.throws(()=>historicalReviewAe84Read(imported,live,()=>Buffer.from('tampered')),/Authentic ae84 overlay/);
  assert.throws(()=>historicalReviewAe84Read(imported,live,()=>{throw Error('missing ae84 bytes');}),/missing ae84 bytes/);
 }
 const pin=historicalReviewAe84Pin(live);
 assert.equal(pin.reviewIntegration,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
});
