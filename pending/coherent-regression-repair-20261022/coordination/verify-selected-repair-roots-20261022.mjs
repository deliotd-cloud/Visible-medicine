import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';

const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const receiptPath=root+'/PRODUCT_SOURCE_V5.json',source=json(receiptPath),website=source.website;
assert.equal(sha(read(receiptPath)),'49a132ab76102e0fb2845df9ab111047630ecdafc0f0a2e61e81fef70a62a03f');
const queuePath='F:/VisibleMedicine/staging/20261022-clinical-runtime-family-consolidated/QUEUE.json';
assert.equal(sha(read(queuePath)),'23d98d1a329bedd8d9007518f5d6fd0a1143553dfea9edaf16e571269d946993');
const queue=json(queuePath),triagePath='F:/VisibleMedicine/staging/20261022-full-regression-terminal-triage/EVIDENCE.json';
assert.equal(sha(read(triagePath)),'9752935070518ccf7ec2721c74c9e9ebd7a900458f272d77452adcbb61651cc7');
const triage=json(triagePath),prior=json(root+'/native-mri-runtime-v3/INPUTS.json');
const priorTerminal=json(root+'/native-mri-runtime-v3/TERMINAL.json');
assert.equal(priorTerminal.code,0);assert.equal(priorTerminal.counts.pass,404);assert.deepEqual(priorTerminal.sourceDrift,[]);
const v3=json(root+'/PRODUCT_SOURCE_V3.json');
assert.deepEqual(source.sourceRows.filter(row=>!row.path.startsWith('tests/')),v3.sourceRows.filter(row=>!row.path.startsWith('tests/')));
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Preflight: '+row.path);
const alreadyVerified=new Set(prior.inputs.map(row=>{
 assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Reused unchanged native root: '+row.path);return row.path;
}));
const requested=[...new Set([...queue.repairs.map(row=>row.path),...triage.pathSummary.filter(row=>row.scope==='selected-helper').map(row=>row.path)])]
 .filter(file=>/\.test\.[cm]?[jt]sx?$/.test(file)).sort();
const tests=requested.filter(file=>!alreadyVerified.has(file));
assert(tests.length>=130&&tests.length<=190);for(const file of tests)assert(fs.existsSync(website+'/'+file));
const evidence=root+'/native-selected-repairs-v5';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const args=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests];
const inputs={at:new Date().toISOString(),website,sourceReceipt:receiptPath,sourceReceiptSha256:sha(read(receiptPath)),queuePath,
 queueSha256:sha(read(queuePath)),triagePath,triageSha256:sha(read(triagePath)),args,
 requestedRootCount:requested.length,executedRootCount:tests.length,reusedUnchangedRoots:requested.filter(file=>alreadyVerified.has(file)),
 reuseIsNotANewRerun:true,inputs:tests.map(path=>({path,sha256:sha(read(website+'/'+path))}))};
fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const output=fs.createWriteStream(evidence+'/child.tap',{flags:'wx'}),errors=fs.createWriteStream(evidence+'/child.stderr',{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:website,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(output);child.stderr.pipe(errors);
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.selectedRepairNativeRun={at:inputs.at,evidence,sourceReceipt:receiptPath,sourceReceiptSha256:inputs.sourceReceiptSha256,pid:child.pid,terminal:false,entryFiles:tests.length,ownerPreviewChanged:false};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({phase:'running',pid:child.pid,entryFiles:tests.length,reusedUnchangedRoots:inputs.reusedUnchangedRoots.length,evidence}));
const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([output,errors].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
const tap=read(evidence+'/child.tap').toString('utf8'),counts={};
for(const key of ['tests','pass','fail','cancelled','skipped','todo'])counts[key]=Number(tap.match(new RegExp('^# '+key+' (\\d+)\\r?$','m'))?.[1]??NaN);
const sourceDrift=source.sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
const terminal={at:new Date().toISOString(),terminal:true,...result,counts,entryFiles:tests.length,sourceDrift,sourceReceipt:receiptPath,
 sourceReceiptSha256:inputs.sourceReceiptSha256,inputsSha256:sha(read(evidence+'/INPUTS.json')),tapSha256:sha(read(evidence+'/child.tap')),
 stderrSha256:sha(read(evidence+'/child.stderr')),ownerPreviewChanged:false,clinicalApproval:false,wholeSuitePassing:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
const finalPointer=json('CURRENT_CHECKPOINT.json');finalPointer.activeWork.selectedRepairNativeRun={...finalPointer.activeWork.selectedRepairNativeRun,...terminal,pid:null};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(finalPointer,null,2)+'\n');
console.log(JSON.stringify(terminal));process.exitCode=result.code===0&&counts.fail===0&&counts.skipped===0&&sourceDrift.length===0?0:1;
