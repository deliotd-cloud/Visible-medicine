// Clone only verified controlled source; no normal preview, data or deployment changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-renal-tour-website-candidate',website=root+'/website';
const sourceReceipt='F:/VisibleMedicine/staging/20261022-current-consumer-assurance-successor/SOURCE.json',source=json(sourceReceipt);
assert.equal(sha(read(sourceReceipt)),'be8b13e91cb8dfeb8b420b91710437248c18ebe9232e6859a6fe54778b6a8079');
const native=json(path.dirname(sourceReceipt)+'/native-integration/TERMINAL.json');assert.equal(native.code,0);assert.equal(native.counts.pass,77);assert.deepEqual(native.sourceDrift,[]);
const atlasReceipt='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-verified/SOURCE.json',next=json(atlasReceipt);
assert.equal(sha(read(atlasReceipt)),'b594ff4d1008a6368c52f50054eb817b590e1b372db66f55625a49dc1d07e014');
const runtimeReceipt='F:/VisibleMedicine/staging/20261022-renal-tour-runtime-candidate/RUNTIME_EXPORT.json',runtime=json(runtimeReceipt);
assert.equal(sha(read(runtimeReceipt)),'3d24475176213dbf675898c3ca8481484342571740512844fbdbf8bd47b700d1');assert.equal(runtime.code,0);assert.equal(runtime.source,next.head);assert.equal(runtime.tree,next.tree);
const canonical='F:/VisibleMedicine/website',atlas=next.atlas;assert(!fs.existsSync(root));
assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),next.head);assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),next.tree);
assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
for(const row of next.sourceRows)assert.equal(sha(read(atlas+'/'+row.path)),row.sha256,row.path);
const held=new Map([['.local/disc-review/assets.ts','3355c0fdb96c189f6aa9e4e49975f701ab1e2255a194334c1d9f015df3c9ef77'],
 ['.local/optic-review/assets.ts','9a1f3ec4bc5fef227315be9599b7215d4f1746fdbc9f4e258b511776df41d58e'],
 ['.local/plexus-review/assets.ts','d631e8bd2bc26f8dd9973dd08a27bb8205e007cfbbccacdeefc22d83320c92ac']]);
for(const row of source.sourceRows){containedTarget(website,row.path);assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
 if(held.has(row.path))assert.equal(row.sha256,held.get(row.path));else assert(!/(^|\/)(?:\.local|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path),'No private runtime state');}
runGit(['clone','--shared','--no-checkout',canonical,website]);runGit(['-C',website,'read-tree','HEAD']);
for(const row of source.sourceRows){const to=containedTarget(website,row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+row.path,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256,row.path);}
fs.symlinkSync(canonical+'/node_modules',website+'/node_modules','junction');fs.symlinkSync(atlas,root+'/atlas','junction');
const result={at:new Date().toISOString(),website,atlas,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),copied:source.sourcePaths,
 source:next.head,tree:next.tree,baseline:next.baseline,atlasReceipt,atlasReceiptSha256:sha(read(atlasReceipt)),runtimeReceipt,runtimeReceiptSha256:sha(read(runtimeReceipt)),
 priorReview:source.review,privateRuntimeStateCopied:false,controlledHeldSourceAssetsLocalOnly:true,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/WEBSITE_PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
