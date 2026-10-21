// Main-owned selected-source recovery; no raw project or historical import backup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-clinical-review-contracts-ready';
const stage='F:/VisibleMedicine/staging/20261021-clinical-review-contract-batch';
const manifest=json(stage+'/MANIFEST.json');
const observationPath='F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T02-40-16.767Z/observation.json';
assert.equal(sha(read(observationPath)),'d61ceb0c6f193ff6f1022e3088ff6547eecd974c644ea07246ebc4fb3c2e6a11');
const observation=json(observationPath);
assert.equal(observation.namedInputsVerified,5053);
assert(observation.processesConfirmedLive&&!observation.terminalReceiptObserved&&observation.ownerPreviewRunning);
assert(!fs.existsSync(root));assert.equal(manifest.files.length,12);
const receiptSpecs=[
 [stage,'CLINICAL_PRESERVATION_BATCH',3],
 [stage,'FOOT_GIRDLE_MAIN_INVERSE',null],
 [stage,'FOOT_GIRDLE_MAIN_METADATA',null],
 ['F:/VisibleMedicine/staging/20261021-atlas-source-assembly','REVIEW_ENTRY_ROUTER_STATIC',null],
 ['F:/VisibleMedicine/staging/20261021-atlas-source-assembly','REVIEW_ENTRY_ROUTER_PROVIDER',null],
 ['F:/VisibleMedicine/staging/20261021-atlas-source-assembly','REVIEW_ENTRY_ROUTER_SYNTAX',null],
 ['F:/VisibleMedicine/staging/20261021-genicular-contract-proposal','GENICULAR_METADATA_REFUSALS',null],
 ['F:/VisibleMedicine/staging/20261021-genicular-contract-proposal','GENICULAR_SYNTAX',null],
];
const receipts=receiptSpecs.map(([dir,label,count])=>{
 const r=json(dir+'/'+label+'.json');assert.equal(r.code,0,label);assert.equal(r.signal,null,label);
 assert.equal(sha(read(r.log)),r.logSha256,label);
 if(count!==null)for(const text of ['tests '+count,'pass '+count,'fail 0','skipped 0'])assert(r.footer.some(line=>line.endsWith(text)),text);
 return{dir,label,logSha256:r.logSha256};
});
const assembly=json(stage+'/ASSEMBLY_AND_CHECKOUT.json');
assert.equal(assembly.manifestSha256,sha(read(stage+'/MANIFEST.json')));
assert(assembly.freshAutocrlfCheckoutByteIdentical&&assembly.frozenPreimagesUnchanged);
const verify=()=>{
 for(const row of manifest.files){
  assert.equal(sha(read(stage+'/files/'+row.path)),row.sha256,row.path);
  const current=manifest.site+'/'+row.path;
  assert.equal(fs.existsSync(current)?sha(read(current)):null,row.beforeSha256,row.path+' frozen preimage');
 }
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(sha(read(stage+'/MANIFEST.json')),assembly.manifestSha256);
};verify();fs.mkdirSync(root);
const files=[],selected=[];
const copy=(from,relative,remote=true)=>{
 const b=read(from),to=root+'/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});
 assert.equal(sha(read(to)),sha(b));const row={path:relative,bytes:b.length,sha256:sha(b),remoteSelected:remote};
 files.push(row);if(remote)selected.push(row);
};
for(const row of manifest.files){copy(stage+'/files/'+row.path,'website/'+row.path);if(row.beforeSha256)copy(stage+'/originals/'+row.path,'preimages/'+row.path);}
for(const name of ['MANIFEST.json','ASSEMBLY_AND_CHECKOUT.json','README.md'])copy(stage+'/'+name,'evidence/'+name);
for(const {dir,label} of receipts)for(const ext of ['json','log'])copy(dir+'/'+label+'.'+ext,'evidence/'+label+'.'+ext);
for(const name of ['prepare-clinical-review-contract-batch-20261021.mjs','verify-review-entry-router-20261021.mjs','checkpoint-clinical-review-contracts-20261021.mjs'])copy(name,'scripts/'+name);
for(const [origin,names] of [
 ['elbow-review-contract-proposal',['HANDOFF.md','PROPOSAL.md']],
 ['foot-girdle-contract-proposal',['HANDOFF.md','FILES.md','inverse-check.mjs','static-proof.mjs']],
 ['genicular-contract-proposal',['HANDOFF.md','metadata-proof.mjs']],
])for(const name of names)copy('F:/VisibleMedicine/staging/20261021-'+origin+'/'+name,'proposal-proofs/'+origin+'/'+name);
copy(observationPath,'local/full-suite-observation.json',false);
copy('F:/VisibleMedicine/staging/20261021-after-suite-dental/state.json','local/dental-queue-state.json',false);
const processSnapshot=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
 "Get-CimInstance Win32_Process -Filter 'ProcessId=262080 OR ProcessId=255564 OR ProcessId=238208 OR ProcessId=260328' | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine | ConvertTo-Json -Depth 3"],{windowsHide:true});
fs.writeFileSync(root+'/local/processes.json',processSnapshot,{flag:'wx'});
const summary={at:new Date().toISOString(),stage,manifestSha256:assembly.manifestSha256,shippingPaths:12,
 source:manifest.source,files:manifest.files,receipts,
 progress:'Twelve before-hash-guarded clinical assurance paths assembled. Router real-provider harness, genuine original9f elbow/girdle versus checked-current admission, preserved foot/genicular assertions. Three native source-preservation cases, whole foot/girdle inverse, actual current metadata/refusals and real12path fresh autocrlf checkout pass. Original attributes retained;9scoped LF rules,2raw fixtures unchanged.',
 limits:'Actual five affected corpus test modules and strict historical loader closure still unrun behind the live full Website suite and real queued dental successor. No proposed Website or canonical installation, review database write, owner tab refresh, authentication change, clinical approval or spatial registration. Later partial failures are triaged separately, not a terminal inventory.',
 observedFullSuite:{path:observationPath,sha256:sha(read(observationPath)),liveAtObservation:true,terminalAtObservation:false,namedInputs:5053,entryCount:1050},
 activeDelegation:[{owner:'/root/elbow_review_contract_1021',scope:'read-only partial clinical failures850onwards; local failure map only'},
 {owner:'/root/review_entry_router_1021',scope:'separate forearm X-ray proposal,4paths; no frozen mutation/heavy tests'}],
 next:'Read actual full-suite and queued-source terminal receipts before any heavy check or frozen mutation. Retain whole partial/final failure inventory, execute original485assurance and all real staged corpus modules without weakening original historical theorems. Continue combined Atlas source/renderer/display/Review/exports/types/build/Website/browser admission; no source commit/intro replay predicted. Preserve full71/eight roadmap.',
 actualCorpusModulesPassed:false,canonicalInstalled:false,fullSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
copy(root+'/MAIN_REVIEW.json','evidence/MAIN_REVIEW.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-after-suite-dental-queue-backup';
const parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);
assert.equal(parent.head,'04408889aa476b87dd5e986895e130eb7cb4c299');
const old=json(parentRoot+'/remote-source-restored/.source-backup/manifest.json');
const values=new Map(old.files.map(row=>{const b=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(b),row.sha256);return[row.path,b];}));
for(const row of selected)values.set('evidence/20261021-clinical-review-contracts/'+row.path,read(root+'/'+row.path));
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-clinical-review-contracts-backup';
backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-clinical-review-contracts-20261021.git',
 branch:'backup/clinical-review-contracts-20261021',
 files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),
 bytesFor:p=>values.get(p),verifySource:verify,sourceIdentity:{atlasBase:manifest.source,candidateManifest:assembly.manifestSha256,installed:false},
 parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',
 proof:{shippingPaths:12,nativePreservationCases:3,freshCheckoutByteIdentical:true,actualCorpusModulesPassed:false,canonicalInstalled:false,clinicalApproval:false},
 scope:'Reviewed12path test/fixture/attribute batch, byte-exact preimages, small source/metadata/provider/preservation proofs and explicit limits on prior filtered source-only ancestry. Process/queue snapshots, coordination, original imported delivery, old private inbox, models/scans/masks, dependencies and raw canonical ancestry stay local. No browser pixels/DOM or patient records. Not whole/runnable/private-data backup or full corpus test pass.'});
const remote=json(backupRoot+'/github-backup.json');
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify({...summary,recoveryFiles:files,
 backup:{receipt:backupRoot+'/github-backup.json',receiptSha256:sha(read(backupRoot+'/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),shippingPaths:12,backup:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths,installed:false}));
