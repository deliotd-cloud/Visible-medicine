// Main-owned, explicit source-only checkpoint. No private/runtime directory walk.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const config=json(process.argv[2]),prep=json(config.batch+'/PREPARATION.json');
const snapshot='F:/VisibleMedicine/staging/20261021-source190-complete-suite/SOURCE_INPUTS.json',inputs=json(snapshot);
const bound=json(prep.site+'/atlas-review/integration-inputs.json');assert.equal(inputs.length,5107);assert.equal(bound.inputs.length,1710);assert.equal(bound.sha256,prep.review);
let passed=0;
for(const row of prep.receipts){
 assert.equal(sha(read(row.file)),row.sha256);const receipt=json(row.file);assert.equal(receipt.code,0);assert.equal(sha(read(receipt.log)),receipt.logSha256);
 const count=key=>{const lines=receipt.footer.filter(line=>new RegExp('^[ℹ#] '+key+' \\d+$').test(line));assert.equal(lines.length,1);return Number(lines[0].split(' ').at(-1));};
 assert.equal(count('tests'),count('pass'));for(const key of ['fail','cancelled','skipped','todo'])assert.equal(count(key),0);passed+=count('pass');
}
assert.equal(passed,config.expectedBoundedPasses);
function verify(){
 for(const row of inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
 for(const row of bound.inputs)assert.equal(sha(read(prep.site+'/'+row.path)),row.sha256,row.path);
 for(const row of prep.changes){assert.equal(sha(read(row.from)),row.sha256,row.path);if(row.beforeSha256)assert.equal(sha(read(prep.site+'/'+row.path)),row.beforeSha256,row.path);else assert(!fs.existsSync(prep.site+'/'+row.path));}
 assert.equal(runGit(['-C',prep.atlas,'rev-parse','HEAD']).toString().trim(),prep.source);assert.equal(runGit(['-C',prep.atlas,'status','--porcelain=v1']).toString().trim(),'');
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),'98d7f17e2d120b031633e59e47fc50c82d44b2d0');
 assert.equal(runGit(['-C','F:/VisibleMedicine/website','rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 assert.equal(json('F:/VisibleMedicine/website/atlas-review/integration-inputs.json').sha256,'b2bd971b5bfefdd0760f8f3c8785e372276e15dac9cc293ac8fde4cdfb7dcb54');
 if(config.canonicalAdmission){
  assert.equal(sha(read(config.canonicalAdmission.file)),config.canonicalAdmission.sha256);
  const installed=json(config.canonicalAdmission.file);assert.equal(installed.canonicalDeveloperToolingInstalled,true);assert.equal(installed.canonicalAtlasUiInstalled,false);
  for(const row of installed.changes)assert.equal(sha(read(installed.site+'/'+row.path)),row.sha256,row.path);
  for(const row of json(config.canonicalAdmission.localOnlyGuardFile))assert.equal(sha(read(installed.site+'/'+row.path)),row.sha256,row.path);
  const checked=json(installed.nativeTests.receipt);assert.equal(checked.code,0);assert.equal(sha(read(checked.log)),checked.logSha256);
 }
}verify();
const root=config.checkpointRoot;assert(root.startsWith('F:/VisibleMedicine/recovery/checkpoints/'));assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
function copy(from,p){
 assert(!path.isAbsolute(p)&&!/[\\\x00-\x1f]/.test(p)&&p.split('/').every(v=>v&&v!=='.'&&v!=='..'));
 assert(!/(^|\/)(?:\.env|\.wrangler|\.local|private|node_modules)(?:\/|$)|\.(?:glb|sqlite|db|jpg|png|dcm|nii)$/i.test(p));
 const bytes=read(from);assert(bytes.length<200000&&!bytes.includes(0));const to=root+'/'+p;fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes,{flag:'wx'});selected.push({path:p,bytes:bytes.length,sha256:sha(bytes)});
}
if(config.includeProposalSources!==false)for(const row of prep.changes){copy(row.from,'proposed-website/'+row.path);if(row.beforeSha256)copy(prep.site+'/'+row.path,'preimages/'+row.path);}
copy(config.batch+'/PREPARATION.json','evidence/BATCH.json');
if(config.includeProposalSources!==false)for(const row of prep.receipts)copy(row.file,'evidence/'+row.label+'.json');
for(const row of config.files)copy(row.from,row.path);
for(const id of [263984,271752,260328])process.kill(id,0);
const proof={...config.proof,at:new Date().toISOString(),source:prep.source,review:prep.review,currentNamedInputs:5107,proposedNamedInputs:prep.proposedSourceInputs,reviewInputs:1710,
 testOnlyPaths:prep.changes.length,existingTestChanges:prep.changes.filter(row=>row.beforeSha256).length,newCurrentTestOrOriginalFixturePaths:prep.changes.filter(row=>!row.beforeSha256).length,
 boundedNativeRegistrationsPassed:passed,boundedNativeRuns:prep.receipts.length,originalHistoricalChildTestsPassed:4,
 canonicalInstalled:false,candidateChanged:false,ownerPagesTouched:false,fullSuiteRunningAtObservation:true,fullSuitePassingClaim:false,originalFullFailureBaseline:144,
 clinicalApproval:false,spatialRegistration:false,publicDeployment:false,privateDataUploaded:false,fullGoalActive:true};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parent=json(config.parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,config.parentHead);
const values=new Map(json(config.parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(row=>{const bytes=read(config.parentRoot+'/remote-source-restored/'+row.path);assert.equal(sha(bytes),row.sha256);return[row.path,bytes];}));
for(const row of selected)values.set(config.prefix+'/'+row.path,read(root+'/'+row.path));
backup({root:root+'-backup',repo:config.backupRepo,branch:config.branch,files:[...values].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,
 sourceIdentity:{atlas:prep.source,review:prep.review,websiteInputCount:5107,proposalOnly:true},parent:parent.head,parentTree:parent.tree,parentRepo:config.parentRoot+'/independent-readback.git',proof,
 scope:'Explicit owned test-source proposals/exact preimages, small receipts, read-only cutover summary and controls on previously filtered ancestry. NOT installed or a full-suite pass. No raw canonical history, full private modules/manifests, model geometry/full runtimes, private DB/records/identities/decisions/env, scans/masks, dependencies or browser media/DOM. No test harness junctions packaged. Not a complete runnable/private backup, release or clinical/spatial approval.'});
const remote=json(root+'-backup/github-backup.json');
const checkpoint={...proof,stage:config.batch,site:prep.site,snapshot,snapshotSha256:sha(read(snapshot)),selectedFiles:selected,backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},next:config.next};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(checkpoint,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),selected:selected.length,head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths}));
