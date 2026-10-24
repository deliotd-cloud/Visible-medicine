import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-orbital-ct-website',site=stage+'/website',proposal='F:/VisibleMedicine/staging/20261024-orbital-ct-head-history-proposal',handoff=json(proposal+'/HANDOFF.json'),files=[];
assert.equal(hash(handoff.historicalReceipt),handoff.historicalReceiptSha256);
for(const r of handoff.preimages){assert.equal(hash(proposal+'/'+r.path),r.sha256);const original='tests/'+path.basename(r.path).replace(/\.raw$/,'');assert.equal(hash(site+'/'+original),r.sha256);const saved=stage+'/preimages/'+original+'.raw';fs.mkdirSync(path.dirname(saved),{recursive:true});fs.copyFileSync(site+'/'+original,saved,fs.constants.COPYFILE_EXCL);}
for(const r of handoff.proposalFiles){assert.equal(hash(proposal+'/'+r.path),r.sha256);fs.copyFileSync(proposal+'/'+r.path,site+'/'+r.path);files.push(r);}
fs.writeFileSync(stage+'/HEAD_HISTORY_INTEGRATION.json',JSON.stringify({at:new Date().toISOString(),proposal,proposalSha256:hash(proposal+'/HANDOFF.json'),files,originalTestPreimages:handoff.preimages,testsRunByWorker:false,mainReviewCompleted:true,previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({copied:files.length,previewChanged:false}));
