import fs from 'node:fs';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
const root='G:/VisibleMedicine-temp/staging/20261030-review-release-continuation',source=json(root+'/SOURCE.json'),site=source.website;
const file='tests/fixtures/current-atlas-delivery.json',savedBefore=root+'/DELIVERY_PIN_BEFORE.json';
for(const row of source.sourceRows)assert.equal(hash(row.path===file&&fs.existsSync(savedBefore)?savedBefore:site+'/'+row.path),row.sha256,row.path);
const original='F:/VisibleMedicine/recovery/checkpoints/20261030-head-review-recovery-ready/SOURCE-BUILT.json';
assert.equal(hash(original),'b70a0795547075e7a540a310d552d915f5425de974c23d9059ed33857b2f4042');
const accepted=json(original),before=json(fs.existsSync(savedBefore)?savedBefore:site+'/'+file),next=structuredClone(before);
assert.equal(before.source,'c32bc81cf0fd7ec22fa83e8b1365019297f9a0b3');
assert.equal(before.reviewIntegration,'b19af8bcda01ba8c73df3a7ee339178a520091f888b4486a1ff17bbef3496553');
const binding=json(site+'/atlas-review/integration-inputs.json');
assert.equal(binding.sha256,'3648a75bdf7543a29047e74193231fad27afd450d9b0ebc7164393ba2a0d3b2f');
assert(binding.inputs.some(row=>row.path==='lib/head-teaching-review-recovery.ts'&&row.sha256===hash(site+'/'+row.path)));
const changed=[];
for(const [name,digest]of Object.entries(before.documents)){
 const pinned=accepted.sourceRows.find(row=>row.path===name);assert(pinned,name);
 assert.equal(hash(site+'/'+name),pinned.sha256,name);
 if(digest!==pinned.sha256){next.documents[name]=pinned.sha256;changed.push(name);}
}
assert.deepEqual(changed.sort(),['atlas-review/integration-inputs.json','atlas-review/manifest.json','public/atlas-review-viewer/manifest.json'].sort());
next.reviewIntegration=binding.sha256;
if(fs.existsSync(savedBefore))assert.deepEqual(json(site+'/'+file),next,'Only the exact partially written fixture may resume');
else fs.writeFileSync(savedBefore,fs.readFileSync(site+'/'+file),{flag:'wx'});
fs.writeFileSync(site+'/'+file,JSON.stringify(next,null,2)+'\n');
const {validateCurrentAtlasDelivery}=await import(pathToFileURL(site+'/tests/current-atlas-delivery.mjs').href);
assert.deepEqual(validateCurrentAtlasDelivery(),next);
assert.throws(()=>validateCurrentAtlasDelivery({pin:before}),'Stale binding must still be rejected');
for(const mutate of [pin=>pin.source='0'.repeat(40),pin=>pin.reviewIntegration='0'.repeat(64),pin=>pin.documents['atlas-review/manifest.json']='0'.repeat(64),pin=>pin.clinicalApproval=true]){
 const forged=structuredClone(next);mutate(forged);assert.throws(()=>validateCurrentAtlasDelivery({pin:forged}));
}
const rows=source.sourceRows.map(row=>({...row,bytes:fs.statSync(site+'/'+row.path).size,sha256:hash(site+'/'+row.path)}));
fs.writeFileSync(root+'/SOURCE-2.json',JSON.stringify({...source,at:new Date().toISOString(),sourceRows:rows,testOnlyChanged:[...source.testOnlyChanged,file],previous:{path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')}},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(root+'/DELIVERY_PIN_REFRESH.json',JSON.stringify({source:{path:original,sha256:hash(original)},changedDocuments:changed,reviewIntegration:binding.sha256,productionSourceChanged:false,staleAndForgedRejected:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({updatedDocuments:changed.length,sourceOnlyTests:true,staleAndForgedRejected:true}));
