// Main-owned source-only planner/assembler. Importing it never starts a job.
// Materialization refuses a live/partial predecessor; planning may run alongside it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {read,json,sha,runGit} from './source-only-backup-20261019.mjs';
const baseReceipt='F:/VisibleMedicine/staging/20261022-review-recovery-website-candidate/VERIFIED_SOURCE.json';
const baseSha='1b38f47acd68bd9765d442f356a3390bda69f305007887739e03b362b480a9a3';
const terminalPath='F:/VisibleMedicine/staging/20261022-coherent-full-regression/TERMINAL.json';
const atlas='F:/VisibleMedicine/atlas',canonical='F:/VisibleMedicine/website';

export function containedTarget(root,relative){
 assert.equal(typeof relative,'string');assert(!path.isAbsolute(relative)&&!relative.includes('\\')&&!relative.includes('\0'));
 assert(relative.split('/').every(part=>part&&part!=='.'&&part!=='..'&&!part.includes(':')),'Literal contained path');
 const absolute=path.resolve(root,relative);assert(absolute.startsWith(path.resolve(root)+path.sep));return absolute;
}
function codeBytes(from){const bytes=read(from);assert(!bytes.includes(0));assert(Buffer.from(bytes.toString('utf8')).equals(bytes),'Lossless CODE preimage: '+from);return bytes;}

export function planReviewedRegressionCandidate({queuePath,queueSha256,expectedProposals,targetRoot}){
 assert.match(queueSha256,/^[a-f0-9]{64}$/);assert.equal(sha(read(queuePath)),queueSha256);
 assert.match(targetRoot,/^F:\/VisibleMedicine\/staging\/20261022-reviewed-regression-[a-z0-9-]+$/);
 assert(!fs.existsSync(targetRoot),'New isolated target only');
 assert.equal(sha(read(baseReceipt)),baseSha);const base=json(baseReceipt),queue=json(queuePath);
 assert.equal(base.sourceRows.length,5811);assert.equal(queue.website,base.website);
 assert.equal(queue.source,base.source);assert.equal(queue.review,base.review);
 assert.equal(queue.repairs.length,expectedProposals);assert.equal(queue.completeOriginalSourceInverses,expectedProposals);
 assert.equal(new Set(queue.repairs.map(row=>row.path)).size,expectedProposals);
 assert.equal(queue.frozenOrCanonicalEdited,false);assert.equal(queue.nativeRootsRerun,false);
 const website=targetRoot+'/website',expected=new Map(),changes=[],rawCopies=[];
 for(const row of base.sourceRows){
  containedTarget(website,row.path);assert(!expected.has(row.path));
  const from=base.website+'/'+row.path,bytes=read(from);assert.equal(bytes.length,row.bytes,row.path);assert.equal(sha(bytes),row.sha256,row.path);
  expected.set(row.path,{...row,from});
 }
 for(const row of queue.repairs){
  assert.match(row.path,/^tests\/[a-z0-9-]+\.(?:test\.)?(?:mjs|ts)$/);
  assert.equal(row.wholeSourceInverse,true);assert.equal(expected.get(row.path)?.sha256,row.beforeSha256);
  const bytes=codeBytes(row.proposal),before=codeBytes(row.beforePath);
  assert.equal(sha(bytes),row.proposalSha256);assert.equal(sha(before),row.beforeSha256);
  changes.push({path:row.path,beforeSha256:row.beforeSha256,sha256:row.proposalSha256});
  expected.set(row.path,{path:row.path,bytes:bytes.length,sha256:row.proposalSha256,from:row.proposal});
  rawCopies.push({path:'tests/fixtures/regression-before-20261022/'+path.basename(row.path)+'.raw',bytes:before.length,sha256:row.beforeSha256,from:row.beforePath});
 }
 for(const row of [...queue.additionalFiles.map(item=>({...item,bytes:codeBytes(item.from).length})),...rawCopies]){
  containedTarget(website,row.path);assert(row.path.startsWith('tests/'),'Only explicit CODE/test additions');
  const bytes=codeBytes(row.from);assert.equal(sha(bytes),row.sha256);assert.equal(bytes.length,row.bytes);
  assert(!expected.has(row.path),'No hidden additional-path overwrite: '+row.path);expected.set(row.path,row);
 }
 const sourceRows=[...expected.values()].map(({from,...row})=>row).sort((a,b)=>a.path.localeCompare(b.path));
 const added=sourceRows.filter(row=>!base.sourceRows.some(old=>old.path===row.path)).map(row=>row.path);
 assert.equal(sourceRows.length,5811+expectedProposals+queue.additionalFiles.length);
 assert.equal(changes.length,expectedProposals);assert.equal(added.length,expectedProposals+queue.additionalFiles.length);
 for(const row of base.sourceRows.filter(row=>!row.path.startsWith('tests/')))assert.equal(expected.get(row.path).sha256,row.sha256,'Non-test source cannot change');
 assert.equal(runGit(['-C',atlas,'rev-parse','HEAD']).toString().trim(),base.source);assert.equal(runGit(['-C',atlas,'status','--porcelain']).toString().trim(),'');
 assert.equal(runGit(['-C',canonical,'rev-parse','HEAD']).toString().trim(),'b953ff3f5f1891599cb6e91cb91311d9d6006270');
 return {at:new Date().toISOString(),targetRoot,website,baseReceipt,baseReceiptSha256:baseSha,baseWebsite:base.website,basePaths:5811,queuePath,queueSha256,source:base.source,review:base.review,expectedProposals,additionalCodePaths:queue.additionalFiles.length,sourceRows,changes,addedPaths:added,copies:[...expected.values()],nativeTestsRun:false,canonicalOrFrozenEdited:false,previewChanged:false,publicDeployment:false};
}

export function assertClosedPredecessorRecord(terminal,isAbsent){
 assert.equal(terminal.terminal,true);assert.equal(terminal.suiteCompleted,true);
 assert.equal(terminal.sourceReceiptSha256,baseSha);assert.equal(terminal.entryCount,1143);
 assert.equal(terminal.entrySha256,'99e7a288552a3f92623a3a9bc75cd28cf04942e8d2f3d2efd0f44e04b9b536b3');
 assert.deepEqual(terminal.closedSourceDrift,[]);assert.equal(terminal.testInputDrift,false);assert.equal(terminal.publicPreviewAssetDrift,false);
 for(const pid of [terminal.driverPid,terminal.runnerPid]){
  assert(Number.isInteger(pid)&&pid>0);assert.equal(isAbsent(pid),true,'Predecessor PID is still live: '+pid);
 }
 return true;
}
export function requireClosedPredecessor(){
 assert(fs.existsSync(terminalPath),'Actual predecessor terminal receipt is required; a quiet log/timeout is not terminal');
 const terminal=json(terminalPath);
 assertClosedPredecessorRecord(terminal,pid=>{try{process.kill(pid,0);return false;}catch(error){if(error.code==='ESRCH')return true;throw error;}});
 return {path:terminalPath,sha256:sha(read(terminalPath)),suiteCompleted:true,passingClaim:terminal.passingClaim};
}

export function materializeReviewedRegressionCandidate(options){
 const predecessor=requireClosedPredecessor(); // Before creating any directory.
 const plan=planReviewedRegressionCandidate(options);assert(!fs.existsSync(plan.targetRoot));
 fs.mkdirSync(plan.targetRoot);
 runGit(['clone','--shared','--no-checkout',canonical,plan.website]);runGit(['-C',plan.website,'read-tree','HEAD']);
 for(const row of plan.copies){const target=containedTarget(plan.website,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(row.from,target,fs.constants.COPYFILE_EXCL);assert.equal(sha(read(target)),row.sha256,row.path);}
 fs.symlinkSync(canonical+'/node_modules',plan.website+'/node_modules','junction');fs.symlinkSync(atlas,plan.targetRoot+'/atlas','junction');
 // Recheck frozen source and every selected proposal after copying; no mutable
 // source is trusted merely because it was authentic at the start of the copy.
 const after=planReviewedRegressionCandidate({...options,targetRoot:options.targetRoot+'-verification-only'});
 assert.deepEqual(after.sourceRows,plan.sourceRows);assert.deepEqual(after.changes,plan.changes);
 const {copies,...receipt}=plan;
 fs.writeFileSync(plan.targetRoot+'/PREPARED.json',JSON.stringify({...receipt,predecessor,phase:'source-only-assembled-native-validation-pending',localSharedGitAncestryOnly:true,privateRuntimeStateCopied:false,heavyJobStarted:false},null,2)+'\n',{flag:'wx'});
 return {website:plan.website,sourcePaths:plan.sourceRows.length,changedTests:plan.changes.length,addedPaths:plan.addedPaths.length,nativeTestsRun:false,ownerPreviewChanged:false};
}
