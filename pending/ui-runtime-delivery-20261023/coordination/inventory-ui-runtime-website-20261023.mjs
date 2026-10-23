// Advance only the staging inventory through its unchanged producer; no access
// policy, source model, clinical record, preview or runtime file is edited.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-coherent-ui-runtime-website',receipt=root+'/SOURCE_UNBOUND.json';
assert.equal(sha(read(receipt)),'16ab5ce0383b9ac3c70dd10cf96d42b9fec45933dc013951c6cac6856b4ed208');
const source=json(receipt),target='lib/atlas-model-inventory.json',before=read(source.website+'/'+target),prior=JSON.parse(before);
assert.equal(sha(before),'2e5accc6d2a6c749bbacdfc5721b841a57a6cce715be6c3bd300870b28680284');
assert.equal(sha(read(source.website+'/scripts/atlas-model-inventory.mjs')),source.sourceRows.find(r=>r.path==='scripts/atlas-model-inventory.mjs').sha256);
assert(!fs.existsSync(root+'/INVENTORY.json'));fs.writeFileSync(root+'/inventory.before.json',before,{flag:'wx'});
const args=['--max-old-space-size=128','scripts/atlas-model-inventory.mjs'],result=spawnSync(process.execPath,args,{cwd:source.website,windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=128'},encoding:'utf8',maxBuffer:2*1024*1024});
fs.writeFileSync(root+'/inventory.stdout.log',result.stdout??'',{flag:'wx'});fs.writeFileSync(root+'/inventory.stderr.log',result.stderr??'',{flag:'wx'});
assert.equal(result.error,undefined);assert.equal(result.status,0,(result.stdout??'')+(result.stderr??''));
const next=json(source.website+'/'+target);assert.deepEqual(next.models,prior.models,'No new model, path, byte or source-geometry admission');
assert.deepEqual(Object.keys(next).sort(),Object.keys(prior).sort());for(const field of ['schemaVersion','purpose','learnerDelivery'])assert.deepEqual(next[field],prior[field]);
assert.deepEqual(next.sources.map(r=>r.module),prior.sources.map(r=>r.module));
for(const row of next.sources){const old=prior.sources.find(r=>r.module===row.module),file=source.website+'/public/atlas-runtime/'+row.module+'/manifest.json';assert.equal(row.modelPaths,old.modelPaths);assert.equal(row.manifestSha256,sha(read(file)));assert.equal(row.sourceCommit,json(file).sourceCommit);assert.equal(row.sourceCommit,['head-neck','shoulder'].includes(row.module)?source.atlasHead:old.sourceCommit);}
const slab=Buffer.alloc(65536);const hash=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const changed=[];const sourceRows=source.sourceRows.map(row=>{const file=source.website+'/'+row.path,digest=hash(file);if(digest!==row.sha256)changed.push(row.path);return {...row,bytes:fs.statSync(file).size,sha256:digest};});assert.deepEqual(changed,[target]);
const record={at:new Date().toISOString(),args,exitCode:result.status,heapMiB:128,inventoryBeforeSha256:sha(before),inventoryAfterSha256:sha(read(source.website+'/'+target)),models:next.models.length,paths:next.models.flatMap(r=>r.paths).length,modelBytes:next.models.reduce((n,r)=>n+r.bytes,0),completeModelByteAndPathSetUnchanged:true,sourceManifestTuplesOnlyChanged:true,changedPaths:changed,stdoutSha256:sha(read(root+'/inventory.stdout.log')),stderrSha256:sha(read(root+'/inventory.stderr.log')),newModelAdmission:false,accessPolicyChanged:false,protectedReviewBound:false,previewChanged:false,installed:false};
fs.writeFileSync(root+'/INVENTORY.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
const advanced={...source,at:record.at,sourceRows,previousSourceReceipt:receipt,previousSourceReceiptSha256:sha(read(receipt)),producerAdvance:root+'/INVENTORY.json',producerAdvanceSha256:sha(read(root+'/INVENTORY.json')),inventoryGenerated:true,staleKnownContracts:['tests/fixtures/current-atlas-delivery.json','delivery-policy source-fingerprint verification'],reviewBound:false};
fs.writeFileSync(root+'/SOURCE_INVENTORIED.json',JSON.stringify(advanced,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/SOURCE_INVENTORIED.json',sha256:sha(read(root+'/SOURCE_INVENTORIED.json')),models:record.models,paths:record.paths,modelBytes:record.modelBytes,changedPaths:changed,newModelAdmission:false,accessPolicyChanged:false,previewChanged:false,protectedReviewBound:false}));
