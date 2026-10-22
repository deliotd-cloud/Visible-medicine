// Main-owned reusable serial native runner. Never installs or changes the preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const planPath=process.argv[2];assert(planPath&&path.isAbsolute(planPath));
const plan=json(planPath),source=json(plan.sourceReceipt),website=source.website;
const kind=plan.kind??'native';assert(['native','types'].includes(kind));
assert.equal(sha(read(plan.sourceReceipt)),plan.sourceReceiptSha256);
assert(website.startsWith('F:/VisibleMedicine/staging/')&&website.endsWith('/website'));
assert(plan.evidence.startsWith('F:/VisibleMedicine/staging/')&&!fs.existsSync(plan.evidence));
assert.equal(new Set(plan.tests).size,plan.tests.length);assert(kind==='types'?plan.tests.length===0:plan.tests.length>0&&plan.tests.length<=200);
for(const row of source.sourceRows)assert.equal(sha(read(website+'/'+row.path)),row.sha256,'Native preflight: '+row.path);
for(const relative of plan.tests){assert(/^tests\/[a-zA-Z0-9-]+\.test\.(?:mjs|ts)$/.test(relative));assert(source.sourceRows.some(row=>row.path===relative));}
const pin=json(website+'/tests/fixtures/current-atlas-delivery.json');
const env=nativeAtlasEnvironment({atlas:'F:/VisibleMedicine/atlas',revision:pin.source,tree:pin.sourceTree});
const args=kind==='types'?['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']:['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...plan.tests];
const evidence=plan.evidence;fs.mkdirSync(evidence);
const inputs={at:new Date().toISOString(),kind,sourceReceipt:plan.sourceReceipt,sourceReceiptSha256:plan.sourceReceiptSha256,planPath,planSha256:sha(read(planPath)),args,
 tests:plan.tests.map(path=>({path,sha256:sha(read(website+'/'+path))})),scope:plan.scope,ownerPreviewChanged:false};
fs.writeFileSync(evidence+'/INPUTS.json',JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});
const out=fs.createWriteStream(evidence+'/child.tap',{flags:'wx'}),err=fs.createWriteStream(evidence+'/child.stderr',{flags:'wx'});
const child=spawn(process.execPath,args,{cwd:website,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
const key=kind==='types'?'typeRun':'nativeRun';
const pointer=json('CURRENT_CHECKPOINT.json');pointer.activeWork.current[key]={at:inputs.at,kind,evidence,sourceReceipt:plan.sourceReceipt,sourceReceiptSha256:plan.sourceReceiptSha256,pid:child.pid,terminal:false,entryFiles:plan.tests.length};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');console.log(JSON.stringify({phase:'running',pid:child.pid,evidence,entryFiles:plan.tests.length}));
const result=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
const tap=read(evidence+'/child.tap').toString(),counts=kind==='native'?{}:null;
if(counts)for(const name of ['tests','pass','fail','cancelled','skipped','todo'])counts[name]=Number(tap.match(new RegExp('^# '+name+' (\\d+)\\r?$','m'))?.[1]??NaN);
const sourceDrift=source.sourceRows.filter(row=>sha(read(website+'/'+row.path))!==row.sha256).map(row=>row.path);
const terminal={at:new Date().toISOString(),kind,terminal:true,...result,counts,entryFiles:plan.tests.length,sourceDrift,
 sourceReceipt:plan.sourceReceipt,sourceReceiptSha256:plan.sourceReceiptSha256,inputsSha256:sha(read(evidence+'/INPUTS.json')),
 tapSha256:sha(read(evidence+'/child.tap')),stderrSha256:sha(read(evidence+'/child.stderr')),ownerPreviewChanged:false,wholeSuitePassing:false,clinicalApproval:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
const latest=json('CURRENT_CHECKPOINT.json');Object.assign(latest.activeWork.current[key],terminal,{pid:null,result:evidence+'/TERMINAL.json'});
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(latest,null,2)+'\n');console.log(JSON.stringify(terminal));
process.exitCode=result.code===0&&(kind==='types'||counts.tests>0&&counts.fail===0&&counts.skipped===0&&counts.cancelled===0)&&sourceDrift.length===0?0:1;
