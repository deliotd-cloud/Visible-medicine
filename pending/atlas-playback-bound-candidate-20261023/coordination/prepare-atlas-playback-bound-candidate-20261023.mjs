import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261023-atlas-playback-bound-candidate',site=root+'/atlas';
const patchRoot='F:/VisibleMedicine/staging/20261023-nested-tour-library-pause';
const report=json(patchRoot+'/MAIN_REVIEW.json'),prep=json(patchRoot+'/PREPARATION.json'),base=prep.baseline;
assert(!fs.existsSync(root));assert.equal(runGit(['-C',base,'status','--porcelain']).toString().trim(),'');
assert.equal(runGit(['-C',base,'rev-parse','HEAD']).toString().trim(),prep.head);
for(const row of report.sourceRows)assert.equal(sha(read(report.atlas+'/'+row.path)),row.sha256);
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout',base,site]);
// Flatten the known, verified objects closure before any tree traversal. Do not
// change an existing checkout or exceed Git's alternates recursion depth.
const stores=['F:/VisibleMedicine/atlas/.git/objects',
 'F:/VisibleMedicine/staging/20261022-neck-landmark-xray-candidate/atlas/.git/objects',
 'F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate/atlas/.git/objects',
 'F:/VisibleMedicine/staging/20261022-renal-canonical-checkout/atlas/.git/objects',
 'F:/VisibleMedicine/staging/20261022-head-model-access-candidate/atlas/.git/objects',
 'F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas/.git/objects',base+'/.git/objects'];
for(const p of stores)assert(fs.statSync(p).isDirectory());
fs.writeFileSync(site+'/.git/objects/info/alternates',stores.join('\n')+'\n');
runGit(['-C',site,'config','core.autocrlf','false']);runGit(['-C',site,'config','core.eol','lf']);
runGit(['-C',site,'sparse-checkout','init','--no-cone']);
runGit(['-C',site,'sparse-checkout','set','--no-cone','--stdin'],Buffer.from(prep.sparsePatterns.join('\n')+'\n'));
runGit(['-C',site,'checkout','--detach',prep.head]);fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',site+'/node_modules','junction');
assert.equal(runGit(['-C',site,'status','--porcelain']).toString().trim(),'');
for(const row of report.sourceRows){
 const dest=site+'/'+row.path;fs.mkdirSync(path.dirname(dest),{recursive:true});
 if(fs.existsSync(dest))assert.deepEqual(read(dest),runGit(['-C',base,'show',prep.head+':'+row.path]));
 fs.copyFileSync(report.atlas+'/'+row.path,dest);
}
const receipt={at:new Date().toISOString(),atlas:site,baseline:base,baselineHead:prep.head,baselineTree:prep.tree,patchRoot,patchReviewSha256:sha(read(patchRoot+'/MAIN_REVIEW.json')),sourceRows:report.sourceRows,
 sparsePatterns:prep.sparsePatterns,scope:'Source/text/metadata only. Does not materialize binary models, perform a runtime export, or affect any preview. Renderer producer, current test command and exact historical inverse remain to be verified.',previewChanged:false,installed:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),sourceOnly:true,patchFiles:report.sourceRows.length}));
