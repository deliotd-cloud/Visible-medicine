import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261023-nested-tour-library-pause';
const root='F:/VisibleMedicine/recovery/checkpoints/20261023-nested-tour-library-pause';
const site=stage+'/atlas',prep=json(stage+'/PREPARATION.json'),review=json(stage+'/SOURCE_REVIEW.json');
const currentPaths=[...review.assertions.map(r=>r.path),'scripts/test-nested-tour-library-pause.mjs'];
const sourceRows=currentPaths.map(p=>({path:p,bytes:read(site+'/'+p).length,sha256:sha(read(site+'/'+p))}));
const verify=()=>{
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),prep.head);
 assert.equal(runGit(['-C',site,'rev-parse','HEAD^{tree}']).toString().trim(),prep.tree);
 for(const r of sourceRows)assert.equal(sha(read(site+'/'+r.path)),r.sha256);
 for(const r of review.assertions){assert.equal(sha(read(site+'/'+r.path)),r.sourceSha256);assert.equal(sha(read(stage+'/preimage/'+r.path)),r.originalSha256);}
 assert.equal(runGit(['-C',prep.baseline,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.ownerPreviewPolicy.restartPermitted,false);
 runGit(['-C',site,'diff','--check']);
};
verify();
if(process.argv.includes('--finalize')){
 const before=json(root+'/CURRENT_BEFORE.json'),p=json('CURRENT_CHECKPOINT.json');
 for(const k of ['goal','safety','historyArchive'])assert.deepEqual(p[k],before[k]);
 assert.deepEqual(p.activeWork.current.ownerPreviewPolicy,before.activeWork.current.ownerPreviewPolicy);
 const docs=[['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']].map(([file,preimage])=>{
  const old=read(root+'/'+preimage),now=read(file),offset=now.indexOf(old);assert(offset>0);assert.equal(offset+old.length,now.length);
  return{file,sha256:sha(now),priorSha256:sha(old),addedPrefixBytes:offset,wholePriorPreserved:true};
 });
 const powershell='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
 const processes=JSON.parse(execFileSync(powershell,['-NoProfile','-NonInteractive','-Command',"@(Get-CimInstance Win32_Process -Filter 'ProcessId=164336 OR ProcessId=136616 OR ProcessId=240252'|Select-Object ProcessId,ParentProcessId,Name,CreationDate)|ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true})||'[]');
 const live=processes.length===3&&processes.every(r=>r.Name==='node.exe')&&processes.find(r=>r.ProcessId===136616)?.ParentProcessId===164336&&processes.find(r=>r.ProcessId===240252)?.ParentProcessId===136616;
 const stock=p.activeWork.current.completeReleaseRun,terminalExists=fs.existsSync(stock.evidence+'/TERMINAL.json');
 const receipt={at:new Date().toISOString(),checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),documents:docs,
  stockRun:{processes,live,terminalExists,wholeSuitePassing:false},previewChanged:false,installed:false,laterCoordinationCoveredByRemoteBackup:false};
 fs.writeFileSync(root+'/COORDINATION.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 p.activeWork.current.latestCoordination={receipt:root+'/COORDINATION.json',sha256:sha(read(root+'/COORDINATION.json'))};
 Object.assign(stock,{live,lastLiveObservation:{at:receipt.at,...receipt.stockRun}});p.activeWork.updated=receipt.at;
 const body=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(body)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',body);
 console.log(JSON.stringify({coordination:root+'/COORDINATION.json',sha256:sha(read(root+'/COORDINATION.json')),stockRunLive:live,stockTerminal:terminalExists,pointerBytes:Buffer.byteLength(body),previewChanged:false}));
}else{
 assert(!fs.existsSync(root));fs.mkdirSync(root);
 const initial=json('CURRENT_CHECKPOINT.json');assert.equal(initial.goal.status,'active');
 const worker=json(stage+'/worker-evidence/RESULT.json'),main=json(stage+'/main-evidence/RESULT.json');
 for(const row of [...worker.checks.filter(c=>c.log).map(c=>({...c,log:stage+'/worker-evidence/'+c.log})),...main.checks])assert.equal(sha(read(row.log)),row.sha256.toLowerCase());
 const mainReview={schema:'vm.nested-library-pause-main-review/1',at:new Date().toISOString(),atlas:site,baseline:prep.head,baselineTree:prep.tree,sourceRows,
  productScope:'Only the existing library pause counter wiring and two commit-bound consumers change. Two eyes, ventricular and cardiac catalog entries are exercised. No extra buttons or default timing changes. Prior component bytes restore exactly after the enumerated additions are removed.',
  sourceReview:{path:stage+'/SOURCE_REVIEW.json',sha256:sha(read(stage+'/SOURCE_REVIEW.json'))},
  evidence:{worker:stage+'/worker-evidence/RESULT.json',workerSha256:sha(read(stage+'/worker-evidence/RESULT.json')),main:stage+'/main-evidence/RESULT.json',mainSha256:sha(read(stage+'/main-evidence/RESULT.json'))},
  native:{newCurrent:1,existingLibraryPause:1,existingEyeAssertions:506,existingVentricularAssertions:201,existingSpeedCheck:true,expectedBaselineFailures:4,countsAreNotFullSuiteTotals:true},
  mainStrengthening:main.mainStrengthening,
  diagnostics:[main.sourceAuditDiagnostic,{chunk:'156bed',exitCode:1,reason:'Independent inverse checker trimmed the first porcelain status prefix and misread app as pp; changed trim to trimEnd and enabled all untracked files. All component-byte inverse assertions had already passed. No product change needed.'}],
  pending:['Source-only sparse checkout lacks binaries. Root renderer review metadata/fingerprints must be regenerated from the final coherent source; the inherited generated manifest remains baseline, not current rendering acceptance.','Matching runtime/Review viewer generation and Website import/rebinding.','Full types/build/release and actual browser/GPU checks.','Owner cutover hold remains; no installation or tab refresh.'],
  newAssetsDependenciesLicences:false,clinicalApproval:false,patientSpaceRegistration:false,wholeSuitePassing:false,previewChanged:false,installed:false};
 fs.writeFileSync(stage+'/MAIN_REVIEW.json',JSON.stringify(mainReview,null,2)+'\n',{flag:'wx'});
 const copies=[['CURRENT_CHECKPOINT.json','CURRENT_BEFORE.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md'],
  [stage+'/MAIN_REVIEW.json','MAIN_REVIEW.json'],[stage+'/SOURCE_REVIEW.json','SOURCE_REVIEW.json'],[stage+'/PREPARATION.json','PREPARATION.json'],[stage+'/PREPARATION_FAILURE.json','PREPARATION_FAILURE.json'],
  ...sourceRows.map(r=>[site+'/'+r.path,'source/'+r.path]),...prep.originals.map(r=>[stage+'/preimage/'+r.path,'preimage/'+r.path])];
 for(const folder of ['worker-evidence','main-evidence'])for(const f of fs.readdirSync(stage+'/'+folder,{withFileTypes:true}))if(f.isFile())copies.push([stage+'/'+folder+'/'+f.name,folder+'/'+f.name]);
 for(const [from,to]of copies){fs.mkdirSync(path.dirname(root+'/'+to),{recursive:true});fs.copyFileSync(from,root+'/'+to,fs.constants.COPYFILE_EXCL);}
 const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261023-atlas-review-source-composition-source-backup/github-backup.json';
 assert.equal(sha(read(parentPath)),'4690714707f4e2887f19b17c22e3e85fbdcd8eeb9d83c6ecf0cf67fb874fec4a');
 const parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-atlas-review-source-composition-20261023.git';assert(parent.sourceBackupVerified&&parent.strictIntegrity);
 const inherited=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
 const selected=new Map(inherited.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));
 const additions=[...sourceRows.map(r=>['current/'+r.path,root+'/source/'+r.path]),...prep.originals.map(r=>['preimage/'+r.path,root+'/preimage/'+r.path]),
  ...['prepare-nested-tour-library-pause-20261023.mjs','verify-nested-tour-library-pause-20261023.mjs','review-nested-tour-library-pause-source-20261023.mjs','checkpoint-nested-tour-library-pause-20261023.mjs'].map(p=>['coordination/'+p,path.resolve(p)])];
 for(const [name,from]of additions){const key='pending/nested-tour-library-pause-20261023/'+name;assert(!selected.has(key));const to=root+'/backup-source/'+name;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);selected.set(key,to);}
 const files=[...selected].map(([name,from])=>({path:name,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
 const verifySource=()=>{verify();for(const r of files)assert.equal(sha(read(selected.get(r.path))),r.sha256);const p=json('CURRENT_CHECKPOINT.json');for(const k of ['goal','safety','historyArchive'])assert.deepEqual(p[k],initial[k]);assert.deepEqual(p.activeWork.current.ownerPreviewPolicy,initial.activeWork.current.ownerPreviewPolicy);assert.equal(sha(read(initial.activeWork.current.sourceReceipt)),initial.activeWork.current.sourceReceiptSha256);};
 const backupRoot=root+'-source-backup';let saved;
 try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-nested-tour-library-pause-20261023.git',branch:'backup/nested-tour-library-pause-20261023',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:name=>read(selected.get(name)),verifySource,
  sourceIdentity:{baseline:prep.head,baselineTree:prep.tree,sourceRows},
  scope:'Inherited independently verified filtered source plus four source-only nested-tour-library pause/test files, exact three-component preimages and four task utility sources. No canonical Git ancestry, geometry, models, private/review/generated metadata, scans, masks, raw logs, decisions, process records or runtime binaries. Local sparse candidate has no model binaries and is not an admitted, installed, runnable or public delivery. Root renderer metadata, full types/build/browser/export/import/rebinding are pending. No approvals, registration, permissions, asset/dependency additions or fees. Selected source recovery is not full/private/runnable backup.',
  proof:{sourceReviewSha256:mainReview.sourceReview.sha256,native:mainReview.native,allPreExistingComponentBytesPreserved:true,previewChanged:false,installed:false,clinicalApproval:false,wholeSuitePassing:false,fullTypesBuildBrowserPending:true}});
 }catch(error){fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify({at:new Date().toISOString(),message:error.message,independentlyVerified:false},null,2)+'\n',{flag:'wx'});}
 verifySource();const receipt=backupRoot+(saved?'/github-backup.json':'/backup-failure.json'),sourceBackup={receipt,receiptSha256:sha(read(receipt)),independentlyVerified:!!saved,head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,wholePrivateOrRunnableBackup:false};
 const checkpoint={at:new Date().toISOString(),milestone:'Nested eye/ventricular/cardiac tours pause on library interaction without losing current stop/rate; no automatic resume',atlas:site,baseline:prep.head,baselineTree:prep.tree,sourceRows,mainReview:stage+'/MAIN_REVIEW.json',mainReviewSha256:sha(read(stage+'/MAIN_REVIEW.json')),native:mainReview.native,sourceBackup,pending:mainReview.pending,previewChanged:false,installed:false,wholeSuitePassing:false,clinicalApproval:false,patientSpaceRegistration:false,full71AndEightIdeasPreserved:true};
 fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});
 const p=json('CURRENT_CHECKPOINT.json');p.activeWork.current.pendingNestedTourLibraryPause={checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),atlas:site,baseline:prep.head,sourceRows,native:mainReview.native,fullTypesBuildBrowserRuntimeRebindingPending:true,rootRendererMetadataPending:true,previewChanged:false,installed:false,sourceBackup};p.activeWork.updated=checkpoint.at;
 const body=JSON.stringify(p,null,2)+'\n';assert(Buffer.byteLength(body)<65536);fs.writeFileSync('CURRENT_CHECKPOINT.json',body);
 console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),mainReviewSha256:checkpoint.mainReviewSha256,sourceBackup,previewChanged:false}));
}
