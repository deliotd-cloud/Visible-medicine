import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {backup,read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',stage='F:/VisibleMedicine/staging/20261021-workbook-table-semantics-proposal';
const root='F:/VisibleMedicine/recovery/checkpoints/20261021-workbook-semantics-staged';
const parentRoot='F:/VisibleMedicine/recovery/checkpoints/20261021-head-public-verified-backup';
const m=json(stage+'/PROPOSAL.json'),v=json(stage+'/MAIN_VERIFIED.json'),pointer=json('CURRENT_CHECKPOINT.json');
assert.equal(sha(read(stage+'/PROPOSAL.json')),'85928f807f559201872e1592688019494aee5de826a4c150b16a86530227bb99');
assert.equal(v.nativeCounts.pass,20);assert.equal(v.nativeCounts.fail,0);assert(v.fullProjectTypesOverlayPassed);assert.equal(v.canonicalInstalled,false);
assert.equal(sha(read(v.nativeReceipt)),v.nativeReceiptSha256);assert.equal(sha(read(v.typesReceipt)),v.typesReceiptSha256);
for(const name of ['MAIN_NATIVE','MAIN_TYPES','MAIN_TYPES-v2']){const r=json(stage+'/'+name+'.json');assert.equal(sha(read(r.log)),r.logSha256);}
const preserved=pointer.activeWork.preservedSourcePaths.map(path=>({path,sha256:sha(read(site+'/'+path))}));
const verify=()=>{
 assert.equal(runGit(['-C',site,'rev-parse','HEAD']).toString().trim(),m.websiteHeadAtObservation);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','rev-parse','HEAD']).toString().trim(),m.source);
 assert.equal(runGit(['-C','F:/VisibleMedicine/atlas','status','--porcelain']).toString().trim(),'');
 for(const r of [...json(v.sourceSnapshot),...preserved])assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 const binding=json(site+'/atlas-review/integration-inputs.json');assert.equal(binding.sha256,m.review);assert.equal(binding.inputs.length,1710);
 for(const r of binding.inputs)assert.equal(sha(read(site+'/'+r.path)),r.sha256,r.path);
 for(const r of m.proposedPaths){assert.equal(sha(read(stage+'/candidate/'+r.path)),r.candidateSha256);if(r.preimageSha256)assert.equal(sha(read(site+'/'+r.path)),r.preimageSha256);else assert(!fs.existsSync(site+'/'+r.path));}
 process.kill(266712,0);
};
verify();assert(!fs.existsSync(root));fs.mkdirSync(root);
const selected=[];
const copy=(from,to)=>{
 assert(!path.isAbsolute(to)&&!to.includes('..')&&!/[\\\x00-\x1f]/.test(to));
 const b=read(from);assert(b.length<250000&&!b.includes(0));new TextDecoder('utf-8',{fatal:true}).decode(b);
 fs.mkdirSync(path.dirname(root+'/'+to),{recursive:true});fs.writeFileSync(root+'/'+to,b,{flag:'wx'});selected.push({path:to,bytes:b.length,sha256:sha(b)});
};
for(const r of m.proposedPaths){copy(stage+'/candidate/'+r.path,'candidate/'+r.path);if(r.preimageSha256)copy(site+'/'+r.path,'preimages/'+r.path);}
for(const name of ['PROPOSAL','MAIN_VERIFIED','MAIN_NATIVE','MAIN_TYPES','MAIN_TYPES-v2','MAIN_PREFLIGHT_REFUSAL'])copy(stage+'/'+name+'.json','evidence/'+name+'.json');
for(const name of ['verify-workbook-semantics-20261021.mjs','verify-workbook-semantics-types-20261021.mjs','workbook-semantics-read-overlay-20261021.cjs','checkpoint-workbook-semantics-20261021.mjs'])copy(name,'controls/'+name);
const proof={at:new Date().toISOString(),source:m.source,review:m.review,websiteHead:m.websiteHeadAtObservation,
 canonicalInstalled:false,ownerDelivered:false,productPathsChanged:2,stagedPaths:4,exactPreimagesPreserved:true,
 nativeCounts:v.nativeCounts,fullProjectTypesOverlayPassed:true,fullBuildPassed:false,browserAcceptancePassed:false,
 allCanonicalInputsUnchanged:true,controlledInputs:5267,preservedInputs:7,reviewBindingsUnchanged:1710,
 singleStrongerHeaderRoleAssertionOnly:true,allOtherExistingEmptyStateAssertionsByteExact:true,
 ownerFormsRefreshed:false,ownerPreviewPid:266712,fullGoalActive:true,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 privateDataUploaded:false,wholeProjectBackup:false,privateDataBackup:false,
 limits:'Source-ready unpublished candidate only. Actual five-root20/20zero-skip native checks used a read-only two-file product overlay and one exact unchanged queue context file; complete project types used a read-only compiler-host overlay. Not an installed Website build, browser/screen-reader/layout/200percent acceptance, whole-suite pass or completed UX-02. No owner refresh or Review rebind.'};
fs.writeFileSync(root+'/PROOF.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});copy(root+'/PROOF.json','evidence/PROOF.json');
const parent=json(parentRoot+'/github-backup.json');assert(parent.sourceBackupVerified);assert.equal(parent.head,'f1eaca607187f4a557ce11ed2df2c5fd74438ec2');
const values=new Map(json(parentRoot+'/remote-source-restored/.source-backup/manifest.json').files.map(r=>{const b=read(parentRoot+'/remote-source-restored/'+r.path);assert.equal(sha(b),r.sha256);return[r.path,b];}));
for(const r of selected)values.set('evidence/'+path.basename(root)+'/'+r.path,read(root+'/'+r.path));
const remote=backup({root:root+'-backup',repo:'F:/VisibleMedicine/history/website-work/github-workbook-semantics-20261021.git',branch:'backup/workbook-semantics-20261021',files:[...values].map(([path,b])=>({path,bytes:b.length,sha256:sha(b)})).sort((a,b)=>a.path.localeCompare(b.path)),bytesFor:p=>values.get(p),verifySource:verify,parent:parent.head,parentTree:parent.tree,parentRepo:parentRoot+'/independent-readback.git',sourceIdentity:{source:m.source,review:m.review,canonicalInstalled:false,stagedMilestone:'workbook-table-semantics'},proof,
 scope:'Four exact unpublished workbook semantic-table source/test paths, three authentic preimages, compact actual native/types receipts and reviewed controls. Prior filtered source ancestry retained. No scans, masks, geometry, private modules/references/identifiers/notes/decisions, env, database, dependencies, raw TAP/DOM/media or raw canonical ancestry. Partial selected-source recovery, not whole/private/runnable backup or release/clinical approval.'});
const cp={...proof,stage,selectedFiles:selected,verification:stage+'/MAIN_VERIFIED.json',verificationSha256:sha(read(stage+'/MAIN_VERIFIED.json')),backup:{receipt:root+'-backup/github-backup.json',receiptSha256:sha(read(root+'-backup/github-backup.json')),head:remote.head,tree:remote.tree,restoredPaths:remote.restoredPaths},next:'Keep staged until coherent authorized source import/restart and actual desktop/browser/assistive acceptance. Review native history guards and current source preimages before import. Preserve all71roadmap items and the existing separate Review navigation candidate. No need to await clinical sign-off for independent safe development.'};
fs.writeFileSync(root+'/checkpoint.json',JSON.stringify(cp,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checkpoint:root+'/checkpoint.json',sha256:sha(read(root+'/checkpoint.json')),head:remote.head,restoredPaths:remote.restoredPaths,canonicalInstalled:false}));
