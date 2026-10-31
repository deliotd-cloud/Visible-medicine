import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-release18-main',site='G:/VisibleMedicine-temp/staging/20261031-release16-final/website';
const sha=b=>createHash('sha256').update(b).digest('hex'),name='tests/current-review-rebinding.test.mjs';
const before=fs.readFileSync(site+'/'+name);let code=before.toString();
const edits=[
 [" const beforeRecovery=restorePreRecoveryCurrentDeliverySource(source);",` // Check the note-recovery theorem at its complete saved pre-distribution source.
 // The next assertion still reverses every later change from today's full source.
 const beforeRecovery=restorePreRecoveryCurrentDeliverySource(read('tests/fixtures/current-atlas-delivery-before-distribution-count.mjs.raw').toString());`],
 [" const before=JSON.parse(bytes),pin=validateCurrentAtlasDelivery();",` const before=JSON.parse(bytes);
 const root='G:/VisibleMedicine-temp/staging/20261030-head-review-recovery/website';
 const receipt=readFileSync('F:/VisibleMedicine/recovery/checkpoints/20261030-head-review-recovery-ready/SOURCE-BUILT.json');
 assert.equal(sha(receipt),'b70a0795547075e7a540a310d552d915f5425de974c23d9059ed33857b2f4042','Authenticated note-recovery source receipt');
 const saved=JSON.parse(receipt);assert.equal(saved.website,root);
 const historicalRead=path=>{
  const rows=saved.sourceRows.filter(row=>row.path===path);assert.equal(rows.length,1,path);
  const actual=readFileSync(root+'/'+path);assert.equal(actual.length,rows[0].bytes,path);assert.equal(sha(actual),rows[0].sha256,path);return actual;
 };
 const historical=structuredClone(before);historical.reviewIntegration='3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f';
 for(const path of ['atlas-review/manifest.json','atlas-review/integration-inputs.json','public/atlas-review-viewer/manifest.json'])historical.documents[path]=sha(historicalRead(path));
 const pin=validateCurrentAtlasDelivery({pin:historical,root,read:historicalRead});
 assert.throws(()=>validateCurrentAtlasDelivery({pin:before,root,read:historicalRead}),'Pre-recovery presentation fails against the actual recovery delivery');
 assert.throws(()=>validateCurrentAtlasDelivery({pin}),'The historical recovery presentation is not today’s delivery');`],
 ["  const altered=structuredClone(pin);altered[field]='0'.repeat(field==='reviewIntegration'?64:40);", "  const altered=validateCurrentAtlasDelivery();altered[field]='0'.repeat(field==='reviewIntegration'?64:40);"],
];
for(const [a,b]of edits){assert.equal(code.split(a).length,2);code=code.replace(a,b);}
let original=code;for(const[a,b]of [...edits].reverse())original=original.replace(b,a);assert.equal(original,before.toString());
const dest=root+'/rebinding/'+name;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,code,{flag:'wx'});
fs.writeFileSync(root+'/REBINDING_COMPOSITION.json',JSON.stringify({schema:'vm-rebinding-authentic-epoch-repair/1',rows:[{path:name,before:sha(before),after:sha(code),from:dest}],edits,originalPreserved:true,productChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:1,originalRecovered:true}));
