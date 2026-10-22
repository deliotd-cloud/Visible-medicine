import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-successor',receipt=root+'/SOURCE.json',source=json(receipt);
assert.equal(sha(read(receipt)),'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed');
assert.equal(source.sourcePaths,6182);assert.equal(source.review,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');
const nativePath=root+'/native-integration/TERMINAL.json',native=json(nativePath),admissionPath=root+'/admission/TERMINAL.json',admission=json(admissionPath);
assert.equal(native.code,0);assert.deepEqual(native.counts,{tests:125,pass:125,fail:0,cancelled:0,skipped:0,todo:0});assert.deepEqual(native.sourceDrift,[]);
assert.equal(admission.code,1);assert.match(admission.failure,/tests\/head-overlay-loading\.test\.ts/);assert.equal(admission.commands.length,8);assert(admission.commands.every(r=>r.code===0));
const planCorrectionPath=root+'/NATIVE_PLAN_CORRECTION.json';assert(json(planCorrectionPath).allEightStockProducerQualityTypesAndBuildCommandsPassed);
const browserPath=root+'/BROWSER_OBSERVED.json',browser=json(browserPath);assert(browser.allPassed&&browser.cases.length===6&&browser.ownedTabClosed&&browser.ownedServerStopped);assert.equal(browser.sourceReceiptSha256,sha(read(receipt)));
const proposal='F:/VisibleMedicine/staging/20261022-head-surface-cancellation-proposal',negativePath=proposal+'/BASELINE_CONTROL/baseline-control.log';
assert.equal(sha(read(negativePath)),'c2a02076187e41607f534974a78187a850c57ce7c0cbecc9ab3f9e8e6edbf189');assert(read(negativePath).toString().includes('Missing expected rejection (AbortError)'));
const predecessor=json(source.previousSource);
function verify(){
 for(const r of source.sourceRows)assert.equal(sha(read(source.website+'/'+r.path)),r.sha256,r.path);
 for(const r of predecessor.sourceRows)assert.equal(sha(read(predecessor.website+'/'+r.path)),r.sha256,'Predecessor: '+r.path);
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(sha(read(source.website+'/docs/completion-checklist.json')),predecessor.sourceRows.find(r=>r.path==='docs/completion-checklist.json').sha256);
}verify();
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-head-surface-cancellation-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
const productPaths=['lib/head-atlas-import.ts','lib/head-surface-validation.ts','scripts/bind-clinical-review.mjs','tests/head-surface-validation.test.ts','tests/head-entry-surface-cancellation.test.ts','tests/head-surface-review-binding.test.mjs','tests/current-atlas-delivery.test.mjs'];
for(const p of productPaths){const to=directory+'/source/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(source.website+'/'+p,to);}
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-head-modality-3d-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'c2cd6a40f6dc6b066cad2007c64ae4a1288457de801280e0de57c537e6ad0990');assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const parentRepo='F:/VisibleMedicine/history/website-work/github-head-modality-3d-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));for(const r of manifest.files)assert.equal(sha(read(selected.get(r.path))),r.sha256);
const prefix='pending/head-surface-cancellation-20261022/';
function add(from,to){const bytes=read(from);assert(/\.(?:mjs|ts|tsx|js|jsx|html)$/.test(from));assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
for(const p of productPaths)add(source.website+'/'+p,'website/'+p);
for(const p of ['lib/head-atlas-import.ts','scripts/bind-clinical-review.mjs','tests/current-atlas-delivery.test.mjs'])add(predecessor.website+'/'+p,'RAW/'+p);
add(proposal+'/BASELINE_CONTROL/tests/head-entry-surface-cancellation.test.ts','RAW/negative-control-entry-test.ts');
for(const p of ['prepare-head-surface-cancellation-20261022.mjs','admit-head-surface-cancellation-20261022.mjs','finish-head-surface-native-plan-20261022.mjs','serve-head-surface-cancellation-20261022.mjs','checkpoint-head-surface-cancellation-20261022.mjs','qa-head-surface-cancellation-20261022.html'])add(path.resolve(p),'coordination/'+p);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const r of files)assert.equal(sha(read(selected.get(r.path))),r.sha256,r.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-head-surface-cancellation-source-backup';let saved,backupFailure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-head-surface-cancellation-20261022.git',branch:'backup/head-surface-cancellation-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,
 files,bytesFor:p=>read(selected.get(p)),verifySource,sourceIdentity:{websiteReceiptSha256:sha(read(receipt)),atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review},
 scope:'Inherited filtered source plus staged cooperative native head surface validation, additive tests, exact code/test preimages and synthetic QA/coordination source. Generated pins/bindings/coverage, compiled runtime/viewer assets, private records/accounts/DB/env/decisions/references, held source/assets, scans/models/masks and raw logs/media remain local. Not full/private/runnable recovery, installation or deployment.',
 proof:{focusedCounts:native.counts,negativeControl:{oldImporterTests:3,pass:2,expectedFail:1},fullTypesPassed:true,productionBuildPassed:true,stockReviewModelsPolicyCatalogPassed:true,
 browserCases:6,syntheticOnly:true,wholeSuitePassing:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});}
catch(error){backupFailure={at:new Date().toISOString(),message:error.message,independentlyVerified:false,automaticRetry:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(backupFailure,null,2)+'\n',{flag:'wx'});}
verifySource();const savedPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:savedPath,receiptSha256:sha(read(savedPath)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,independentlyVerified:Boolean(saved),wholePrivateOrRunnableBackup:false,...(backupFailure?{failure:backupFailure}:{})};
const next='Keep normal preview unchanged. Selected website6182/Atlas389/Review811b is staged only. Continue the full71/eight roadmap: source-backed learning and existing3D/CT/MRI integration, remaining exact-source consumer assurance, real signed-in/native scan acceptance when permitted. No clinical-signoff stall, invented registration/release approval, private upload, deployment, fee or desktopPACS edit.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Large verified CT/MRI head surface validation yields between bounded batches and honours cancellation without copying or transforming native buffers.',
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,website:source.website,atlas:source.atlasHead,review:source.review,boundInputs:1727,importedSources:1560,viewerFiles:46,viewerPackages:22,
 native:{path:nativePath,sha256:sha(read(nativePath)),counts:native.counts},admission:{path:admissionPath,sha256:sha(read(admissionPath)),allEightCommandsPassed:true,finalPlanPathMistakePreserved:true},planCorrection:{path:planCorrectionPath,sha256:sha(read(planCorrectionPath)),noProductOrExistingTestChanged:true},
 browser:{path:browserPath,sha256:sha(read(browserPath)),cases:6,syntheticOnly:true},negativeControl:{path:negativePath,sha256:sha(read(negativePath)),tests:3,pass:2,expectedFail:1},sourceBackup,
 sourceGatesAndOtherOriginalImporterBytesPreserved:true,geometryMasksModelsDependenciesFontsLicencesAccessUnchanged:true,originalDeliveryTestOnlyBoundCountChanged:true,all71AndEightIdeasPreserved:true,
 noNewAssetOrDependency:true,canonicalInstalled:false,ownerPreviewChanged:false,nativeScanModelAcceptance:false,clinicalApproval:false,spatialRegistration:false,wholeSuitePassing:false,publicDeployment:false,next};
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.sourceReceipt,source.previousSource);assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),currentCandidate:source.website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,isolatedReview:source.review,sourceBackup,
 surfaceCancellation:{state:'Verified in isolation; not installed',native:result.native,admission:result.admission,browser:result.browser,negativeControl:result.negativeControl},pendingWorkers:[],next,beforeFurtherWork:next});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:current.checkpointSha256,sourceBackup,sourcePaths:source.sourcePaths,previewChanged:false}));
