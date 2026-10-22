// Main-owned recovery and filtered source-only backup, explicitly not a cutover.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-head-model-access-candidate';
const receipt=stage+'/SOURCE_WEBSITE_V2.json',source=json(receipt),terminalPath=stage+'/website-verification-v2/TERMINAL.json',terminal=json(terminalPath);
assert.equal(terminal.code,0);assert.deepEqual(terminal.sourceDrift,[]);assert.deepEqual(terminal.priorSourceDrift,[]);assert.equal(terminal.sourceReceiptSha256,sha(read(receipt)));
assert.deepEqual(terminal.commands.map(c=>[c.label,c.code]),[['native',0],['types',0],['website-build',0]]);
const native=terminal.commands[0].counts;assert.equal(native.tests,native.pass);assert.equal(native.fail+native.skipped+native.cancelled,0);
const imported=json(stage+'/SOURCE_IMPORT_V2.json');assert.equal(imported.code,0);assert.equal(imported.commands.length,10);assert(imported.commands.every(c=>c.code===0));assert.equal(imported.consumerCorrectionCommands.length,5);assert(imported.consumerCorrectionCommands.every(c=>c.code===0));
assert.equal(source.atlasHead,'ea70b126efc1b9a4e9c9b576587f922650145e53');assert.equal(source.atlasTree,'fa9633f09261d27efe3f90414524c86c7681bb59');
assert.equal(source.review,'81089b676a14b13a461f465361858ccdbbaa5734bdc6cefc193e055c46196d00');assert.equal(imported.review,source.review);
const exporter=json(stage+'/RUNTIME_EXPORT.json');assert.equal(exporter.code,0);
const historicalReceipt='F:/VisibleMedicine/staging/20261022-head-disclosure-history-successor/SOURCE.json',historical=json(historicalReceipt),historicalTerminalPath=path.dirname(historicalReceipt)+'/native-integration/TERMINAL.json',historicalTerminal=json(historicalTerminalPath);
assert.equal(sha(read(historicalReceipt)),'f9065c38bcb863c12870e1c7b76277e04d9279360ef290457639a903a1b58262');assert.equal(historicalTerminal.code,0);assert.equal(historicalTerminal.counts.pass,88);assert.deepEqual(historicalTerminal.sourceDrift,[]);
assert.equal(historical.atlasHead,'389bd0ca846a42c7f21055f55904bcf5df81a09f');assert.equal(historical.review,'811baffeb0cfa83626ea4f00383d0ed04fe6980716415d2f919151078cdad9b5');
const pointer=json('CURRENT_CHECKPOINT.json'),goalHash=sha(Buffer.from(JSON.stringify(pointer.goal))),policy=pointer.activeWork.current.ownerPreviewPolicy;
assert.equal(policy.websiteCutoverPermitted,false);assert.equal(policy.goalPaused,false);
const masterPlanHash=sha(read('F:/VisibleMedicine/website/docs/master-plan.md'));
const verify=()=>{
 for(const s of [source,historical]){
  for(const r of s.sourceRows)assert.equal(sha(read(s.website+'/'+r.path)),r.sha256,r.path);
  assert.equal(runGit(['-C',s.atlas,'rev-parse','HEAD']).toString().trim(),s.atlasHead);assert.equal(runGit(['-C',s.atlas,'rev-parse','HEAD^{tree}']).toString().trim(),s.atlasTree);assert.equal(runGit(['-C',s.atlas,'status','--porcelain']).toString().trim(),'');
 }
 for(const[repo,head]of [['F:/VisibleMedicine/website','b953ff3f5f1891599cb6e91cb91311d9d6006270'],['F:/VisibleMedicine/atlas','6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1']])assert.equal(runGit(['-C',repo,'rev-parse','HEAD']).toString().trim(),head);
 const listener=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess | ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true}));
 assert.equal(listener.OwningProcess,297128);assert.equal(listener.LocalAddress,'127.0.0.1');assert.equal(sha(read('F:/VisibleMedicine/website/docs/master-plan.md')),masterPlanHash);
 assert.equal(sha(Buffer.from(JSON.stringify(json('CURRENT_CHECKPOINT.json').goal))),goalHash);
};verify();
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-head-access-verified';assert(!fs.existsSync(root));fs.mkdirSync(root);
for(const[p,to]of [['CURRENT_CHECKPOINT.json','pointer.before.json'],['WORKSPACE_MAP.md','WORKSPACE_MAP.before.md']])fs.copyFileSync(p,root+'/'+to);
const witnesses=[];
for(const from of [receipt,terminalPath,stage+'/SOURCE.json',stage+'/SOURCE_IMPORT.json',stage+'/SOURCE_IMPORT_V2.json',stage+'/SOURCE_WEBSITE.json',stage+'/website-verification/TERMINAL.json',stage+'/consumer-rebind/TERMINAL.json',stage+'/DELIVERY_ADMISSION.json',stage+'/RUNTIME_EXPORT.json',stage+'/BROWSER_BASELINE.json',stage+'/focused/TERMINAL.json',stage+'/producer-verification/TERMINAL.json',stage+'/producer-verification-v2/TERMINAL.json',stage+'/producer-verification-v3/TERMINAL.json',stage+'/specimen-harness-correction/TERMINAL.json',historicalReceipt,historicalTerminalPath]){
 const to=root+'/receipts/'+String(witnesses.length).padStart(2,'0')+'-'+path.basename(from);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);witnesses.push({path:from,sha256:sha(read(from)),localCopy:to});
}
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-review-ui-assurance-source-backup/github-backup.json',parent=json(parentPath),parentRepo='F:/VisibleMedicine/history/website-work/github-review-ui-assurance-20261022.git';
assert.equal(sha(read(parentPath)),'07a1cc84225bd7556f00a3aef33b9a065e23a6b4b18cf995fdbefa3f1027a724');assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json'])),selected=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));
for(const r of manifest.files)assert.equal(sha(read(selected.get(r.path))),r.sha256);
const add=(from,to)=>{assert(/\.(?:mjs|ts|tsx|raw)$/.test(from)&&!from.endsWith('.json.raw'),'Code-only backup: '+from);const b=read(from);assert.deepEqual(Buffer.from(b.toString('utf8')),b);
 const p='pending/head-access-20261022/'+to;assert(!selected.has(p));selected.set(p,from);const local=root+'/source/'+to;fs.mkdirSync(path.dirname(local),{recursive:true});fs.copyFileSync(from,local,fs.constants.COPYFILE_EXCL);};
for(const row of json(stage+'/SOURCE.json').sourceRows)if(!row.path.endsWith('.json'))add(source.atlas+'/'+row.path,'atlas/'+row.path);
const previous=json(source.previousSource),previousMap=new Map(previous.sourceRows.map(r=>[r.path,r]));
for(const row of source.sourceRows)if(previousMap.get(row.path)?.sha256!==row.sha256&&/\.(?:mjs|ts|tsx|raw)$/.test(row.path)&&!row.path.startsWith('atlas-review/')&&!row.path.startsWith('public/')&&!row.path.endsWith('.json.raw')){
 add(source.website+'/'+row.path,'website/'+row.path);if(previousMap.has(row.path))add(previous.website+'/'+row.path,'website-preimages/'+row.path);
}
for(const row of json(stage+'/source-admission/RESULT.json').changed)if(fs.existsSync(stage+'/before/atlas/'+row.path))add(stage+'/before/atlas/'+row.path,'atlas-preimages/'+row.path);
assert.equal(sha(read(stage+'/before/atlas/scripts/test-specimen-model-access.mjs')),'a84328468f69d81ae9f9f81c210435cc0a57130c76cbc937f556b76683649288');
add(stage+'/before/atlas/scripts/test-specimen-model-access.mjs','atlas-preimages/scripts/test-specimen-model-access.mjs');
add('F:/VisibleMedicine/staging/20261022-head-access-integration-proposal/head-access-current-delivery.test.mjs','integration-test-original-proposal.mjs');
add('F:/VisibleMedicine/staging/20261022-head-model-access-source-proposal/evidence/test-source-proposal.mjs','atlas-protocol-proposal-proof.mjs');
add(stage+'/consumer-rebind/integration-before-review-rebind.mjs','integration-test-before-consumer-rebind.mjs');
const historyProposal='F:/VisibleMedicine/staging/20261022-head-disclosure-history-followup',historyResult=json(historyProposal+'/RESULT.json');
assert.equal(sha(read(historyProposal+'/RESULT.json')),'1dec3f8d5bf4db2568ce5ee9a87833bf37ea8c35ede552e5bb18065692e566c7');
for(const row of historyResult.changedTests){add(historical.website+'/'+row.path,'historical-assurance/'+row.path);add(historyProposal+'/RAW/'+path.basename(row.path)+'.raw','historical-assurance/preimages/'+path.basename(row.path)+'.raw');}
add(historyProposal+'/CODE/source-role-proof.mjs','historical-assurance/source-role-proof.mjs');add(historyProposal+'/evidence/MAIN_PREPARER.before-output-eol.mjs','historical-assurance/main-preparer.before-output-eol.mjs');
for(const p of ['prepare-head-model-access-candidates-20261022.mjs','admit-head-model-access-source-20261022.mjs','head-model-access-scene-branches-20261022.mjs','verify-head-model-access-focused-20261022.mjs','verify-head-model-access-build-20261022.mjs','head-access-test-dependencies-20261022.mjs','resume-head-access-producer-checks-20261022.mjs','finish-head-access-producer-verification-20261022.mjs','verify-head-access-specimen-harness-20261022.mjs','freeze-head-model-access-source-20261022.mjs','export-head-model-access-20261022.mjs','record-head-model-access-browser-20261022.mjs','prepare-head-access-import-metadata-20261022.mjs','import-head-model-access-20261022.mjs','prepare-head-disclosure-history-20261022.mjs','admit-head-access-delivery-20261022.mjs','verify-head-access-website-20261022.mjs','rebind-head-access-consumers-20261022.mjs','verify-head-access-website-v2-20261022.mjs','checkpoint-head-access-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const r of files)assert.equal(sha(read(selected.get(r.path))),r.sha256,r.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-head-access-source-backup';let saved,failure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-head-access-20261022.git',branch:'backup/head-access-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{atlas:source.atlasHead,tree:source.atlasTree,review:source.review,websiteSourceReceiptSha256:sha(read(receipt)),separateHistoricalAtlas:historical.atlasHead,separateHistoricalReview:historical.review},
 scope:'Inherited filtered source plus advisory sign-in/access-denied model-comparison recovery, exact-source publisher/parser/UI tests and historical disclosure/history contract repairs. Generated JSON, bindings/pins/coverage, compiled runtime/viewer, private records/DB/env/decisions/references, held assets, scans/models/masks, raw logs/media and canonical ancestry stay local. This is scoped source-only recovery, not a whole/private/runnable backup, deployment or installed update.',
 proof:{native,websiteTypesAndProductionBuild:true,atlasTypesAndProductionBuild:true,stockImportChecks:10,specimenHarness:{allSixOriginalTestsPass:true,originalFailureRetained:true,noProductionChange:true},historicalNative:historicalTerminal.counts,
  consumerTypeFailureRetained:true,allOriginalAssertionInversesRetained:true,modelAndCoverageUnchanged:true,advisoryProtocolOnly:true,independentAccessUnchanged:true,newHostBrowserAcceptance:false,ownerPreviewChanged:false,full71AndEightIdeasPreserved:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});}
catch(error){failure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(failure,null,2)+'\n',{flag:'wx'});}
verifySource();const backupPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json'),sourceBackup={receipt:backupPath,receiptSha256:sha(read(backupPath)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,independentlyVerified:!!saved,wholePrivateOrRunnableBackup:false,...(failure?{failure}:{})};
const next='Keep owner preview unchanged: no installation/restart/refresh or repeated restart request. Selected isolated website now coherently binds Atlas ea70 and Review81089 with real publisher-to-host protocol checks, full types/production build and stock admission gates. Separate older389/Review811b disclosure/history assurance88/88 remains independent. Continue full71requirements/eightideas and highest-value linked-learning/desktop roadmap work; retain exact source roles, all historical failures, independent access, specialist masks and desktopPACS boundaries. New real-browser/auth/GPU acceptance and broader applicable regression closure remain pending; do not infer clinical/spatial/public approval.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',milestone:'Explicit model-access feedback and fresh-session recovery for CT/MRI linked existing3D comparison, coherently imported/verified in isolation; separate historical disclosure/history assurance extended.',
 sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourceRows.length,atlas:source.atlasHead,atlasTree:source.atlasTree,review:source.review,boundInputs:1728,importedSources:1561,native,websiteTypesAndBuildPassed:true,atlasTypesAndBuildPassed:true,
 separateAssurance:{sourceReceipt:historicalReceipt,sourceReceiptSha256:sha(read(historicalReceipt)),atlas:historical.atlasHead,review:historical.review,nativeReceipt:historicalTerminalPath,counts:historicalTerminal.counts},
 receipts:witnesses,sourceBackup,preview:{address:'127.0.0.1:3000',pid:297128,unchanged:true},ownerPreviewPolicy:policy,next,full71AndEightIdeasPreserved:true,canonicalInstalled:false,newHostBrowserAcceptance:false,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json'),active=latest.activeWork.current;Object.assign(active,{at:result.at,checkpoint:root+'/checkpoint.json',checkpointSha256:sha(read(root+'/checkpoint.json')),currentCandidate:source.website,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourceRows.length,
 sourceBackup,headAccessVerified:result,separateAssurance:result.separateAssurance,next,beforeFurtherWork:next,pendingWorkers:[],activeExecutionSessions:[],wholeSuitePassing:false,full71AndEightIdeasPreserved:true});
Object.assign(active.pendingHeadModelAccess,{containedBuildExportPending:false,websiteImportAndReviewRebindPending:false,websiteTypesAndBuildPending:false,verifiedWebsiteReceipt:receipt,verifiedWebsiteReceiptSha256:sha(read(receipt)),websiteReview:source.review,canonicalInstalled:false});
latest.activeWork.updated=result.at;assert.equal(sha(Buffer.from(JSON.stringify(latest.goal))),goalHash);fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),native,sourceBackup,ownerPreviewChanged:false}));
