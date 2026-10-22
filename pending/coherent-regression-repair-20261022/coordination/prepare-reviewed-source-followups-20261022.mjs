import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {overlayRuntimeTestRepairs} from './overlay-regional-runtime-test-repairs-20261022.mjs';

// Candidate-only: the owner's explicit normal-preview hold remains in force.
const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourcePath=base+'/PRODUCT_SOURCE_V5.json';
const sourceHash='49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f';
const [mode,planPath,planHash,diagnosticReviewHash]=process.argv.slice(2);
assert(['--preflight','--apply'].includes(mode));
assert.match(planHash??'',/^[a-f0-9]{64}$/);
assert(planPath?.startsWith('F:/VisibleMedicine/staging/')&&planPath.endsWith('/PLAN.json'));
assert.equal(sha(read(planPath)),planHash);
const plan=json(planPath),prior=json(sourcePath);
assert.equal(plan.sourceReceipt,sourcePath);
assert.equal(sha(read(sourcePath)),sourceHash);
assert.equal(prior.website,base+'/website');
assert.equal(prior.sourceRows.length,6042);
const rows=new Map(prior.sourceRows.map(row=>[row.path,row]));
for(const row of rows.values())assert.equal(sha(read(containedTarget(prior.website,row.path))),row.sha256,row.path);
assert(plan.repairs.length>=24&&plan.additionalFiles.length>=5);
const packets=new Map(),seen=new Set();
for(const row of [...plan.repairs,...plan.additionalFiles]){
 assert(row.path.startsWith('tests/'));assert(!seen.has(row.path));seen.add(row.path);
 const from=(row.proposal??row.from).replaceAll('\\','/');
 const at=from.lastIndexOf('/CODE/');assert(at>0);
 const stage=from.slice(0,at);assert(stage.startsWith('F:/VisibleMedicine/staging/'));
 assert.equal(containedTarget(stage+'/CODE',row.path).toLowerCase(),from.replaceAll('/','\\').toLowerCase());
 const bytes=read(from);assert.equal(sha(bytes),row.proposalSha256??row.sha256);
 assert(!bytes.includes(0));assert(Buffer.from(bytes.toString('utf8')).equals(bytes));
 const old=rows.get(row.path);
 if(old){assert.equal(row.beforeSha256,old.sha256);assert.equal(sha(read(row.beforePath)),old.sha256);}
 else assert(!fs.existsSync(containedTarget(prior.website,row.path)));
 if(!packets.has(stage))packets.set(stage,{stage,paths:[]});packets.get(stage).paths.push(row.path);
}
for(const row of plan.alreadyPresent)assert.equal(sha(read(prior.website+'/'+row.path)),row.sha256);
const roots=plan.proposedNextNativeRoots;
assert(roots.length>0&&new Set(roots).size===roots.length);
for(const path of roots){assert(path.startsWith('tests/')&&/\.test\.[cm]?[jt]sx?$/.test(path));assert(rows.has(path)||seen.has(path));}
const terminalPath=base+'/native-selected-repairs-v5/TERMINAL.json';
if(mode==='--preflight'){
 const output=base+'/REVIEWED_SOURCE_FOLLOWUP_PREFLIGHT.json';
 assert(!fs.existsSync(output));
 const result={at:new Date().toISOString(),planPath,planSha256:planHash,sourceReceipt:sourcePath,sourceReceiptSha256:sourceHash,
  replacements:plan.repairs.length,additions:plan.additionalFiles.length,nextNativeRoots:roots.length,
  expectedSourcePaths:6042+plan.additionalFiles.length,allNamedPreimagesAndCodeVerified:true,candidateChanged:false,
  terminalPresent:fs.existsSync(terminalPath),applyRequiresActualTerminalAndDiagnosticReview:true,ownerPreviewChanged:false};
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({receipt:output,sha256:sha(read(output)),...result}));
}else{
 assert(fs.existsSync(terminalPath),'Keep the live 172-root source immutable');
 const terminal=json(terminalPath);
 assert.equal(terminal.terminal,true);assert.equal(terminal.entryFiles,172);
 assert(Number.isInteger(terminal.code));assert.equal(terminal.signal,null);
 assert.deepEqual(terminal.sourceDrift,[]);assert.equal(terminal.sourceReceiptSha256,sourceHash);
 const tap=read(base+'/native-selected-repairs-v5/child.tap');
 assert.equal(sha(tap),terminal.tapSha256);
 for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
  const count=Number(tap.toString('utf8').match(new RegExp('^# '+key+' (\\d+)\\r?$','m'))?.[1]??NaN);
  assert(Number.isSafeInteger(count)&&count>=0);assert.equal(terminal.counts[key],count,key);
 }
 assert(terminal.counts.tests>0);assert.equal(terminal.counts.cancelled,0);
 // A completed failing run alone is not permission to overlook later failures.
 assert.match(diagnosticReviewHash??'',/^[a-f0-9]{64}$/);
 const reviewPath=base+'/native-selected-repairs-v5/DIAGNOSTIC_REVIEW.json';
 assert.equal(sha(read(reviewPath)),diagnosticReviewHash);
 const review=json(reviewPath);
 assert.equal(review.terminalSha256,sha(read(terminalPath)));
 assert.equal(review.tapSha256,terminal.tapSha256);assert.equal(review.selectedPlanSha256,planHash);
 assert.equal(review.mainReviewed,true);assert.deepEqual(review.unhandledFailureMarkers,[]);
 const result=overlayRuntimeTestRepairs({priorReceipt:sourcePath,outputReceipt:base+'/PRODUCT_SOURCE_V6.json',
  priorTerminal:terminalPath,packets:[...packets.values()]});
 assert.equal(result.sourceRows.length,6042+plan.additionalFiles.length);
 assert.deepEqual(result.sourceRows.filter(row=>!row.path.startsWith('tests/')),prior.sourceRows.filter(row=>!row.path.startsWith('tests/')));
 const pointer=json('CURRENT_CHECKPOINT.json');
 pointer.activeWork.current={...pointer.activeWork.current,at:new Date().toISOString(),sourceReceipt:base+'/PRODUCT_SOURCE_V6.json',
  sourceReceiptSha256:sha(read(base+'/PRODUCT_SOURCE_V6.json')),followupPlan:planPath,followupPlanSha256:planHash,
  sourcePaths:result.sourceRows.length,next:'Run every selected native root against this exact isolated source, then full types. Normal preview remains explicitly held unchanged.'};
 pointer.activeWork.updated=pointer.activeWork.current.at;
 fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
}
