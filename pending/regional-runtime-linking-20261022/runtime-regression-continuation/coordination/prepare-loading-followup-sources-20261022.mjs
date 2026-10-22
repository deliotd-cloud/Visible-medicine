import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const checkpointPath='F:/VisibleMedicine/recovery/checkpoints/20261022-loading-binding-repair-verified/checkpoint.json';
assert.equal(sha(read(checkpointPath)),'9958ca944e3085b25214e0882b3edbb1a83c2a018ecd59418c30890ef847b3f4');
const checkpoint=json(checkpointPath),source=json(checkpoint.sourceReceipt),stage='F:/VisibleMedicine/staging/20261022-loading-followup-sources';
assert(!fs.existsSync(stage));assert.equal(checkpoint.pendingSourceProposals.length,13);
assert.equal(json(checkpoint.focusedNativeTerminal).code,0);
for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,'Exact built candidate: '+row.path);
for(const row of checkpoint.pendingSourceProposals){
 assert.equal(sha(read(row.proposal)),row.sha256);
 if(row.before){assert.equal(sha(read(row.before)),row.beforeSha256);assert.deepEqual(read(row.before),read(source.website+'/'+row.path));}
 else assert(!fs.existsSync(source.website+'/'+row.path));
}
fs.mkdirSync(stage);
for(const row of checkpoint.pendingSourceProposals){
 for(const kind of ['CODE','PREVIOUS-CODE']){const to=stage+'/'+kind+'/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.proposal,to,fs.constants.COPYFILE_EXCL);}
 if(row.before){const to=stage+'/RAW/'+row.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.before,to,fs.constants.COPYFILE_EXCL);}
}
const plan={at:new Date().toISOString(),sourceReceipt:checkpoint.sourceReceipt,sourceReceiptSha256:checkpoint.sourceReceiptSha256,
 review:source.review,boundInputs:1724,previousNativeCounts:checkpoint.previousRegressionCounts,
 proposals:checkpoint.pendingSourceProposals.map(row=>({...row,previousProposal:row.proposal,proposal:stage+'/CODE/'+row.path})),
 applied:false,ownerPreviewChanged:false,next:'Compose the exact current count in native-focus and its complete source witness; preserve all other proposal bytes before overlay.'};
fs.writeFileSync(stage+'/PREPARED.json',JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,proposals:13,applied:false,preparedSha256:sha(read(stage+'/PREPARED.json'))}));
