import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {containedTarget} from './prepare-reviewed-regression-candidate-20261022.mjs';
import {overlayRuntimeTestRepairs} from './overlay-regional-runtime-test-repairs-20261022.mjs';
const planPath='F:/VisibleMedicine/staging/20261022-reviewed-native-followup-consolidated/PLAN.json';
assert.equal(sha(read(planPath)),'23b5b61d15d76ba96963efa4a20a97ea20476c02006a75f364afa0eb2b011228');
const plan=json(planPath),prior=json(plan.sourceReceipt),root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
assert.equal(sha(read(plan.sourceReceipt)),plan.sourceReceiptSha256);assert.equal(prior.sourceRows.length,6042);
const rows=new Map(prior.sourceRows.map(row=>[row.path,row]));
for(const row of rows.values())assert.equal(sha(read(containedTarget(prior.website,row.path))),row.sha256);
const packets=new Map(),paths=new Set();
for(const row of [...plan.repairs,...plan.additionalFiles]){
 const relative=row.path,from=row.proposal??row.from;assert(relative.startsWith('tests/'));assert(!paths.has(relative));paths.add(relative);
 const destination=containedTarget(prior.website,relative),index=from.replaceAll('\\','/').lastIndexOf('/CODE/');assert(index>=0);
 const stage=from.replaceAll('\\','/').slice(0,index);assert.equal(containedTarget(stage+'/CODE',relative).toLowerCase(),from.replaceAll('/', '\\').toLowerCase());
 const bytes=read(from);assert.equal(sha(bytes),row.proposalSha256??row.sha256);assert(!bytes.includes(0));assert(Buffer.from(bytes.toString('utf8')).equals(bytes));
 const existing=rows.get(relative);if(existing){assert.equal(row.beforeSha256,existing.sha256);assert.equal(sha(read(row.beforePath)),existing.sha256);}
 else assert(!fs.existsSync(destination));
 if(!packets.has(stage))packets.set(stage,{stage,paths:[]});packets.get(stage).paths.push(relative);
}
assert.equal(plan.repairs.length,20);assert.equal(plan.additionalFiles.length,5);assert.equal(paths.size,25);
for(const row of plan.alreadyPresent)assert.equal(sha(read(prior.website+'/'+row.path)),row.sha256);
const terminalPath=root+'/native-selected-repairs-v5/TERMINAL.json';
if(process.argv[2]==='--preflight'){
 const receipt={at:new Date().toISOString(),planPath,planSha256:sha(read(planPath)),sourceReceipt:plan.sourceReceipt,
  sourceReceiptSha256:plan.sourceReceiptSha256,replacements:20,additions:5,newSourcePaths:6047,
  allNamedPreimagesAndCodeVerified:true,candidateChanged:false,applyRequiresActual172RootTerminal:true,terminalPresent:fs.existsSync(terminalPath)};
 const output=root+'/FOLLOWUP_PREFLIGHT.json';assert(!fs.existsSync(output));fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({receipt:output,sha256:sha(read(output)),candidateChanged:false,replacements:20,additions:5}));
}else{
 assert.equal(process.argv[2],'--apply','Explicit preflight or apply mode required');
 assert(fs.existsSync(terminalPath),'Keep the live172-root candidate frozen');
 const terminal=json(terminalPath);assert.equal(terminal.terminal,true);assert.equal(terminal.entryFiles,172);assert.deepEqual(terminal.sourceDrift,[]);
 assert.equal(terminal.sourceReceiptSha256,plan.sourceReceiptSha256);assert(Number.isFinite(terminal.counts.tests)&&terminal.counts.tests>0);
 assert.equal(sha(read(root+'/native-selected-repairs-v5/child.tap')),terminal.tapSha256);
 const result=overlayRuntimeTestRepairs({priorReceipt:plan.sourceReceipt,outputReceipt:root+'/PRODUCT_SOURCE_V6.json',priorTerminal:terminalPath,packets:[...packets.values()]});
 assert.equal(result.sourceRows.length,6047);
 assert.deepEqual(result.sourceRows.filter(row=>!row.path.startsWith('tests/')),prior.sourceRows.filter(row=>!row.path.startsWith('tests/')));
 const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.pendingReviewTourFollowups={...pointer.activeWork.pendingReviewTourFollowups,
  phase:'20 proposals and5additions integrated in isolated V6;29-root native verification pending',
  sourceReceipt:root+'/PRODUCT_SOURCE_V6.json',sourceReceiptSha256:sha(read(root+'/PRODUCT_SOURCE_V6.json')),sourcePaths:6047,candidateChanged:true,productionBytesChanged:0};
 pointer.activeWork.updated=new Date().toISOString();fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
}
