import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-clinical-assurance-ready';
const stage='F:/VisibleMedicine/staging/20261021-clinical-assurance-ready';
const manifest=json(stage+'/MANIFEST.json');
assert.equal(sha(read(stage+'/MANIFEST.json')),'f779ffe231ca860640c6452b236ad6f15338b5e28a77d6a6eddf271a2b67a12d');
assert.equal(manifest.files.length,49);assert.equal(manifest.actualModules.length,20);
const assembly=json(stage+'/ASSEMBLY_CHECKOUT_SYNTAX.json');
assert.equal(assembly.manifestSha256,sha(read(stage+'/MANIFEST.json')));
assert(assembly.freshAutocrlfCheckoutByteIdentical&&assembly.allRawFixturesCoveredByStockInventory);
const observationPath='F:/VisibleMedicine/staging/20261021-complete-website-assurance/observations/2026-10-21T02-58-05.766Z/observation.json';
assert.equal(sha(read(observationPath)),'a4e7e0aea7088eac85cac3cc573ee1d77ddc4f883a3e7d08a94bab3e084c02d6');
const observed=json(observationPath);assert(observed.processesConfirmedLive&&!observed.terminalReceiptObserved&&observed.ownerPreviewRunning);assert.equal(observed.namedInputsVerified,5053);
const receipts=[
 [stage,'CLINICAL_READY_PRESERVATION',10],
 [stage,'CLINICAL_READY_IMAGING_METADATA',null],
 [stage,'CLINICAL_READY_HEPATIC_METADATA',null],
 ['F:/VisibleMedicine/staging/20261021-clinical-assurance-combined-lf','COMBINED_QUIZ_METADATA',null],
 ['F:/VisibleMedicine/staging/20261021-clinical-git-root-proposal','GIT_ROOT_METADATA_BUFFERED',null],
].map(([dir,label,count])=>{
 const r=json(dir+'/'+label+'.json');assert.equal(r.code,0);assert.equal(r.signal,null);assert.equal(sha(read(r.log)),r.logSha256);
 if(count!==null)for(const text of ['tests '+count,'pass '+count,'fail 0','skipped 0'])assert(r.footer.some(line=>line.endsWith(text)));
 return{dir,label,logSha256:r.logSha256};
});
const verify=()=>{
 for(const row of manifest.files){assert.equal(sha(read(stage+'/files/'+row.path)),row.sha256,row.path);const p=manifest.site+'/'+row.path;assert.equal(fs.existsSync(p)?sha(read(p)):null,row.beforeSha256,row.path+' frozen original');}
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(sha(read(stage+'/MANIFEST.json')),assembly.manifestSha256);
};verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const recoveryFiles=[],selected=[];
const copy=(from,relative,remote=true)=>{const b=read(from),to=root+'/'+relative;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,b,{flag:'wx'});assert.equal(sha(read(to)),sha(b));const row={path:relative,bytes:b.length,sha256:sha(b),remoteSelected:remote};recoveryFiles.push(row);if(remote)selected.push(row);};
for(const row of manifest.files){copy(stage+'/files/'+row.path,'website/'+row.path);if(row.beforeSha256)copy(stage+'/originals/'+row.path,'preimages/'+row.path);}
for(const name of ['MANIFEST.json','ASSEMBLY_CHECKOUT_SYNTAX.json','README.md','hepatic-metadata-proof.mjs'])copy(stage+'/'+name,'evidence/'+name);
for(const {dir,label} of receipts)for(const ext of ['json','log'])copy(dir+'/'+label+'.'+ext,'evidence/'+label+'.'+ext);
for(const name of ['prepare-clinical-git-root-proposal-20261021.mjs','format-clinical-git-root-lf-20261021.mjs','prepare-clinical-assurance-combined-20261021.mjs','prepare-clinical-assurance-ready-20261021.mjs','record-clinical-partial-triage-20261021.mjs','checkpoint-clinical-assurance-ready-20261021.mjs'])copy(name,'scripts/'+name);
for(const [folder,names] of [
 ['clinical-current-quiz-batch',['FILES.md','HANDOFF.md','metadata-proof.mjs']],
 ['clinical-current-imaging-batch',['FILES.md','HANDOFF.md','metadata-proof.mjs']],
 ['hepatic-xray-contract-proposal',['FILES.md','HANDOFF.md']],
 ['clinical-git-root-proposal',['HANDOFF.md','metadata-proof.mjs','GIT_ROOT_PRESERVATION.json','GIT_ROOT_METADATA.json']],
 ['source-closure-triage',['FINDINGS.json','HANDOFF.md']],
 ['clinical-failure-triage',['FAILURES.json','MAIN_VERIFICATION.json','CORRECTION.json']],
 ['clinical-assurance-combined',['FAILURE.json']],
])for(const name of names)copy('F:/VisibleMedicine/staging/20261021-'+folder+'/'+name,'evidence/'+folder+'/'+name);
copy(observationPath,'local/full-suite-observation.json',false);
copy('F:/VisibleMedicine/staging/20261021-after-suite-dental/state.json','local/dental-queue-state.json',false);
const summary={at:new Date().toISOString(),stage,manifestSha256:assembly.manifestSha256,source:manifest.source,
 previousGoalTurnClassification:'progress:12path guarded clinical repair batch,3native preservation cases and independently restored659blob filtered source backup; no site cutover',
 progress:'49exact test/fixture/attribute paths consolidated;20real corpus modules,7pure guards,4strict original-import helpers,17rawfixtures. Actual freshautocrlf checkout49/49,31syntax files and10native preservation cases pass. Existing validator admits6quiz+5imaging+hepatic feature maps with exact unchanged relevant hashes/current learner scopes. Corrected false missing-source diagnosis with actual committed485/Review/input byte checks; no invented source blobs.',
 corrections:'Initial root proof failed on undeclared originalCRLF; metadata helper hit1MB default Git buffer. Explicit original EOL inverse and bounded64MB output fixed these; failures retained. First34path fresh checkout exposed mixed-EOL postimage; formatting-only exact-hash LF conversion fixed one test, rawCRLFfixture untouched. Five imaging fixtures renamed to inventoried.raw before admission. Failed raw logs containing long source dumps remain local; only failure receipts/classification selected.',
 scope:'No actual20corpus modules/historical import closures executed; no Website/Atlas runtime teaching/authentication changes, owner preview refresh, review decisions or deployment. Hepatic historical counts/refusals retained separately from unchanged original current-security block now on actual current485 theorem. Intracranial whole-catalogue test excluded; other actual failures remain.',
 files:manifest.files,actualModules:manifest.actualModules,pureModules:manifest.pureModules,receipts,
 fullSuiteObservation:{path:observationPath,sha256:sha(read(observationPath)),liveAtObservation:true,terminalAtObservation:false,namedInputs:5053,entryCount:1050},
 verifiedWait:{execSessionId:60576,waitMs:55000,returnedSessionId:60576,output:'empty',terminal:false},
 next:'Revalidate exact full262080/255564/session60576 and queue238208/session20530 first. Both must release the heavy slot; read actual Website terminal failure inventory and queued dental result/source21hashes if generated. Then actual current485 coverage/arterial/spinal assurance and full20corpus+7pure modules on this exact guarded batch; retain full old assertions and fail closed on missing history. Continue combined Atlas source/renderer/display/Review/learner/types/build/Website/browser admission, genuine source commit/introduction replay; no predicted identities or reduced71/eight scope.',
 actualCorpusModulesPassed:false,canonicalInstalled:false,fullSuitePass:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,fullGoalActive:true};
fs.writeFileSync(root+'/MAIN_REVIEW.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});copy(root+'/MAIN_REVIEW.json','evidence/MAIN_REVIEW.json');
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-clinical-review-contracts-backup',parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'2d169576b82d5ec4701a04e57f6487108977d9cd');
const old=json(parentRoot+'/remote-source-restored/.source-backup/manifest.json');const values=new Map(old.files.map(row=>{const b=read(parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(b),row.sha256);return[row.path,b];}));
for(const row of selected)values.set('evidence/20261021-clinical-assurance-ready/'+row.path,read(root+'/'+row.path));
const backupRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-clinical-assurance-ready-backup';
backup({root:backupRoot,repo:'F:/VisibleMedicine/history/website-work/github-clinical-assurance-ready-20261021.git',branch:'backup/clinical-assurance-ready-20261021',
 files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlasBase:manifest.source,manifestSha256:assembly.manifestSha256,installed:false},parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',
 proof:{shippingPaths:49,nativePreservationCases:10,freshCheckoutByteIdentical:true,actualCorpusModulesPassed:false,canonicalInstalled:false,clinicalApproval:false},
 scope:'49reviewed test/fixture/attribute postimages, exact preimages, small pure/metadata/diagnosis proofs, explicit failures/limits and coordination helpers on prior filtered source-only ancestry. Full original import, private inbox/scans/masks/models/dependencies/raw canonical ancestry and long failed source-dump logs remain local; no browser pixels/DOM or patient records. Process/coordination local. Not whole/runnable/private-data backup or actual full corpus pass.'});
const remote=json(backupRoot+'/github-backup.json');fs.writeFileSync(root+'/checkpoint.json',JSON.stringify({...summary,recoveryFiles,
 backup:{receipt:backupRoot+'/github-backup.json',receiptSha256:sha(read(backupRoot+'/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),shippingPaths:49,actualModules:20,nativeCases:10,
 backup:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths,installed:false}));
