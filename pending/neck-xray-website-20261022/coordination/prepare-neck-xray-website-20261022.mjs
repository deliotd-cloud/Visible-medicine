// Frozen-source clone only; no normal website, deployment or database changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-neck-xray-website-candidate',website=root+'/website';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-review-return-refresh-successor/SOURCE.json',source=json(sourceReceipt);
assert.equal(sha(read(sourceReceipt)),'7ecb9d226386b8f31dcb8949fca8084d55a2d1d64fee9cfa43a7579426959b52');
assert.equal(json(path.dirname(sourceReceipt)+'/quality-build/TERMINAL.json').code,0);assert.equal(source.sourcePaths,6114);assert(!fs.existsSync(website));
const canonical='F:/VisibleMedicine/website',atlas='F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas';
assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'389bd0ca846a42c7f21055f55904bcf5df81a09f');
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
const held=new Map([['.local/disc-review/assets.ts','3355c0fdb96c189f6aa9e4e49975f701ab1e2255a194334c1d9f015df3c9ef77'],['.local/optic-review/assets.ts','9a1f3ec4bc5fef227315be9599b7215d4f1746fdbc9f4e258b511776df41d58e'],['.local/plexus-review/assets.ts','d631e8bd2bc26f8dd9973dd08a27bb8205e007cfbbccacdeefc22d83320c92ac']]);
for(const row of source.sourceRows){containedTarget(website,row.path);assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 if(held.has(row.path))assert.equal(row.sha256,held.get(row.path));else assert(!/(^|\/)(?:\.local|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path),'No private runtime state');}
runGit(['clone','--shared','--no-checkout',canonical,website]);runGit(['-C',website,'read-tree','HEAD']);
for(const row of source.sourceRows){const to=containedTarget(website,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256,row.path);}
fs.symlinkSync(canonical+'/node_modules',website+'/node_modules','junction');fs.symlinkSync(atlas,root+'/atlas','junction');
const result={at:new Date().toISOString(),website,atlas,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),copied:source.sourcePaths,
 source:'389bd0ca846a42c7f21055f55904bcf5df81a09f',tree:'25acdee40ee57e0253cdcca924aa64b4b38586c8',baseline:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',
 priorReview:source.review,privateRuntimeStateCopied:false,controlledHeldSourceAssetsLocalOnly:true,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/WEBSITE_PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
