// Isolated source-only successor. Never copies account, scan or Review state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-imaging-presentation-candidate';
const previousPath='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/SOURCE_WEBSITE.json';
assert.equal(sha(read(previousPath)),'3f7352fce82f43d5cb28a4adba54905302bd93e0613681515c7c6158413814a7');
const previous=json(previousPath),site=root+'/website';
if(fs.existsSync(root))assert.deepEqual(fs.readdirSync(root),[],'Only the empty preflight-refused stage may be reused');
else fs.mkdirSync(root);
assert.equal(runGit(['-C',previous.atlas,'rev-parse','HEAD']).toString().trim(),previous.atlasHead);
assert.equal(runGit(['-C',previous.atlas,'status','--porcelain']).toString().trim(),'');
runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);
runGit(['-C',site,'read-tree','HEAD']);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
for(const row of previous.sourceRows){
 assert.equal(sha(read(previous.website+'/'+row.path)),row.sha256,row.path);
 if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));
 const dest=containedTarget(site,row.path);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(previous.website+'/'+row.path,dest,fs.constants.COPYFILE_EXCL);
}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
fs.symlinkSync(previous.atlas,root+'/atlas','junction');
const fixtures=['app/layout.tsx','app/globals.css','components/HeadAtlasViewer.tsx','tests/local-font-distribution.test.mjs','tests/font-alias-scope.test.mjs','tests/head-model-access-integration.test.mjs','tests/fixtures/current-atlas-delivery.json'];
const frozen=[];
for(const p of fixtures){
 const dest='tests/fixtures/imaging-presentation-before/'+p+'.raw',target=containedTarget(site,dest);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(site+'/'+p,target,fs.constants.COPYFILE_EXCL);
 frozen.push({path:p,fixture:dest,sha256:sha(read(target))});
}
const result={at:new Date().toISOString(),website:site,previousSource:previousPath,previousSourceSha256:sha(read(previousPath)),atlas:previous.atlas,atlasHead:previous.atlasHead,atlasTree:previous.atlasTree,previousReview:previous.review,frozen,preflightCorrection:'First invocation failed before clone or source copy: runGit returns Buffer, not string. Added explicit toString; reused only the verified-empty stage. Raw error was displayed by the tool, not saved as a separate log.',privateRuntimeStateCopied:false,canonicalInstalled:false,ownerPreviewChanged:false};
fs.writeFileSync(root+'/PREPARED.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result));
