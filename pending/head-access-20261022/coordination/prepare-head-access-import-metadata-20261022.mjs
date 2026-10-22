import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate',prepared=json(root+'/PREPARATION.json'),source=json(root+'/SOURCE.json'),runtimePath=root+'/RUNTIME_EXPORT.json',runtime=json(runtimePath);
assert.equal(runtime.code,0);assert(runtime.commands.every(c=>c.code===0));assert.equal(runtime.source,source.head);assert.equal(runtime.tree,source.tree);assert.equal(runtime.sourceReceiptSha256,sha(read(root+'/SOURCE.json')));
assert.equal(runGit(['-C',prepared.atlas,'status','--porcelain']).toString().trim(),'');
assert(!fs.existsSync(root+'/WEBSITE_PREPARED.json'));
const result={at:new Date().toISOString(),website:prepared.website,atlas:prepared.atlas,sourceReceipt:prepared.sourceReceipt,sourceReceiptSha256:prepared.sourceReceiptSha256,
 source:source.head,tree:source.tree,baseline:source.base,priorReview:prepared.baseReview,runtimeReceipt:runtimePath,runtimeReceiptSha256:sha(read(runtimePath)),sourceCodeReceipt:root+'/SOURCE.json',sourceCodeReceiptSha256:sha(read(root+'/SOURCE.json')),
 sourceRows:json(prepared.sourceReceipt).sourceRows.length,hostChanges:source.hostChanges,privateRuntimeStateCopied:false,heldSourceAssetsLocalOnly:true,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/WEBSITE_PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path:root+'/WEBSITE_PREPARED.json',source:source.head,runtimeVerified:true,ownerPreviewChanged:false}));
