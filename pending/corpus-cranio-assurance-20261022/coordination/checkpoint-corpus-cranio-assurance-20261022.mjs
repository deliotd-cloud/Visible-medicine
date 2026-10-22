// Test-only successor and source-only recovery; never a normal-preview cutover.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-corpus-cranio-assurance',receipt=stage+'/SOURCE.json',source=json(receipt),previous=json(source.previousSource);
const terminalPath=stage+'/native/TERMINAL.json',terminal=json(terminalPath),probePath='F:/VisibleMedicine/staging/20261022-remaining-native-recheck/TERMINAL.json',probe=json(probePath);
assert.equal(terminal.code,0);assert.equal(terminal.commands[0].code,0);assert.equal(terminal.commands[1].code,0);
assert.deepEqual(terminal.commands[1].counts,{tests:51,pass:51,fail:0,cancelled:0,skipped:0,todo:0});assert.deepEqual(terminal.sourceDrift,[]);assert.deepEqual(terminal.previousSourceDrift,[]);
assert.equal(probe.code,1);assert.deepEqual(probe.counts,{tests:65,pass:40,fail:25,cancelled:0,skipped:0,todo:0});assert.deepEqual(probe.sourceDrift,[]);
assert.equal(source.allProductAndBindingsByteIdentical,true);assert(source.changedPaths.every(p=>p.startsWith('tests/')));assert(source.addedPaths.every(p=>p.startsWith('tests/')));
const pointer=json('CURRENT_CHECKPOINT.json'),goalHash=sha(Buffer.from(JSON.stringify(pointer.goal)));
assert.equal(pointer.goal.status,'active');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const verify=()=>{
 for(const s of [source,previous])for(const row of s.sourceRows)assert.equal(sha(read(s.website+'/'+row.path)),row.sha256,row.path);
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/manifest.json').websiteIntegrationSha256,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
 const listener=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object LocalAddress,OwningProcess | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
 assert.deepEqual(listener,{LocalAddress:'127.0.0.1',OwningProcess:297128});assert.equal(sha(Buffer.from(JSON.stringify(json('CURRENT_CHECKPOINT.json').goal))),goalHash);
};verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-corpus-cranio-assurance-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const[from,to]of [['CURRENT_CHECKPOINT.json','pointer.before.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']])fs.copyFileSync(from,root+'/'+to,fs.constants.COPYFILE_EXCL);
const witnesses=[receipt,terminalPath,probePath,'F:/VisibleMedicine/staging/20261022-corpus-cranio-release-roles/RESULT.json',
 'F:/VisibleMedicine/staging/20261022-checklist-installed-reconciliation/RESULT.json'];
for(const[from,i]of witnesses.map((p,i)=>[p,i]))fs.copyFileSync(from,root+'/'+i+'-'+path.basename(from),fs.constants.COPYFILE_EXCL);
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-checklist-reconciliation-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'e9d90fc02fcc3a50b04285898eed47fcef03e09d6810ed3a6620bfac98c375f0');
const parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-checklist-reconciliation-20261022.git';assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
const add=(from,to)=>{assert(/\.(mjs|raw)$/.test(from)&&!from.endsWith('.json.raw'));const target='pending/corpus-cranio-assurance-20261022/'+to;assert(!selected.has(target));selected.set(target,from);const dest=root+'/source/'+to;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(from,dest,fs.constants.COPYFILE_EXCL);};
for(const p of [...source.changedPaths,...source.addedPaths])add(source.website+'/'+p,'website/'+p);
add('F:/VisibleMedicine/staging/20261022-corpus-cranio-release-roles/source-only-proof.mjs','worker-source-only-proof.mjs');
for(const p of ['probe-remaining-native-20261022.mjs','prepare-corpus-cranio-assurance-20261022.mjs','verify-corpus-cranio-assurance-20261022.mjs','checkpoint-corpus-cranio-assurance-20261022.mjs','finalize-checklist-reconciliation-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
const files=[...selected].map(([p,from])=>({path:p,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-corpus-cranio-assurance-source-backup';let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-corpus-cranio-assurance-20261022.git',branch:'backup/corpus-cranio-assurance-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{atlas:source.atlasHead,tree:source.atlasTree,review:source.review,sourceReceiptSha256:sha(read(receipt))},
 scope:'Inherited filtered practice/checklist source plus two bounded release-test current-source repairs, exact original test witnesses, whole-source preservation/mutation test and coordinator scripts. All product/runtime/binding bytes unchanged. Actual tracking/evidence/generated JSON, binary runtime, private records/DB/env/decisions/references, held assets, scans/models/masks, fonts and logs remain local. Source-only, not whole/private/runnable recovery, installation or deployment.',
 proof:{focusedNative:terminal.commands[1].counts,priorRemainingRootRun:probe.counts,priorRemainingRunStillFailed:true,productAndBindingsUnchanged:true,
  typesAndBuildNotRerun:true,realBrowserNotRerun:true,canonicalInstalled:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});
}catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();const savedPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:savedPath,receiptSha256:sha(read(savedPath)),independentlyVerified:!!saved,head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,wholePrivateOrRunnableBackup:false,...(failure?{failure}:{})};
const next='Keep the owner preview unchanged. Selected6378 is a test-only successor of6375, with identical Atlas2381/Review1a48, all product/runtime/binding bytes and existing practice feature. Actual four-root51/51 checks cover corpus X-ray and craniofacial CT emitted teaching/protected Review plus exact original/current-source refusal witnesses. Prior20-root65/40/25 diagnostic remains failed and is not overwritten or arithmetically declared green. Next repair two zero-registration historical admission roots using complete authenticated binder/pin inverses, then remaining UI/source-role failures and tongue-palate emitted teaching. Preserve all71/eight scope, independent access/privacy/specialist masks/desktopPACS boundaries; no clinical-signoff stall, normal restart/install/refresh or repeated restart question.';
const cp={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Two current-source release regression roots repaired while all original teaching/history/refusal checks and all product bytes remain unchanged.',
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,
 boundInputs:source.boundInputs,importedSources:source.importedSources,focusedNative:terminal.commands[1].counts,verification:terminalPath,verificationSha256:sha(read(terminalPath)),
 broadDiagnostic:{path:probePath,sha256:sha(read(probePath)),counts:probe.counts,passing:false,notAFullSuite:true},sourceBackup,
 allProductAndBindingsByteIdentical:true,priorProductTypesAndBuildEvidenceReusedOnlyForExactUnchangedProduct:true,newTypesBuildOrBrowserAcceptance:false,
 canonicalInstalled:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(cp,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');Object.assign(latest.activeWork.current,{at:cp.at,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),
 currentCandidate:source.website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,sourceBackup,
 corpusCranioAssurance:cp,remainingNativeRecheck:cp.broadDiagnostic,next,beforeFurtherWork:next,activeExecutionSessions:[],pendingWorkers:[],full71AndEightIdeasPreserved:true,wholeSuitePassing:false});
latest.activeWork.updated=cp.at;assert.equal(sha(Buffer.from(JSON.stringify(latest.goal))),goalHash);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),focusedNative:cp.focusedNative,sourceBackup,ownerPreviewChanged:false}));
