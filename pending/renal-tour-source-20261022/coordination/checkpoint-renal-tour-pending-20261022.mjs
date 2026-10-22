// Recoverable, explicitly incomplete Atlas source milestone alongside a live native run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {json,read,sha,runGit,backup} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-renal-tour-source-candidate',atlas=stage+'/atlas';
const pointer=json('CURRENT_CHECKPOINT.json'),current=pointer.activeWork.current;
assert.equal(current.sourceReceiptSha256,'67b0f4f7716d062aaa2269c22b759436c3b62e2082248d4a447197d28a3643ed');
const source=json(current.sourceReceipt),native=json(stage+'/BROAD_NATIVE_PLAN.json');
assert.equal(native.tests.length,147);assert.equal(current.nativeRun.pid,329572);assert.equal(current.nativeRun.terminal,false);
// A lock/receipt alone is insufficient: authenticate the actual live process.
const processObservation=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Get-CimInstance Win32_Process -Filter 'ProcessId=329572' | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
assert.equal(processObservation.ProcessId,329572);assert(processObservation.CommandLine.includes('--test-concurrency=1')&&processObservation.CommandLine.includes('tests/head-surface-validation.test.ts'));
const paths=['lib/renal-tour.ts','lib/regional-tours.ts','content/renal-tour-pins.json','scripts/pin-renal-tour.mjs','scripts/test-renal-tour-source.mjs','scripts/test-renal-tour-registration.mjs'];
const rows=paths.map(p=>({path:p,bytes:read(atlas+'/'+p).length,sha256:sha(read(atlas+'/'+p))}));
assert.equal(rows.find(r=>r.path==='lib/renal-tour.ts').sha256,'095d8004799abc9afcdfecc0c22df0b3bd38d49cd7671d7f77c1866c54614bfb');
assert.equal(rows.find(r=>r.path==='content/renal-tour-pins.json').sha256,'083a3b264669a3bce4f55faee613385ca2e5c5a96064fc03081764c31afdf63c');
const evidencePath=stage+'/evidence/renal-tour-source-preimage.md',evidence=read(evidencePath).toString();
assert(evidence.includes('"sourceRefusals":84,"tourRefusals":111')&&evidence.includes('"pinsHash":"98c92256a3890541e186bbdc6a173d6206dd50b97f78a3e5ec896a6b4870d66e"'));
const verify=()=>{
 for(const r of rows)assert.equal(sha(read(atlas+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),'389bd0ca846a42c7f21055f55904bcf5df81a09f');
 for(const p of runGit(['-C',atlas,'diff','--name-only']).toString().trim().split('\n').filter(Boolean))assert(paths.includes(p),p);
 for(const r of source.sourceRows)assert.equal(sha(read(source.website+'/'+r.path)),r.sha256,r.path);
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'6d7a356ae949e13f2ff4bf1fec610ee6ae7762c1');
};verify();
const directory='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-pending';assert(!fs.existsSync(directory));fs.mkdirSync(directory);
fs.copyFileSync('CURRENT_CHECKPOINT.json',directory+'/pointer.before.json');fs.copyFileSync('WORKSPACE_MAP.md',directory+'/WORKSPACE_MAP.before.md');
for(const r of rows){const to=directory+'/source/'+r.path;fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(atlas+'/'+r.path,to);}
fs.copyFileSync(evidencePath,directory+'/worker-evidence.md');
const parentPath='F:/VisibleMedicine/recovery/checkpoints/20261022-head-surface-cancellation-source-backup/github-backup.json',parent=json(parentPath);
assert.equal(sha(read(parentPath)),'5be44f0a5c378c2b58dfd8a35760cfda97ab7f4086e6bc2aad8fd979cd0df5cf');assert(parent.sourceBackupVerified&&parent.strictIntegrity);
const parentRepo='F:/VisibleMedicine/history/website-work/github-head-surface-cancellation-20261022.git';
const manifest=JSON.parse(runGit(['--git-dir='+parentRepo,'show',parent.head+':.source-backup/manifest.json']));
const selected=new Map(manifest.files.map(r=>[r.path,path.dirname(parentPath)+'/remote-source-restored/'+r.path]));
for(const r of manifest.files)assert.equal(sha(read(selected.get(r.path))),r.sha256);
const prefix='pending/renal-tour-source-20261022/';
function add(from,to){const b=read(from);assert(/\.(?:ts|mjs)$/.test(from));assert.deepEqual(Buffer.from(b.toString('utf8')),b);assert(!selected.has(prefix+to));selected.set(prefix+to,from);}
for(const r of rows.filter(r=>r.path.endsWith('.ts')||r.path.endsWith('.mjs')))add(atlas+'/'+r.path,'atlas/'+r.path);
for(const p of ['lib/renal-tour.ts','lib/regional-tours.ts']){
 const to=directory+'/RAW/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,runGit(['-C',atlas,'show','389bd0ca846a42c7f21055f55904bcf5df81a09f:'+p]),{flag:'wx'});add(to,'RAW/'+p);
}
for(const p of ['prepare-renal-tour-source-20261022.mjs','verify-renal-tour-source-20261022.mjs','checkpoint-renal-tour-pending-20261022.mjs'])add(path.resolve(p),'coordination/'+p);
const files=[...selected].map(([path,from])=>({path,bytes:read(from).length,sha256:sha(read(from))})).sort((a,b)=>a.path.localeCompare(b.path));
const verifySource=()=>{verify();for(const r of files)assert.equal(sha(read(selected.get(r.path))),r.sha256,r.path);};
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261022-renal-tour-source-backup';let saved,backupFailure;
try{saved=backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-renal-tour-source-20261022.git',branch:'backup/renal-tour-source-20261022',parent:parent.head,parentRepo,parentTree:parent.tree,files,bytesFor:p=>read(selected.get(p)),verifySource,
 sourceIdentity:{verifiedWebsiteReceiptSha256:current.sourceReceiptSha256,atlasBaseline:'389bd0ca846a42c7f21055f55904bcf5df81a09f',atlasUncommittedDeltaSha256:sha(Buffer.from(JSON.stringify(rows))),review:source.review},
 scope:'Inherited filtered source plus incomplete isolated renal-tour exact-source guard, pin generator, additive source/registration tests and original code preimages. Generated pin JSON and Review metadata, compiled runtime/viewer, private records/DB/env/decisions/references, held assets, scans/models/masks and raw logs/media remain local. Not a complete, integrated, runnable or private backup; no installation/deployment.',
 proof:{workerSourceCheck:{sourceRefusals:84,tourRefusals:111,mainReviewedSourceAndEvidence:true},mainRegistrationTestNotYetRun:true,typesAndProductionBuildNotYetRunForThisAtlasDelta:true,website147RootJobLiveAtStart:true,wholeSuitePassing:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false}});}
catch(error){backupFailure={at:new Date().toISOString(),message:error.message,independentlyVerified:false};fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(backupRoot+'/backup-failure.json',JSON.stringify(backupFailure,null,2)+'\n',{flag:'wx'});}
verifySource();const savedPath=backupRoot+(saved?'/github-backup.json':'/backup-failure.json');
const sourceBackup={receipt:savedPath,receiptSha256:sha(read(savedPath)),head:saved?.head,tree:saved?.tree,sourcePaths:saved?.sourcePaths,restoredPaths:saved?.restoredPaths,independentlyVerified:Boolean(saved),wholePrivateOrRunnableBackup:false,...(backupFailure?{failure:backupFailure}:{})};
const pending={at:new Date().toISOString(),stage,atlas,baseline:'389bd0ca846a42c7f21055f55904bcf5df81a09f',sourceRows:rows,
 sourceCheck:{evidence:evidencePath,sha256:sha(read(evidencePath)),sourceRefusals:84,tourRefusals:111,workerNativeCheck:true,mainReviewed:true},sourceBackup,
 registrationAndAllPacketComparisonPending:true,rendererRevisionGenerationPending:true,typesBuildAndWebsiteImportPending:true,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false};
const next='Poll the existing live147-root website run via session96512/parent329572; do not restart it on an observation yield. After actual terminal diagnose failures and run verify-renal-tour-source-20261022.mjs serially for the staged renal guard/1104packet preservation, actual producers/types/build. Do not promote its uncommitted source before verification. Keep verified Website6182/Atlas389/Review811b selected and normal preview unchanged. Preserve all71/eight roadmap, private masks and desktopPACS boundary.';
const result={at:new Date().toISOString(),goalTurnClassification:'progress',previousGoalTurnClassification:'progress',milestone:'Existing renal guided tour gains exact-source/attribution validation in an isolated pending Atlas delta; broader website assurance is genuinely executing.',
 selectedWebsiteSourceReceipt:current.sourceReceipt,selectedWebsiteSourceReceiptSha256:current.sourceReceiptSha256,pendingRenalTour:pending,
 liveRun:{sessionId:96512,pid:329572,observedAt:new Date().toISOString(),plan:stage+'/BROAD_NATIVE_PLAN.json',planSha256:sha(read(stage+'/BROAD_NATIVE_PLAN.json')),terminalAtStart:false},
 sourceBackup,full71AndEightIdeasPreserved:true,wholeSuitePassing:false,canonicalInstalled:false,ownerPreviewChanged:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,next};
fs.writeFileSync(directory+'/checkpoint.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');Object.assign(latest.activeWork.current,{at:result.at,checkpoint:directory+'/checkpoint.json',checkpointSha256:sha(read(directory+'/checkpoint.json')),pendingRenalTour:pending,sourceBackup,pendingWorkers:[],next,beforeFurtherWork:next});
latest.activeWork.updated=result.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify({checkpoint:directory+'/checkpoint.json',sha256:latest.activeWork.current.checkpointSha256,sourceBackup,websiteSourceUnchanged:true,previewChanged:false}));
