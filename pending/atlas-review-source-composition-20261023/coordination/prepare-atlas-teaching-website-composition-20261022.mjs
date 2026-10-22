import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-atlas-teaching-website-composition',site=root+'/website';
const sourcePath='F:/VisibleMedicine/staging/20261022-head-review-commit-candidate/SOURCE_V2.json';
assert.equal(sha(read(sourcePath)),'83ca32a88ab937bcf121908f5b39579ed2b7aaf40c7112e0d7abc08f7dabee14');
const source=json(sourcePath),pointer=json('CURRENT_CHECKPOINT.json'),atlas=pointer.activeWork.current.pendingAtlasTeachingTourComposition;
assert.equal(pointer.activeWork.current.ownerPreviewPolicy.restartPermitted,false);
assert.equal(runGit(['-C',atlas.candidate,'rev-parse','HEAD']).toString().trim(),atlas.localHead);
assert.equal(runGit(['-C',atlas.candidate,'status','--porcelain']).toString().trim(),'');
assert(!fs.existsSync(root));fs.mkdirSync(root);
const held=new Set(['.local/disc-review/assets.ts','.local/optic-review/assets.ts','.local/plexus-review/assets.ts']);
function target(relative){assert(!path.isAbsolute(relative)&&!relative.includes('\\')&&!relative.split('/').some(p=>!p||p==='..'||p==='.'),'Unsafe named source');const p=path.resolve(site,relative);assert(p.startsWith(path.resolve(site)+path.sep));return p;}
runGit(['clone','--shared','--no-checkout','F:/VisibleMedicine/website',site]);runGit(['-C',site,'config','core.autocrlf','false']);runGit(['-C',site,'read-tree','HEAD']);
for(const row of source.sourceRows){
 if(!held.has(row.path))assert(!/(^|\/)(?:\.env(?:\.[^/]*)?|\.local|node_modules|\.git)(?:\/|$)|\.(?:dcm|dicom|nii(?:\.gz)?|sqlite3?|db)$/i.test(row.path));
 const from=source.website+'/'+row.path;assert(fs.lstatSync(from).isFile()&&!fs.lstatSync(from).isSymbolicLink());assert.equal(sha(read(from)),row.sha256,row.path);
 const to=target(row.path);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(to)),row.sha256);
}
fs.symlinkSync('F:/VisibleMedicine/website/node_modules',site+'/node_modules','junction');
const overlays=[];
const saveOverlay=(relative,from,expected)=>{const bytes=read(from);assert.equal(sha(bytes),expected);const to=target(relative);
 if(fs.existsSync(to)){const before=root+'/preimage/'+relative;fs.mkdirSync(path.dirname(before),{recursive:true});fs.copyFileSync(to,before,fs.constants.COPYFILE_EXCL);}
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);overlays.push({path:relative,from,sha256:sha(bytes)});
};
const bookmark=json(pointer.activeWork.current.pendingHeadBookmarkCommitControls.mainReview);
for(const row of bookmark.sourceHashes)saveOverlay(row.path,'F:/VisibleMedicine/staging/20261022-head-bookmark-commit-controls/website/'+row.path,row.sha256);
const arterial=pointer.activeWork.current.pendingArterialCurrentRole;saveOverlay('tests/arterial-history-preservation.test.mjs',arterial.overlay,arterial.overlaySha256);
const importer=site+'/scripts/import-clinical-review.mjs',before=read(importer).toString();
const from=`const revision = '${source.atlasHead}';`,to=`const revision = '${atlas.localHead}';`;assert.equal(before.split(from).length,2);
fs.mkdirSync(root+'/preimage/scripts',{recursive:true});fs.copyFileSync(importer,root+'/preimage/scripts/import-clinical-review.mjs',fs.constants.COPYFILE_EXCL);
fs.writeFileSync(importer,before.replace(from,to));
const receipt={at:new Date().toISOString(),website:site,sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),namedSourcePaths:source.sourceRows.length,
 atlas:atlas.candidate,atlasHead:atlas.localHead,atlasTree:atlas.localTree,sourceOverlays:overlays,importerSha256:sha(read(importer)),
 status:'preparation-only-not-rebound-not-admitted',heldSourceAssetsLocalOnly:true,privateRuntimeStateCopied:false,
 previewChanged:false,installed:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),sourcePaths:source.sourceRows.length,atlasHead:atlas.localHead,previewChanged:false}));
