// Main-only source recovery. No application install, restart or deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {json,read,sha,runGit} from './source-only-backup-20261019.mjs';
import {saveProposal,finalizeProposal} from './source-proposal-checkpoint.mjs';
const stage='F:/VisibleMedicine/staging/20261023-release-epoch-successor',site=stage+'/website';
const source=json(stage+'/SOURCE.json'),composition=json(stage+'/COMPOSED.json'),result=json(stage+'/VERIFICATION.json');
assert.equal(sha(read(stage+'/VERIFICATION.json')),'e74ddc685ed1db9b799656243a7b7a9ba6561eafb0b7cfa642fa33104c866ccb');
assert.equal(sha(read(stage+'/SOURCE.json')),'0dd282c43570998f10d8497fd32f6bcca12ea122f81aec8efd8cdc06379a1512');
const selected=new Set([...composition.overlays.map(r=>r.path),...composition.inverses.map(r=>r.original),'tests/release-epoch-composition-preservation.test.mjs']);
const rows=source.sourceRows.filter(r=>selected.has(r.path));assert.equal(rows.length,43);
const slab=Buffer.alloc(65536);const hash=file=>{const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const verify=()=>{
 assert.equal(sha(read(stage+'/SOURCE.json')),result.sourceSha256);
 assert.equal(sha(read(composition.terminal)),composition.terminalSha256);
 const terminal=json(composition.terminal);assert.equal(terminal.code,1);assert.deepEqual(terminal.counts,{tests:6044,pass:5934,fail:107,cancelled:0,skipped:3,todo:0});
 assert.equal(sha(read(terminal.stockReceipt)),terminal.stockReceiptSha256);
 assert.equal(sha(read(result.terminalClassificationReview)),result.terminalClassificationReviewSha256);
 assert.deepEqual(result.nativeSourceProof.counts,{tests:14,pass:14,fail:0,cancelled:0,skipped:0,todo:0});
 assert.equal(sha(read(result.nativeSourceProof.log)),result.nativeSourceProof.logSha256);
 const previous=json(source.previousSource),old=new Map(previous.sourceRows.map(r=>[r.path,r.sha256]));
 for(const r of source.sourceRows){assert.equal(hash(site+'/'+r.path),r.sha256,r.path);if(!r.path.startsWith('tests/'))assert.equal(r.sha256,old.get(r.path));}
 for(const r of previous.sourceRows)assert.equal(hash(previous.website+'/'+r.path),r.sha256,'Frozen predecessor: '+r.path);
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);
 assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
};
const classification=json(result.terminalClassificationReview);
const review={at:new Date().toISOString(),schema:'vm.release-epoch-successor-main-review/1',sourceReceipt:stage+'/SOURCE.json',sourceReceiptSha256:result.sourceSha256,sourcePaths:6457,atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,
 changedOriginalPaths:source.changedPaths,addedPaths:source.addedPaths,rows,
 change:'Compose four already-reviewed proposal groups: arterial current-role inverse, authentic ae84 metadata closure and keyboard historical role, renal-tour/shared admission and exact display-pin history, and loader inverse composition. Twelve original test/helper sources change;31 test/source-witness inputs are added. No production, model, runtime, Review or dependency byte changes.',
 proof:{completeOriginalSourceInverses:12,nativeSourcePreservation:result.nativeSourceProof.counts,heapMiB:128,fullCandidateAndPredecessorSourceDrift:[],productionAndBindingBytesUnchanged:true,classificationEventsIndependentlyMatched:110,topLevelResults:6037,nestedPasses:7},
 failedStockGate:{terminal:composition.terminal,terminalSha256:composition.terminalSha256,counts:classification.nativeCounts,threeSymlinkPrivilegeSkipsRemainCoverageLimits:true,passingClaim:false},
 verification:stage+'/VERIFICATION.json',verificationSha256:sha(read(stage+'/VERIFICATION.json')),
 terminalClassificationReview:result.terminalClassificationReview,terminalClassificationReviewSha256:result.terminalClassificationReviewSha256,
 scope:'Fourteen small pure source/text-preservation checks execute against the joint candidate, not browser/rendered component, mesh, complete original feature or whole-release acceptance. The107 original failures remain recorded and unresolved until relevant cases actually run; overlap with a repair is not a passing result. The original full stock source is terminal/failed, not live or restarted.',
 pending:'Verify all eight affected original feature roots after actual memory recovery, then advance the remaining classified source/current-binding gates. Preserve all historical/refusal assertions and three Windows skip limitations. Build/types/browser, runtime-bound Atlas/Review UI and teaching successors, and the whole71/eight roadmap remain separate and active. Never install/restart/refresh the held preview or wait on clinical sign-off to advance independent safe work.',
 resourceObservation:result.nativeSourceProof.observation,fullAffectedFeatureRootsPending:8,fullTypesBuildBrowserPending:true,ownerPreviewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
const authored=rows.filter(r=>!r.path.startsWith('tests/fixtures/ae84-review/'));assert.equal(authored.length,40);
const utilities=['compose-release-epoch-successor-20261023.mjs','verify-release-epoch-successor-20261023.mjs','checkpoint-release-epoch-successor-20261023.mjs'];
const artifacts=['SOURCE.json','COMPOSED.json','VERIFICATION.json','SOURCE_PROOF.json','source-preservation.tap','TERMINAL_CLASSIFICATION_REVIEW.json'].map(p=>[stage+'/'+p,p]);
artifacts.push([composition.terminal,'original-stock-TERMINAL.json'],[json(composition.terminal).stockReceipt,'original-stock-receipt.json']);
for(const name of ['CLASSIFICATION.json','SUMMARY.md'])artifacts.push(['F:/VisibleMedicine/staging/20261023-release-terminal-classification/'+name,'terminal-classification/'+name]);
const config={id:'release-epoch-successor-20261023',root:'F:/VisibleMedicine/recovery/checkpoints/20261023-release-epoch-successor',stage,site,key:'pendingReleaseEpochSuccessor',rows,verify,review,localArtifacts:artifacts,
 remoteArtifacts:[...authored.map(r=>['current/'+r.path,site+'/'+r.path]),...utilities.map(p=>['coordination/'+p,path.resolve(p)])],
 parent:{receipt:'F:/VisibleMedicine/recovery/checkpoints/20261023-loader-preservation-source-backup/github-backup.json',receiptSha256:'b9b62851d0732443bae0cd31cf10791be125b066fd1a312f4372bcc659e8c84e',repo:'F:/VisibleMedicine/history/website-work/github-loader-preservation-20261023.git'},
 backupRepo:'F:/VisibleMedicine/history/website-work/github-release-epoch-successor-20261023.git',sourceIdentity:{frozenSourceReceiptSha256:source.previousSourceSha256,successorSourceReceiptSha256:result.sourceSha256,authoredSource:authored},
 backupScope:'Inherited verified filtered source plus40explicit authored test/helper/source-witness texts for the joint successor and3main coordination utility sources. The three authentic generated ae84 metadata fixtures remain F-only, as do full source manifests, stock/classification/native logs and process/resource records. No scans/masks/identifiers, private decisions/references, generated anatomy/Review/runtime data, model/media binaries, credentials or canonical Git ancestry. Fourteen small source-preservation cases pass on the6457-path isolated candidate, whose production/binding bytes remain unchanged; not complete affected-feature, build/browser/full-release/clinical/spatial acceptance. Source-only partial recovery, not whole/private/runnable backup. Normal preview is held unchanged.',
 proof:review.proof,milestone:'Failed full gate reconciled; four reviewed test proposals consolidated into6457-path successor with14passing pure source checks',pending:review.pending,
 summary:{candidate:site,sourceReceipt:stage+'/SOURCE.json',sourceReceiptSha256:result.sourceSha256,sourcePathsTotal:6457,changedOriginalPaths:12,addedPaths:31,wholeOriginalInverses:12,nativeSourcePreservation:14,fullAffectedFeatureRootsPending:8,fullTypesBuildBrowserPending:true,allProductAndBindingsByteIdentical:true},
 coordinationUpdate:{state:'idle/completed; terminal classification independently matched by main, no active assignment',cursor:'09786c67-a526-4f3e-9592-4f73d6c47d39:19',pendingAssignment:{state:'completed; all110failure/skip lines and totals independently verified',result:'F:/VisibleMedicine/staging/20261023-release-terminal-classification/CLASSIFICATION.json',resultSha256:'02be716ed366985eff1e6dcd61a2bda65bdde908bf7c89c9107145818cfeb74b',mainReview:result.terminalClassificationReview,mainReviewSha256:result.terminalClassificationReviewSha256,mainReviewPending:false}}};
if(process.argv.includes('--finalize')){
 const output=finalizeProposal(config),p=json('CURRENT_CHECKPOINT.json');
 const next='The6426-path stock gate is terminal/failed:6044native cases,5934pass/107fail/3host symlink skips, no source drift. All110failure/skip lines and nested accounting are main-verified. The separate6457-path test-only successor composes12source repairs and31test/witness additions;14pure text/hash checks pass, not original-feature/full-release acceptance. All production/runtime/Review bytes and installedb953/6d7/ae84 remain unchanged. Retry eight affected original feature roots only after actual memory recovery; continue remaining classified source-role gates and queued runtime-bound UI/teaching work safely. Full71/eight goal and owner no-install/restart/refresh hold, privacy/access/source/specialist/PACS gates remain. Do not restart the old gate or claim107resolved defects.';
 p.next=next;p.activeWork.current.next=next;p.activeWork.current.beforeFurtherWork=next;p.activeWork.updated=new Date().toISOString();
 const text=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(text)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',text);console.log(JSON.stringify({...output,pointerBytes:Buffer.byteLength(text)}));
}else console.log(JSON.stringify(saveProposal(config)));
