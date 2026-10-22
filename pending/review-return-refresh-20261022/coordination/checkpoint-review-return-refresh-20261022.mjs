// Source-only recovery for the isolated review return-refresh milestone.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-review-return-refresh-successor';
const receipt=stage+'/SOURCE.json',source=json(receipt),website=source.website;
assert.equal(sha(read(receipt)),'7ecb9d226386b8f31dcb8949fca8084d55a2d1d64fee9cfa43a7579426959b52');
assert.equal(source.sourcePaths,6114);assert.equal(source.review,'3ed1585515a52a0480bc433aa135309abc38bace5f9a581cffe3b48660f23a9a');
const nativePath=stage+'/native-integration/TERMINAL.json',qualityPath=stage+'/quality-build/TERMINAL.json';
const native=json(nativePath),quality=json(qualityPath),browserPath=stage+'/browser-specimen-v2/OBSERVED.json',browser=json(browserPath);
assert.equal(native.code,0);assert.equal(native.counts.fail,0);assert.equal(native.counts.tests,native.counts.pass);
assert.equal(native.counts.skipped,0);assert.equal(native.counts.cancelled,0);assert.deepEqual(native.sourceDrift,[]);
assert.equal(quality.code,0);assert(quality.reviewBindingUnchanged);assert.deepEqual(quality.sourceDrift,[]);
assert.equal(browser.sourceReceiptSha256,sha(read(receipt)));assert(browser.allNamedCasesPassed);
assert(browser.ownedTabsClosed&&browser.ownedServerStopped);assert.equal(browser.ownerPreviewChanged,false);
const installedWebsite='b953ff3f5f1891599cb6e91cb91311d9d6006270',installedAtlas='6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1';
const gitHead=root=>runGit(['-C',root,'rev-parse','HEAD']).toString().trim();
assert.equal(gitHead('F:/VisibleMedicine/website'),installedWebsite);assert.equal(gitHead('F:/VisibleMedicine/atlas'),installedAtlas);
assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-neck-landmark-xray-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'e6ce61bd91869161f44db09888aa2e9a8a50fe1d2e27f661b9dcf5fdc281c6cd');
assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const parentRepo='F:/VisibleMedicine/history/website-work/github-neck-landmark-xray-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
const prefix='pending/review-return-refresh-20261022/';
function add(from,to){const bytes=read(from);assert(/\.(?:mjs|js|jsx|tsx)$/.test(from));assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
add(website+'/components/ClinicalReviewInbox.tsx','website/components/ClinicalReviewInbox.tsx');
add(website+'/tests/clinical-review-inbox-auto-return.test.mjs','website/tests/clinical-review-inbox-auto-return.test.mjs');
add('F:/VisibleMedicine/staging/20261022-review-return-refresh-proposal/RAW/ClinicalReviewInbox.tsx','RAW/ClinicalReviewInbox.tsx');
for(const file of ['prepare-review-return-refresh-20261022.mjs','serve-review-return-refresh-20261022.mjs','checkpoint-review-return-refresh-20261022.mjs','qa-review-return-refresh-20261022/entry.jsx','qa-review-return-refresh-20261022/check-browser.js'])add(path.resolve(file),'coordination/'+file);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,row.path);
 for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);
 assert.equal(gitHead('F:/VisibleMedicine/website'),installedWebsite);assert.equal(gitHead('F:/VisibleMedicine/atlas'),installedAtlas);};
verifySource();
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-review-return-refresh-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
for(const file of ['components/ClinicalReviewInbox.tsx','tests/clinical-review-inbox-auto-return.test.mjs']){const to=directory+'/source/'+file;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(website+'/'+file,to);}
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-review-return-refresh-source-backup';
let saved,backupFailure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-review-return-refresh-20261022.git',branch:'backup/review-return-refresh-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{websiteReceiptSha256:sha(read(receipt)),review:source.review,installedWebsite,installedAtlas},
 scope:'Inherited filtered source plus isolated Review inbox return-refresh component, original preimage, additive real-component tests and synthetic QA/coordination source. Generated snapshots/pins/revision JSON, private records/accounts/DB/env/decisions/references, raw logs/media, scans/models/masks/held assets and canonical ancestry stay local. Not full/private/runnable recovery or installation.',
 proof:{focusedCounts:native.counts,fullTypesPassed:true,productionBuildPassed:true,reviewBindingUnchanged:true,sourceDrift:[],syntheticBrowserCases:browser.cases,
 signedInAcceptance:false,humanAssistiveTechnologyCertification:false,wholeSuitePassing:false,ownerPreviewChanged:false,clinicalApproval:false,publicDeployment:false}});}
catch(error){backupFailure={at:new Date().toISOString(),message:error.message,independentlyVerified:false,automaticRetry:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(backupFailure,null,2)+'\n',{flag:'wx'});}
verifySource();
const backupReceipt=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:backupReceipt,receiptSha256:sha(read(backupReceipt)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,
 restoredPaths:saved?.restoredPaths,independentlyVerified:Boolean(saved),wholePrivateOrRunnableBackup:false,...(backupFailure?{failure:backupFailure}:{})};
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Review queue read-only return refresh, atomic validated replacement, preserved manual Pause and owned focus recovery.',
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,website,review:source.review,sourceBackup,
 native:{path:nativePath,sha256:sha(read(nativePath)),counts:native.counts},quality:{path:qualityPath,sha256:sha(read(qualityPath))},
 browser:{path:browserPath,sha256:sha(read(browserPath)),cases:browser.cases,syntheticOnly:true,signedInAcceptance:false},
 full71AndEightIdeasPreserved:true,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 next:'Keep normal preview unchanged; this source6114/Review3ed is staged, not installed. Preserve the separate Atlas389 neck-Xray candidate and all71/eight roadmap. Continue coherent runtime/Review admission and source-backed learning/CT/MRI/existing3D work; no clinical-signoff stall, private upload, fee, public deployment, specialist-mask or desktopPACS edit.'};
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
assert.equal(current.sourceReceipt,'F:/VisibleMedicine/staging/20261022-linked-tour-dismiss-successor/READY_SOURCE.json');
assert.equal(current.pendingNeckLandmarkXray.head,'389bd0ca846a42c7f21055f55904bcf5df81a09f');
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),
 currentCandidate:website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourceBackup,
 reviewReturnRefresh:{state:'Verified in isolation; not installed',focusedCounts:native.counts,browser:result.browser,reviewBindingUnchanged:true},
 pendingWorkers:[],next:result.next,beforeFurtherWork:result.next});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:current.checkpointSha256,sourceBackup,counts:native.counts,previewChanged:false}));
