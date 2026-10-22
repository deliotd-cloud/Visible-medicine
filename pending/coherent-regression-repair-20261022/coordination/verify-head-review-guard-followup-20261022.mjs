import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-reviewed-regression-runtime-linking';
const sourceReceipt=root+'/PRODUCT_SOURCE_V4.json',source=json(sourceReceipt),website=source.website;
const evidence=root+'/native-head-guard';assert(!fs.existsSync(evidence));
const tests=['head-cerebellar-review.test.ts','head-deep-grey-review.test.ts','head-hippocampal-clinical.test.ts','head-lobar-review.test.ts','head-ventricular-review.test.ts',
 'head-teaching-review-notes.test.ts','head-review-navigation-guards.test.ts','clinical-review-navigation-guard.test.ts'].map(name=>'tests/'+name);
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256);
fs.mkdirSync(evidence);const args=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests];
fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify({at:new Date().toISOString(),website,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),args,
 inputs:tests.map(path=>({path,sha256:sha(read(website+'/'+path))}))},null,2)+'\n',{flag:'wx'});
const output=fs.createWriteStream(evidence+'/child.tap',{flags:'wx'}),errors=fs.createWriteStream(evidence+'/child.stderr',{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:website,env:{...process.env,GOMAXPROCS:'2',RAYON_NUM_THREADS:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
child.stdout.pipe(output);child.stderr.pipe(errors);
console.log(JSON.stringify({phase:'running',pid:child.pid,entryFiles:tests.length,evidence,ownerPreviewChanged:false}));
const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([output,errors].map(stream=>new Promise(resolve=>stream.closed?resolve():stream.once('close',resolve))));
const tap=read(evidence+'/child.tap').toString('utf8'),counts={};
for(const key of ['tests','pass','fail','cancelled','skipped','todo'])counts[key]=Number(tap.match(new RegExp('^# '+key+' (\\d+)\\r?$','m'))?.[1]??NaN);
const sourceDrift=source.sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
const terminal={at:new Date().toISOString(),terminal:true,...result,counts,entryFiles:tests.length,sourceDrift,sourceReceipt,sourceReceiptSha256:sha(read(sourceReceipt)),
 tapSha256:sha(read(evidence+'/child.tap')),stderrSha256:sha(read(evidence+'/child.stderr')),productionBytesChanged:0,ownerPreviewChanged:false,clinicalApproval:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(terminal));
process.exitCode=result.code===0&&counts.fail===0&&counts.skipped===0&&sourceDrift.length===0?0:1;
