import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {restorePreHeadFocusCurrentDeliverySource,predecessorDeliverySource} from './current-delivery-predecessor-inverse.mjs';

const root=process.env.REPO_ROOT??fileURLToPath(new URL('../',import.meta.url));
const sha=value=>createHash('sha256').update(value).digest('hex');
const read=path=>readFileSync(root+'/'+path);
const source=readFileSync(new URL('./current-atlas-delivery.test.mjs',import.meta.url),'utf8');
const currentPinBytes=readFileSync(new URL('./fixtures/current-atlas-delivery.json',import.meta.url));
const pins=[
 ['cd2912d0b7ba9458cba4eba9bb8a5321d49262602c5ead9f959a9d43946251a3','1f36393188a11f9e8ff56cb54ff3cd9d50c504f3b47de3e21cde422b2104e996'],
 ['2bccfb7d1f183b8f487105e35d2cbd062d03cca3aeb7bfbc843fadc4115c51a1','f189dbf1d7269e6073355557fea6a829afe7fd434b5e53ae96b6177287a623dc'],
 ['a796158aed98e69bb57bc9eff13d7e45b8c93efce91dd99662cdf125b37782d2','df86130f461811da4e1b61e6aed3426392d65d27539178c4ae23003385d1b1d3'],
 ['789c685d3ab93affea70f4fa7cf261b8cc07370ed34437a3794d38ce36961d34','cf95b20ab0931eb62537408d568e9c7fd03685636662ebb25a5b5589b54b014e'],
];
function restorePin(bytes){
 assert.equal(sha(bytes),'5210d4032f40a2924b49c247581bead32575996c37d785f018be5909a6fc032a','Exact current pin bytes');
 let value=bytes.toString();for(const [after,before] of pins){assert.equal(value.split(after).length,2,'One exact pin transition');value=value.replace(after,before);}
 assert.equal(sha(value),'e3c65e53ae730207df4ae362931cef399ee7f7b23b8fa7983224b9333266708b','Exact ef17831d predecessor pin');return Buffer.from(value);
}
function restoreExact(bytes,currentHash,replacements,priorHash){
 assert.equal(sha(bytes),currentHash,'Exact current generated document');
 let value=bytes.toString();for(const [after,before] of replacements){assert.equal(value.split(after).length,2,'One exact document transition');value=value.replace(after,before);}
 assert.equal(sha(value),priorHash,'Exact ef17831d predecessor document');return value;
}
test('one bound comparison input explains the exact Review transition',()=>{
 assert.equal(sha(read('components/HeadAtlasInlineComparison.tsx')),'01cb27b46a034bc50f21ec6b639f736e4d12c86b14f92b527d02adbba7c6081e');
 const bindingBytes=read('atlas-review/integration-inputs.json');
 const beforeBinding=restoreExact(bindingBytes,'a796158aed98e69bb57bc9eff13d7e45b8c93efce91dd99662cdf125b37782d2',[
  pins[0],['01cb27b46a034bc50f21ec6b639f736e4d12c86b14f92b527d02adbba7c6081e','91f51462ab24e2fe90a54b178d9dedd71269f7644a23a222b0ab997281a85fb1']],
  'df86130f461811da4e1b61e6aed3426392d65d27539178c4ae23003385d1b1d3');
 const before=JSON.parse(beforeBinding),after=JSON.parse(bindingBytes);
 assert.equal(before.sha256,pins[0][1]);assert.equal(after.sha256,pins[0][0]);assert.equal(before.inputs.length,1866);assert.equal(after.inputs.length,1866);
 const previous=new Map(before.inputs.map(row=>[row.path,row.sha256]));
 assert.deepEqual(after.inputs.filter(row=>previous.get(row.path)!==row.sha256),[{path:'components/HeadAtlasInlineComparison.tsx',sha256:'01cb27b46a034bc50f21ec6b639f736e4d12c86b14f92b527d02adbba7c6081e'}]);
 assert.deepEqual(after.inputs.map(row=>row.path),before.inputs.map(row=>row.path),'No bound source added, removed, or reordered');
 const reviewBytes=read('atlas-review/manifest.json');
 const beforeReview=JSON.parse(restoreExact(reviewBytes,'2bccfb7d1f183b8f487105e35d2cbd062d03cca3aeb7bfbc843fadc4115c51a1',[
  pins[0],['8c84f93cfb04ccc27f127bba45db55bb7b61275b39c2bcabcf7d74e1bd821c83','1d191b23c30ad91f0426018d993afc19d20996d8f7bebe3cdc6f282b6ba062e8'],
  ['02e00a9080f0f90158324a242a67a4cc67bf4f6ded65526e0ec01b49a33131a8','96d22dadc7dfc99f038700225deeb4dd640a2a1dcb67d8bf8d5a489bbd45c773']],
  'f189dbf1d7269e6073355557fea6a829afe7fd434b5e53ae96b6177287a623dc'));
 const afterReview=JSON.parse(reviewBytes);
 assert.deepEqual(afterReview.files.map(row=>[row.path,row.sourceSha256]),beforeReview.files.map(row=>[row.path,row.sourceSha256]),'Review source revisions unchanged');
 assert.deepEqual(afterReview.files.filter((row,index)=>row.importedSha256!==beforeReview.files[index].importedSha256).map(row=>row.path),['content/body-renderer-revision.json','content/review-revisions.json']);
 const pin=JSON.parse(currentPinBytes);assert.equal(pin.reviewIntegration,after.sha256);
 for(const path of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'])assert.equal(sha(read(path)),pin.documents[path],path);
 restorePin(currentPinBytes);
});
test('complete prior delivery source and pin reject drift or lost refusal assertions',()=>{
 const restored=restorePreHeadFocusCurrentDeliverySource(source);
 assert.equal(sha(restored),'f37c68190b412a885a7e4bf9d3bfd33b08608844a6e46d5299d8f6ce1f7fb20e');
 assert.equal(sha(predecessorDeliverySource(source)),'ad5a1db42623b9a35d023c5b867a85a6cc776c8cf4982c1d2664628161bf900e');
 assert.throws(()=>restorePin(Buffer.concat([currentPinBytes,Buffer.from('foreign')])));
 assert.throws(()=>restorePreHeadFocusCurrentDeliverySource(source.replace("assert.throws(()=>validateCurrentAtlasDelivery({pin:old}));",'')));
 assert.throws(()=>predecessorDeliverySource(source.replace("assert.equal(current.sha256,sha(JSON.stringify(current.inputs)));",'')));
});
