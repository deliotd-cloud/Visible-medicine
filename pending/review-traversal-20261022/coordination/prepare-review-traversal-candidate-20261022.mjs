// New Atlas source checkout only; preserve the accepted isolated head candidate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
const receipt='F:/VisibleMedicine/staging/20261022-head-model-access-candidate/SOURCE_WEBSITE_V2.json',source=json(receipt),proposal='F:/VisibleMedicine/staging/20261022-review-traversal-source-proposal',result=json(proposal+'/RESULT.json');
assert.equal(sha(read(receipt)),'f56d329c5092b59237256be431c61294a797ba272c84047b04bdaa69257012f8');
assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
assert.equal(sha(read(source.atlas+'/app/review/review-dashboard.tsx')),result.baseline.originalDashboardSha256);
const root='F:/VisibleMedicine/staging/20261022-review-traversal-candidate',atlas=root+'/atlas';assert(!fs.existsSync(root));fs.mkdirSync(root);
runGit(['clone','--shared','--no-checkout',source.atlas,atlas]);runGit(['-C',atlas,'config','core.autocrlf','false']);runGit(['-C',atlas,'config','core.eol','lf']);runGit(['-C',atlas,'checkout','--detach',source.atlasHead]);
assert.equal(runGit(['-C',atlas,'rev-parse','HEAD^{tree}']).toString().trim(),source.atlasTree);fs.symlinkSync('F:/VisibleMedicine/atlas/node_modules',atlas+'/node_modules','junction');
const rows=[];for(const row of result.proposedFiles){assert.equal(sha(read(proposal+'/'+row.path)),row.sha256);const to=atlas+'/'+row.path;
 if(fs.existsSync(to)){const before=root+'/before/'+row.path;fs.mkdirSync(path.dirname(before),{recursive:true});fs.copyFileSync(to,before,fs.constants.COPYFILE_EXCL);}
 fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(proposal+'/'+row.path,to);rows.push({path:row.path,sha256:sha(read(to))});}
fs.writeFileSync(root+'/PREPARATION.json',JSON.stringify({at:new Date().toISOString(),root,atlas,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),baseAtlas:source.atlasHead,baseTree:source.atlasTree,baseReview:source.review,proposalReceiptSha256:sha(read(proposal+'/RESULT.json')),rows,canonicalInstalled:false,ownerPreviewChanged:false,privateDataCopied:false,clinicalApproval:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,atlas,base:source.atlasHead,changedPaths:rows.map(r=>r.path),ownerPreviewChanged:false}));
