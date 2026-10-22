// Isolated producer and host sources only. No normal-preview restart or cutover.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-model-access-candidate';assert(!fs.existsSync(root));
const receipt='F:/VisibleMedicine/staging/20261022-renal-gitbytes-website-candidate/SOURCE_V3.json',source=json(receipt);
assert.equal(sha(read(receipt)),'274b98b13bdbe1e092b33d0671d2462010045242ce40149fefb1405d677366b5');
assert.equal(json(path.dirname(receipt)+'/verification-v3/TERMINAL.json').code,0);
for(const r of source.sourceRows)assert.equal(sha(read(source.website+'/'+r.path)),r.sha256,r.path);
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
const atlas=root+'/atlas',website=root+'/website';fs.mkdirSync(root);
runGit(['clone','--shared','--no-checkout',source.atlas,atlas]);runGit(['-C',atlas,'config','core.autocrlf','false']);runGit(['-C',atlas,'config','core.eol','lf']);runGit(['-C',atlas,'checkout','--detach',source.atlasHead]);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),source.atlasTree);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',atlas+'/node_modules','junction');
runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',website]);runGit(['-C',website,'read-tree','HEAD']);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const r of source.sourceRows){
 if(!held.has(r.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(r.path),'No private runtime state');
 const to=containedTarget(website,r.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+r.path,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),r.sha256,r.path);
}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',website+'/node_modules','junction');
const preimages=[['host','components/HeadAtlasInlineComparison.tsx'],['host','lib/head-live-selection.ts'],['host','tests/head-inline-frame.test.ts'],['host','tests/head-live-selection.test.ts']];
for(const[role,p]of preimages){const to=root+'/before/'+role+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(website+'/'+p,to,fs.constants.COPYFILE_EXCL);}
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),root,atlas,website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),baseAtlas:source.atlasHead,baseTree:source.atlasTree,baseReview:source.review,sourcePaths:source.sourceRows.length,
 hostPreimages:preimages.map(([role,p])=>({path:p,sha256:sha(read(root+'/before/'+role+'/'+p))})),nonRunnableUntilRebound:true,privateRuntimeStateCopied:false,heldSourceAssetsLocalOnly:true,canonicalInstalled:false,ownerPreviewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,sourcePaths:source.sourceRows.length,baseAtlas:source.atlasHead,ownerPreviewChanged:false}));
