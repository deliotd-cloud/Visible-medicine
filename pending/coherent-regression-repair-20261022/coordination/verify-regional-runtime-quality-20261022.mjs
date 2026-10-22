import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const mode=process.argv[2],version=process.argv[3]??'V2';
assert(['types','build','review'].includes(mode));assert(['V2','V3','V5'].includes(version));
const receiptPath=root+'/PRODUCT_SOURCE_'+version+'.json',receipt=json(receiptPath),website=receipt.website;
const evidence=root+'/quality-'+mode+'-'+version.toLowerCase();assert(!fs.existsSync(evidence));
for(const row of receipt.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256);
const commands={types:['node_modules/typescript/bin/tsc','--noEmit','--incremental','false'],
 build:['node_modules/vinext/dist/cli.js','build'],review:['scripts/verify-clinical-review.mjs']};
const args=commands[mode];assert(fs.existsSync(website+'/'+args[0]));
const steps=mode==='build'?[
 ['scripts/verify-clinical-review.mjs'],['scripts/atlas-model-inventory.mjs','--check'],
 ['--experimental-strip-types','scripts/verify-atlas-delivery-policy.mjs'],['scripts/lecture-body-catalog.mjs','--check'],args,
]:[args];
fs.mkdirSync(evidence);const output=fs.createWriteStream(evidence+'/stdout.log',{flags:'wx'}),errors=fs.createWriteStream(evidence+'/stderr.log',{flags:'wx'});
let result;const completedSteps=[];
for(const command of steps){
 const child=spawn(process.execPath,command,{cwd:website,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout.pipe(output,{end:false});child.stderr.pipe(errors,{end:false});console.log(JSON.stringify({phase:'running',mode,version,pid:child.pid,evidence,command}));
 result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 completedSteps.push({command,...result});if(result.code!==0)break;
}
output.end();errors.end();
await Promise.all([output,errors].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
const drift=receipt.sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
const terminal={at:new Date().toISOString(),terminal:true,mode,version,args,completedSteps,...result,sourceDrift:drift,receiptPath,receiptSha256:sha(read(receiptPath)),
 stdoutSha256:sha(read(evidence+'/stdout.log')),stderrSha256:sha(read(evidence+'/stderr.log')),ownerPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(terminal));
process.exitCode=result.code===0&&drift.length===0?0:1;
