import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';

const base='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourcePath=base+'/PRODUCT_SOURCE_V6.json';
assert.equal(sha(read(sourcePath)),'44b20981b029abc59f4a5efcaa2c8e6a9fbddb7e2e00886c0db914646681169c');
const source=json(sourcePath),website=source.website;
const planPath='F:/VisibleMedicine/staging/20261022-terminal-source-continuation/PLAN.json';
assert.equal(sha(read(planPath)),'c434483f2f05fba330d3412655716a7fb76c3b8c50294509571fe024260fa46f');
const plan=json(planPath),oldTerminal=json(base+'/native-selected-repairs-v5/TERMINAL.json');
assert.equal(oldTerminal.terminal,true);assert.equal(oldTerminal.counts.fail,31);assert.deepEqual(oldTerminal.sourceDrift,[]);
const reviewPath=base+'/native-selected-repairs-v5/DIAGNOSTIC_REVIEW.json';
assert.equal(sha(read(reviewPath)),'b0bcea906c95488fbcdff36bea37f8a343e7c0faa3699c94c70080b7f63d1268');
assert.deepEqual(json(reviewPath).unhandledFailureMarkers,[]);
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Exact preflight: '+row.path);
assert.equal(source.sourceRows.length,6049);
const v3=json(base+'/PRODUCT_SOURCE_V3.json');
assert.deepEqual(source.sourceRows.filter(r=>!r.path.startsWith('tests/')),v3.sourceRows.filter(r=>!r.path.startsWith('tests/')));
const tests=plan.proposedNextNativeRoots;assert.equal(tests.length,101);assert.equal(new Set(tests).size,101);
for(const path of tests)assert(source.sourceRows.some(r=>r.path===path));
const evidence=base+'/native-terminal-followups-v6';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const args=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests];
const inputs={at:new Date().toISOString(),website,sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),
 selectedPlan:planPath,selectedPlanSha256:sha(read(planPath)),diagnosticReview:reviewPath,
 diagnosticReviewSha256:sha(read(reviewPath)),entryFiles:tests.length,args,
 inputs:tests.map(path=>({path,sha256:sha(read(website+'/'+path))})),
 scope:'Selected original, newly repaired and named consumer roots. Not an exhaustive transitive-import or whole-suite certification.',
 priorPassesNotClaimedForThisSource:true,ownerPreviewChanged:false};
fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const output=fs.createWriteStream(evidence+'/child.tap',{flags:'wx'}),errors=fs.createWriteStream(evidence+'/child.stderr',{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:website,windowsHide:true,
 env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(output);child.stderr.pipe(errors);
const pointer=json('CURRENT_CHECKPOINT.json');
pointer.activeWork.previousSelectedRepairNativeRun=pointer.activeWork.selectedRepairNativeRun;
pointer.activeWork.selectedRepairNativeRun={at:inputs.at,evidence,pid:child.pid,terminal:false,entryFiles:101,
 sourceReceipt:sourcePath,sourceReceiptSha256:inputs.sourceReceiptSha256,ownerPreviewChanged:false};
pointer.activeWork.current.nativeRun={...pointer.activeWork.selectedRepairNativeRun,session:null,result:null};
pointer.activeWork.current.repairs=68;pointer.activeWork.current.additions=7;pointer.activeWork.current.nextNativeRoots=101;
pointer.activeWork.current.proposalCodeSourceBackedUp=false;
pointer.activeWork.current.terminalFailureInventory.allDiagnosed=true;
pointer.activeWork.current.terminalFailureInventory.diagnosticReview=reviewPath;
pointer.activeWork.current.beforeFurtherWork='V6 101-root native run is active; keep source immutable and one heavy job. No normal-preview changes. Source-only originals and unmodified production graph are checked, not native acceptance.';
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({phase:'running',pid:child.pid,entryFiles:101,evidence,ownerPreviewChanged:false}));
const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([output,errors].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
const tap=read(evidence+'/child.tap').toString(),counts={};
for(const name of ['tests','pass','fail','cancelled','skipped','todo'])counts[name]=Number(tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'))?.[1]??NaN);
const sourceDrift=source.sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
const terminal={at:new Date().toISOString(),terminal:true,...result,counts,entryFiles:101,sourceDrift,
 sourceReceipt:sourcePath,sourceReceiptSha256:sha(read(sourcePath)),inputsSha256:sha(read(evidence+'/INPUTS.json')),
 tapSha256:sha(read(evidence+'/child.tap')),stderrSha256:sha(read(evidence+'/child.stderr')),
 ownerPreviewChanged:false,clinicalApproval:false,wholeSuitePassing:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');
latest.activeWork.selectedRepairNativeRun={...latest.activeWork.selectedRepairNativeRun,...terminal,pid:null};
latest.activeWork.current.nativeRun={...latest.activeWork.current.nativeRun,...terminal,pid:null,result:evidence+'/TERMINAL.json'};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');
console.log(JSON.stringify(terminal));
process.exitCode=result.code===0&&counts.tests>0&&counts.fail===0&&counts.cancelled===0&&counts.skipped===0&&sourceDrift.length===0?0:1;
