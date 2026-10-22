// Final bounded quality checkpoint. No install, model export, public deploy or data upload.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-review-queue-accessibility-successor',sourcePath=root+'/SOURCE.json',source=json(sourcePath);
assert.equal(sha(read(sourcePath)),'c70dfa42798aba75ae16e37d8bb9c96765bc71ff00642db65c4c0814fc86c6b0');
const qualityPath=root+'/quality-build/TERMINAL.json',quality=json(qualityPath);
assert.equal(quality.code,0);assert.equal(quality.allGatesPassed,true);assert.deepEqual(quality.sourceDrift,[]);
assert.deepEqual(quality.results.map(r=>r.label),['review','models','delivery','lectures','website']);
for(const result of quality.results){assert.equal(result.code,0);for(const stream of ['stdout','stderr'])assert.equal(sha(read(root+'/quality-build/'+result.label+'.'+stream+'.log')),result[stream+'Sha256']);}
const specimenPath=root+'/browser-specimen-route-corrected/INPUTS.json',specimen=json(specimenPath);
assert.equal(specimen.sourceReceiptSha256,sha(read(sourcePath)));
for(const row of specimen.inputs)assert.equal(sha(read(row.path)),row.sha256,row.path);
// Observed via supported CUA on owned tab135, then closed; never infer signed-in/AT certification.
const browser={at:new Date().toISOString(),browser:'Codex In-app Browser',tabId:'135',scope:'Exact component/CSS and real React, synthetic records only',viewport:{width:1280,height:720},
 allLoadedStatuses:{rows:10,sameRowDescriptionResolution:true,uniqueDescriptionIds:true,horizontalOverflow:false},
 search:{query:'Synthetic correction',resultRows:1},keyboard:{activeName:'Synthetic correction, Anatomy worksheet (opens in a new tab)',outlineStyle:'solid',outlineWidth:'3px'},
 reset:{rows:8,search:'',status:'needing-review',focusedSearch:true,descriptionIdsStable:true},consoleIssues:[],screenshotVisuallyInspected:true,
 firstSpecimen:{path:root+'/browser-specimen',route:'/',filtersInactive:true,cause:'Actual component correctly rejects filter actions outside its expected route; fixture corrected, product source and guards unchanged'},
 ownedTabClosed:true,ownedServerStopped:true,ownerPreviewListenerObserved:297128,ownerPreviewPort:3000,ownerPreviewChanged:false,
 screenReaderCertification:false,signedInWorkflowTested:false,canonicalInstalled:false};
const browserPath=root+'/browser-specimen-route-corrected/BROWSER_RESULT.json';assert(!fs.existsSync(browserPath));fs.writeFileSync(browserPath,JSON.stringify(browser,null,2)+'\n',{flag:'wx'});
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-a11y-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'f8609a8078d3771d86806396342d84eb81dcab249279f11ea6b69cf176abe34e');assert(parent.sourceBackupVerified&&parent.strictIntegrity&&!parent.privateDataBackup);
const parentRepo='F:/VisibleMedicine/history/website-work/github-review-queue-a11y-20261022.git',manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(row=>[row.path,path.dirname(parentPath)+'/remote-source-restored/'+row.path]));
for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);
for(const [from,to] of [
 ['build-review-queue-accessibility-20261022.mjs','build.mjs'],
 ['serve-review-queue-accessibility-20261022.mjs','serve-synthetic-qa.mjs'],
 ['qa-review-queue-accessibility-20261022/entry.jsx','synthetic-entry.jsx'],
 [root+'/browser-specimen/SERVER.before-route-correction.mjs','serve-before-route-correction.mjs'],
 ['checkpoint-review-queue-quality-20261022.mjs','checkpoint.mjs']]){
 const bytes=read(from);assert.deepEqual(Buffer.from(bytes.toString('utf8')),bytes);const relative='pending/review-queue-quality-20261022/'+to;assert(!selected.has(relative));selected.set(relative,path.resolve(from));
}
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
const saved=backup({root:'F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-quality-source-backup',repo:'F:/VisibleMedicine/history/website-work/github-review-queue-quality-20261022.git',branch:'backup/review-queue-quality-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:relative=>read(selected.get(relative)),verifySource,
 sourceIdentity:{installedWebsite:'b953ff3f5f1891599cb6e91cb91311d9d6006270',atlas:'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1',isolatedReview:source.review},
 scope:'Inherited filtered sources, exact queue change and preserved regression repairs, plus five owned local build/QA/checkpoint sources. All synthetic records are explicitly fictitious. Generated bindings/fixtures/logs/media, scans/models/masks, held assets, private records/DB/env/decisions/references and canonical ancestry remain local. Not whole/private/runnable recovery or installation.',
 proof:{sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,inboxTests:{tests:74,pass:74,fail:0},fullTypeScriptPassed:true,stockGatesAndProductionBuildPassed:true,
 syntheticDesktopDomAndKeyboardChecksPassed:true,signedInWorkflowTested:false,screenReaderCertification:false,normalPreviewUnchanged:true,paneLabelProposalUnapplied:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;assert.equal(current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const backupPath='F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-quality-source-backup/github-backup.json';
const sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:saved.head,tree:saved.tree,sourcePaths:saved.sourcePaths,restoredPaths:saved.restoredPaths,independentlyVerified:true,wholePrivateOrRunnableBackup:false};
const next='Keep the normal preview unchanged. Queue-only successor is source/native/type/build verified with bounded synthetic desktop checks, not installed or signed-in/AT certified. Continue full71/eight roadmap priorities. Separate HeadAtlasViewer pane-label proposal remains unapplied and must use a real Review rebind in a coherent viewer batch. Retain360/358/2 original wide result and13/13 retry separately; no whole-suite/clinical/spatial/public acceptance. Do not ask again for restart absent a new owner instruction.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),sourcePaths:source.sourcePaths,review:source.review,
 quality:{path:qualityPath,sha256:sha(read(qualityPath))},browser:{path:browserPath,sha256:sha(read(browserPath)),scope:browser.scope,signedInWorkflowTested:false,screenReaderCertification:false},
 previousCheckpoint:current.checkpoint,previousCheckpointSha256:current.checkpointSha256,sourceBackup,queueWebsiteBuildPending:false,ownerPreviewChanged:false,canonicalInstalled:false,
 paneLabelProposalUnapplied:true,full71AndEightIdeasPreserved:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-review-queue-quality-verified';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
Object.assign(current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),sourceBackup,queueWebsiteBuildPending:false,queueQuality:result.quality,queueBrowser:result.browser,next,beforeFurtherWork:next,activeExecutionSessions:{}});
pointer.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:current.checkpointSha256,sourceBackup,sourcePaths:source.sourcePaths,ownerPreviewChanged:false,canonicalInstalled:false}));
