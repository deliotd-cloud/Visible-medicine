import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {overlayRuntimeTestRepairs} from './overlay-regional-runtime-test-repairs-20261022.mjs';
const planPath='F:/VisibleMedicine/staging/20261022-native-runtime-followups-consolidated/PLAN.json';
assert.equal(sha(read(planPath)),'e46623e9018cf718ca2dcfacb0f9d9f06cff867870b19ea8c8d094a5446047f1');
const plan=json(planPath),prior=json(plan.sourceReceipt),base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
assert.equal(sha(read(plan.sourceReceipt)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const rows=new Map(prior.sourceRows.map(row=>[row.path,row]));
for(const row of rows.values())assert.equal(sha(read(containedTarget(prior.website,row.path))),row.sha256);
const packets=new Map(),seen=new Set();
for(const row of [...plan.repairs,...plan.additionalFiles]){
 assert(row.path.startsWith('tests/'));assert(!seen.has(row.path));seen.add(row.path);
 const target=containedTarget(prior.website,row.path),from=(row.proposal??row.from).replaceAll('\\','/');
 const marker=from.lastIndexOf('/CODE/');assert(marker>=0);const stage=from.slice(0,marker);
 assert.equal(containedTarget(stage+'/CODE',row.path).toLowerCase(),from.replaceAll('/','\\').toLowerCase());
 const bytes=read(from);assert.equal(sha(bytes),row.proposalSha256??row.sha256);assert(!bytes.includes(0));assert(Buffer.from(bytes.toString('utf8')).equals(bytes));
 const old=rows.get(row.path);if(old){assert.equal(row.beforeSha256,old.sha256);assert.equal(sha(read(row.beforePath)),old.sha256);}else assert(!fs.existsSync(target));
 if(!packets.has(stage))packets.set(stage,{stage,paths:[]});packets.get(stage).paths.push(row.path);
}
assert.equal(plan.repairs.length,24);assert.equal(plan.additionalFiles.length,5);assert.equal(seen.size,29);assert.equal(plan.proposedNextNativeRoots.length,35);
for(const row of plan.alreadyPresent)assert.equal(sha(read(prior.website+'/'+row.path)),row.sha256);
const terminalPath=base+'/native-selected-repairs-v5/TERMINAL.json';
if(process.argv[2]==='--preflight'){
 const result={at:new Date().toISOString(),sourceReceipt:plan.sourceReceipt,sourceReceiptSha256:sha(read(plan.sourceReceipt)),planPath,planSha256:sha(read(planPath)),
  replacements:24,additions:5,proposedSourcePaths:6047,nextNativeRoots:35,allNamedPreimagesAndCodeVerified:true,candidateChanged:false,
  applyRequiresActual172RootTerminal:true,terminalPresent:fs.existsSync(terminalPath),supersedes:'FOLLOWUP_PREFLIGHT.json'};
 const output=base+'/NATIVE_SOURCE_FOLLOWUP_PREFLIGHT.json';assert(!fs.existsSync(output));fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({receipt:output,sha256:sha(read(output)),replacements:24,additions:5,nextNativeRoots:35,candidateChanged:false}));
}else{
 assert.equal(process.argv[2],'--apply');assert(fs.existsSync(terminalPath),'Keep the live172-root source immutable');
 const terminal=json(terminalPath);assert.equal(terminal.terminal,true);assert.equal(terminal.entryFiles,172);assert.deepEqual(terminal.sourceDrift,[]);
 assert.equal(terminal.sourceReceiptSha256,sha(read(plan.sourceReceipt)));assert(Number.isFinite(terminal.counts.tests)&&terminal.counts.tests>0);
 assert.equal(sha(read(base+'/native-selected-repairs-v5/child.tap')),terminal.tapSha256);
 const result=overlayRuntimeTestRepairs({priorReceipt:plan.sourceReceipt,outputReceipt:base+'/PRODUCT_SOURCE_V6.json',priorTerminal:terminalPath,packets:[...packets.values()]});
 assert.equal(result.sourceRows.length,6047);
 assert.deepEqual(result.sourceRows.filter(row=>!row.path.startsWith('tests/')),prior.sourceRows.filter(row=>!row.path.startsWith('tests/')));
 const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingReviewTourFollowups={...pointer.activeWork.pendingReviewTourFollowups,
  phase:'24repairs/5additions in isolated V6;35-root native run pending',sourceReceipt:base+'/PRODUCT_SOURCE_V6.json',
  sourceReceiptSha256:sha(read(base+'/PRODUCT_SOURCE_V6.json')),sourcePaths:6047,candidateChanged:true,productionBytesChanged:0};
 pointer.activeWork.current.sourceReceipt=base+'/PRODUCT_SOURCE_V6.json';pointer.activeWork.current.sourceReceiptSha256=sha(read(base+'/PRODUCT_SOURCE_V6.json'));
 pointer.activeWork.updated=new Date().toISOString();fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
}
