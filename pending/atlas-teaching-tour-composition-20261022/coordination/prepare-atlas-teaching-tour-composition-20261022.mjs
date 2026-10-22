import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-atlas-teaching-tour-composition',atlas=root+'/atlas';
const baseline='F:/VisibleMedicine/staging/20261022-review-traversal-candidate/atlas',head='2381efe43b75f8a7fb768a069eecd7268c508dac';
const git=(cwd,...args)=>runGit(['-C',cwd,...args]).toString().trim();
assert(!fs.existsSync(root));assert.equal(git(baseline,'rev-parse','HEAD'),head);assert.equal(git(baseline,'status','--porcelain'),'');
const proposals=[
 ['F:/VisibleMedicine/staging/20261022-legacy-shoulder-ct-evidence','61136239f15527cf31a051ff71e0cb713034d5b07b71c97f1590d0ebd6cc42a8'],
 ['F:/VisibleMedicine/staging/20261022-regional-tour-commit-controls','a9ccb65d2b8f3c14b44810975b48dbaf44d2a7ea54f1f31eddb9055c96ebcba6'],
 ['F:/VisibleMedicine/staging/20261022-hamstring-guided-tours','0489edf6c9abd21f732d24365fa178ffbdea04a53385ba00d332954df67dab63'],
].map(([stage,hash])=>{assert.equal(sha(read(stage+'/MAIN_REVIEW.json')),hash);const review=json(stage+'/MAIN_REVIEW.json');assert.equal(review.baseline.head,head);return{stage,hash,review};});
const overlay=proposals.flatMap(({stage,review})=>review.proposal.map(row=>({...row,from:stage+(stage.includes('regional-tour-commit-controls')?'/atlas':'')+'/'+row.path})));
assert.equal(overlay.length,13);assert.equal(new Set(overlay.map(row=>row.path)).size,13);for(const row of overlay){assert(!path.isAbsolute(row.path)&&!row.path.includes('..'));assert.equal(sha(read(row.from)),row.sha256);}
const rows=git(baseline,'ls-tree','-r','-l','HEAD').split('\n');const trackedBytes=rows.reduce((sum,row)=>sum+Number(row.split(/\s+/)[3]||0),0);assert(Number.isFinite(trackedBytes)&&trackedBytes<2*1024**3,'Bounded source checkout required');
fs.mkdirSync(root);runGit(['clone','--shared','--no-checkout',baseline,atlas]);runGit(['-C',atlas,'config','core.autocrlf','false']);runGit(['-C',atlas,'config','core.eol','lf']);runGit(['-C',atlas,'checkout','--detach',head]);
assert.equal(git(atlas,'rev-parse','HEAD^{tree}'),'db21ed3dee259c390878450b3495468996a3af85');assert.equal(git(atlas,'status','--porcelain'),'');
fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',atlas+'/node_modules','junction');
for(const row of overlay){const to=atlas+'/'+row.path;if(fs.existsSync(to)){const preimage=root+'/preimage/'+row.path;fs.mkdirSync(path.dirname(preimage),{recursive:true});fs.copyFileSync(to,preimage,fs.constants.COPYFILE_EXCL);}fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(row.from,to);assert.equal(sha(read(to)),row.sha256);}
assert.equal(git(atlas,'diff','--name-only','--','public/models'),'');assert.equal(git(baseline,'status','--porcelain'),'');
const receipt={at:new Date().toISOString(),root,atlas,baseline,head,tree:git(atlas,'rev-parse','HEAD^{tree}'),trackedBytes,proposals:proposals.map(({stage,hash})=>({stage,mainReviewSha256:hash})),overlay,sourceCompositionOnly:true,stageSpecificTestPathsStillPending:true,reviewRuntimeBindingPending:true,fullTypesBuildBrowserPending:true,canonicalInstalled:false,previewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({preparation:root+'/PREPARATION.json',sha256:sha(read(root+'/PREPARATION.json')),atlas,overlayPaths:13,trackedBytes,previewChanged:false}));
