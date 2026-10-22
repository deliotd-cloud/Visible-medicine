// Copy only the exact named source handoff; no account, review DB or scan state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-traversal-candidate',prep=json(root+'/PREPARATION.json'),source=json(prep.sourceReceipt),current=json(root+'/SOURCE.json'),runtimePath=root+'/RUNTIME_EXPORT.json',runtime=json(runtimePath),site=root+'/website';
assert.equal(runtime.code,0);assert.equal(runtime.source,current.head);assert.equal(runtime.tree,current.tree);assert.equal(runtime.sourceReceiptSha256,sha(read(root+'/SOURCE.json')));assert(!fs.existsSync(site));
assert.equal(sha(read(prep.sourceReceipt)),prep.sourceReceiptSha256);for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'read-tree','HEAD']);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of source.sourceRows){if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));
 const to=containedTarget(site,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256,row.path);}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
const result={at:new Date().toISOString(),website:site,atlas:current.atlas,sourceReceipt:prep.sourceReceipt,sourceReceiptSha256:prep.sourceReceiptSha256,source:current.head,tree:current.tree,baseline:current.base,priorReview:source.review,
 runtimeReceipt:runtimePath,runtimeReceiptSha256:sha(read(runtimePath)),sourceCodeReceipt:root+'/SOURCE.json',sourceCodeReceiptSha256:sha(read(root+'/SOURCE.json')),sourceRows:source.sourceRows.length,hostChanges:[],privateRuntimeStateCopied:false,heldSourceAssetsLocalOnly:true,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/WEBSITE_PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:root+'/WEBSITE_PREPARED.json',source:current.head,sourcePaths:source.sourceRows.length,ownerPreviewChanged:false}));
