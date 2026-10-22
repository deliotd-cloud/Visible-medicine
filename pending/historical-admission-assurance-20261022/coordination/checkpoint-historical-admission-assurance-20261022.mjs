// Seven test roots repaired, exact product retained, scoped source recovery only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-historical-admission-assurance',receipt=stage+'/SOURCE_V3.json',source=json(receipt),previous=json(source.previousSource);
const terminalPath=stage+'/combined-v3/TERMINAL.json',terminal=json(terminalPath),first=json(stage+'/combined/TERMINAL.json'),second=json(stage+'/combined-v2/TERMINAL.json');
assert.equal(terminal.code,0);assert.deepEqual(terminal.commands.map(r=>[r.label,r.code]),[['native',0],['types',0]]);
assert.deepEqual(terminal.commands[0].counts,{tests:86,pass:86,fail:0,cancelled:0,skipped:0,todo:0});assert.deepEqual(terminal.sourceDrift,[]);assert.deepEqual(terminal.previousSourceDrift,[]);
assert.equal(first.code,1);assert.deepEqual(first.commands[0].counts,{tests:86,pass:85,fail:1,cancelled:0,skipped:0,todo:0});
assert.equal(second.code,1);assert.equal(second.commands[0].counts.pass,86);assert.equal(second.commands[1].code,2);
assert.deepEqual(json(stage+'/SOURCE_V2.json').sourceRows,source.sourceRows,'Alias recovery changes no named source bytes');assert.equal(source.sourcePaths,6400);
assert.equal(source.changedPaths.length,7);assert.equal(source.addedPaths.length,22);assert.equal(source.allProductAndBindingsByteIdentical,true);
const firstRows=json(stage+'/SOURCE.json').sourceRows,failedWitness='tests/historical-admission-role-preservation.test.mjs';
for(const row of firstRows)assert.equal(sha(read(row.path===failedWitness?stage+'/preservation-before-order-fix.mjs':source.website+'/'+row.path)),row.sha256,'Exact first-run source replay: '+row.path);
const early=json(stage+'/SOURCE_TONGUE.json'),baseline=new Map(previous.sourceRows.map(r=>[r.path,r]));let earlyReplayed=0;
for(const row of early.sourceRows){let bytes=read(source.website+'/'+row.path);if(sha(bytes)!==row.sha256){assert.equal(baseline.get(row.path)?.sha256,row.sha256);bytes=read(previous.website+'/'+row.path);earlyReplayed++;}assert.equal(sha(bytes),row.sha256,'Exact early tongue source replay: '+row.path);}assert.equal(earlyReplayed,6);
const pointer=json('CURRENT_CHECKPOINT.json'),goalHash=sha(Buffer.from(JSON.stringify(pointer.goal)));assert.equal(pointer.goal.status,'active');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const verify=()=>{
 for(const s of [source,previous])for(const row of s.sourceRows)assert.equal(sha(read(s.website+'/'+row.path)),row.sha256,row.path);
 assert.equal(fs.realpathSync(stage+'/atlas'),fs.realpathSync(source.atlas));
 assert.equal(runGit(['-C',source.atlas,'rev-parse','HEAD']).toString().trim(),source.atlasHead);assert.equal(runGit(['-C',source.atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/manifest.json').websiteIntegrationSha256,'ae8413f4b4371381ad4451f7fb33478fa761330c35acbd95025d5bf8f3ebcd59');
 const listener=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object LocalAddress,OwningProcess | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));assert.deepEqual(listener,{LocalAddress:'127.0.0.1',OwningProcess:297128});
 assert.equal(sha(Buffer.from(JSON.stringify(json('CURRENT_CHECKPOINT.json').goal))),goalHash);
};verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-historical-admission-assurance-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const[from,to]of [['CURRENT_CHECKPOINT.json','pointer.before.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md'],['F:/VisibleMedicine/website/docs/master-plan.md','master-plan.before.md']])fs.copyFileSync(from,root+'/'+to,fs.constants.COPYFILE_EXCL);
const evidence=[receipt,stage+'/SOURCE.json',stage+'/SOURCE_V2.json',stage+'/SOURCE_TONGUE.json',stage+'/COMPOSED.json',stage+'/combined/TERMINAL.json',stage+'/combined-v2/TERMINAL.json',terminalPath,
 stage+'/tongue-initial/TERMINAL.json',stage+'/PROOF_FIX.json',stage+'/ATLAS_ALIAS_RECOVERY.json',
 'F:/VisibleMedicine/staging/20261022-zero-registration-current-admission/RESULT.json','F:/VisibleMedicine/staging/20261022-four-live-source-roles/RESULT_V1.json','F:/VisibleMedicine/staging/20261022-four-live-source-roles/RESULT_V2.json'];
const witnesses=evidence.map((from,i)=>{const to=root+'/'+String(i).padStart(2,'0')+'-'+path.basename(from);fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);return{path:from,sha256:sha(read(from)),localCopy:to};});
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-corpus-cranio-assurance-source-backup/github-backup.json';
assert.equal(sha(read(parentPath)),'ac6bd0248d8797af07351d211692a7b8c948b73c148cf0df6d9d9c8eaf8c2110');
const parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-corpus-cranio-assurance-20261022.git';assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));for(const row of manifest.files)assert.equal(sha(read(selected.get(row.path))),row.sha256);
const add=(from,to)=>{assert(/\.(?:mjs|ts|tsx|ps1|raw)$/.test(from)&&!from.endsWith('.json.raw'));const target='pending/historical-admission-assurance-20261022/'+to;assert(!selected.has(target));selected.set(target,from);const dest=root+'/source/'+to;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(from,dest,fs.constants.COPYFILE_EXCL);};
for(const p of [...source.changedPaths,...source.addedPaths])add(source.website+'/'+p,'website/'+p);
for(const p of ['PROVE_SOURCE.mjs','tests/drawable-epoch-current-admission.test.mjs','tests/expanded-review-delivery-admission.test.mjs'])add('F:/VisibleMedicine/staging/20261022-zero-registration-current-admission/'+p,'worker-zero/'+p);
add('F:/VisibleMedicine/staging/20261022-four-live-source-roles/VERIFY.ps1','worker-four/VERIFY.ps1');
for(const p of ['preservation-before-order-fix.mjs','compose-before-order-fix.mjs','verify-before-combined-v2.mjs','verify-before-combined-v3.mjs','prepare-before-atlas-junction.mjs'])add(stage+'/'+p,'diagnostic-source/'+p);
for(const p of ['prepare-tongue-neck-proposal-20261022.mjs','prepare-historical-admission-assurance-20261022.mjs','verify-historical-admission-assurance-20261022.mjs',
 'record-historical-admission-progress-20261022.mjs','compose-historical-admission-assurance-20261022.mjs','verify-historical-proof-fix-20261022.mjs','repair-historical-atlas-alias-20261022.mjs',
 'checkpoint-historical-admission-assurance-20261022.mjs','finalize-corpus-cranio-assurance-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
const files=[...selected].map(([p,from])=>({path:p,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const row of files)assert.equal(sha(read(selected.get(row.path))),row.sha256,row.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-historical-admission-assurance-source-backup';let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-historical-admission-assurance-20261022.git',branch:'backup/historical-admission-assurance-20261022',
 parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{atlas:source.atlasHead,tree:source.atlasTree,review:source.review,sourceReceiptSha256:sha(read(receipt))},
 scope:'Inherited filtered source plus seven current/historical regression roots, unchanged tongue/palate quizzes verified against later neck X-ray teaching, exact original source and mutation witnesses, and coordinator scripts. No product/anatomy/runtime/binding changes. Actual generated JSON, pin/tracking/Review evidence, compiled runtimes/viewer, private DB/env/records/decisions/references, held assets, scans/models/masks, fonts/binaries/logs stay local. Historical code-only witnesses are raw text, not images, private data or new product. Source-only, not whole/private/runnable recovery, installation or public deployment.',
 proof:{native:terminal.commands[0].counts,fullTypesPassed:true,initial85of86WitnessFailureRetained:true,subsequentMissingLocalAtlasAliasTypesFailureRetained:true,
  all6400NamedInputsStable:true,allProductAndBindingsUnchanged:true,initialSourceEpochsExactlyReplayed:true,newBuildOrBrowserAcceptance:false,
  canonicalInstalled:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});
}catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();const savedPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:savedPath,receiptSha256:sha(read(savedPath)),independentlyVerified:!!saved,head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,wholePrivateOrRunnableBackup:false,...(failure?{failure}:{})};
const next='Keep held normal preview unchanged. Selected6400/Atlas2381/Review1a48 is test-only with all product/runtime/binding bytes identical to6378. Actual13-root86/86 plus full TypeScript pass after exact witness ordering and missing local Atlas alias corrections; both refused diagnostics and source epochs remain recoverable. Historical drawable/expanded modules now register and execute every original assertion, and eight actual tongue/palate rows retain their quizzes across three later neck-Xray changes. Four other live-source roots execute their current and historical checks. Do not call the earlier20-root65/40/25 diagnostic or whole suite green. Next close remaining current/history source-role roots, beginning disclosure/current image-history and inferior-thyroid MRA/femoral/radial transitions, then review-navigation/tour/UI teaching contracts. Preserve all71/eight/full goal, independent access/privacy/specialist-mask/desktopPACS boundaries; no clinical-signoff stall, normal restart/install/refresh or repeated restart question.';
const cp={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Seven release-test roots execute exact original/current source assertions, with source-bound tongue/palate teaching and two previously zero-registration historical admission modules verified.',
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,boundInputs:1729,importedSources:1562,
 native:terminal.commands[0].counts,fullTypesPassed:true,verification:terminalPath,verificationSha256:sha(read(terminalPath)),witnesses,sourceBackup,
 allProductAndBindingsByteIdentical:true,newBuildOrBrowserAcceptance:false,allSourceEpochsReplayed:true,initialTongueNative:4,
 historicalCodeWitnesses:11,historicalCodeWitnessBytes:393017,rawSuffixPreventsHistoricalSourceCompilation:true,verifierHashMetadataV1CorrectedWithoutProposalChange:true,
 originalWitnessFailureAndAliasTypesFailurePreserved:true,canonicalInstalled:false,ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(cp,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');Object.assign(latest.activeWork.current,{at:cp.at,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),
 currentCandidate:source.website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,sourceBackup,historicalAdmissionVerified:cp,
 next,beforeFurtherWork:next,activeExecutionSessions:[],pendingWorkers:[],full71AndEightIdeasPreserved:true,wholeSuitePassing:false});
latest.activeWork.current.historicalAdmissionInFlight.phase='verified-isolated-not-installed';latest.activeWork.current.historicalAdmissionInFlight.pendingWorkers=[];
latest.activeWork.updated=cp.at;assert.equal(sha(Buffer.from(JSON.stringify(latest.goal))),goalHash);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),native:cp.native,fullTypesPassed:true,sourceBackup,ownerPreviewChanged:false}));
