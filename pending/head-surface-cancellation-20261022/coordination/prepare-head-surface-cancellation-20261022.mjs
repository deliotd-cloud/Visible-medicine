// Create-only source snapshot; no installed checkout, preview or private state changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor',website=root+'/website';
const receipt='F:/VisibleMedicine/staging/20261022-head-modality-3d-context-successor/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'b9c972cf68305f7f621ef12e3db1c421389439d78ee7716e7373b0789c8241a7');
assert.equal(source.sourcePaths,6155);assert(!fs.existsSync(website));
assert.equal(json(path.dirname(receipt)+'/quality-build/TERMINAL.json').code,0);
const canonical='F:/VisibleMedicine/website';
assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);
assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const held=new Map([['.local/disc-review/assets.ts','3355c0fdb96c189f6aa9e4e49975f701ab1e2255a194334c1d9f015df3c9ef77'],['.local/optic-review/assets.ts','9a1f3ec4bc5fef227315be9599b7215d4f1746fdbc9f4e258b511776df41d58e'],['.local/plexus-review/assets.ts','d631e8bd2bc26f8dd9973dd08a27bb8205e007cfbbccacdeefc22d83320c92ac']]);
for(const row of source.sourceRows){
 containedTarget(website,row.path);assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 if(held.has(row.path))assert.equal(row.sha256,held.get(row.path));
 else assert(!/(^|\/)(?:\.local|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path),'Private state: '+row.path);
}
runGit(['clone','--shared','--no-checkout',canonical,website]);runGit(['-C',website,'read-tree','HEAD']);
for(const row of source.sourceRows){const to=containedTarget(website,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256,row.path);}
fs.symlinkSync(canonical+'/node_modules',website+'/node_modules','junction');fs.symlinkSync(source.atlas,root+'/atlas','junction');
const result={at:new Date().toISOString(),website,atlas:source.atlas,atlasHead:source.atlasHead,atlasTree:source.atlasTree,
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),copied:source.sourcePaths,priorReview:source.review,
 privateRuntimeStateCopied:false,controlledHeldSourceAssetsLocalOnly:true,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
