import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-corpus-cranio-assurance',receipt=root+'/SOURCE.json',source=json(receipt),previous=json(source.previousSource),outdir=root+'/native';
assert(!fs.existsSync(outdir));fs.mkdirSync(outdir);
const tests=['tests/current-atlas-delivery.test.mjs','tests/corpus-xray-v2-current-delivery.test.mjs','tests/craniofacial-ct-current-delivery.test.mjs','tests/corpus-cranio-role-preservation.test.mjs'];
const args=['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests];
const env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});
const commands=[['source-only-proof',['F:/VisibleMedicine/staging/20261022-corpus-cranio-release-roles/source-only-proof.mjs']],['native',args]],results=[];
for(const[label,command]of commands){
 const stdout=fs.createWriteStream(outdir+'/'+label+'.stdout.log',{flags:'wx'}),stderr=fs.createWriteStream(outdir+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,command,{cwd:source.website,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stdout);child.stderr.pipe(stderr);
 console.log(JSON.stringify({label,pid:child.pid}));
 const outcome=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});
 await Promise.all([stdout,stderr].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const tap=read(stdout.path).toString(),counts=Object.fromEntries([...tap.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
 const result={label,args:command,...outcome,counts,failed:[...tap.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]),stdoutSha256:sha(read(stdout.path)),stderrSha256:sha(read(stderr.path))};results.push(result);
 fs.writeFileSync(outdir+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({label,...outcome,counts,failed:result.failed}));if(outcome.code!==0)break;
}
const drift=source.sourceRows.filter(r=>sha(read(source.website+'/'+r.path))!==r.sha256).map(r=>r.path),previousDrift=previous.sourceRows.filter(r=>sha(read(previous.website+'/'+r.path))!==r.sha256).map(r=>r.path);
const code=results.length===commands.length&&results.every(r=>r.code===0)&&!drift.length&&!previousDrift.length?0:1;
const terminal={at:new Date().toISOString(),terminal:true,code,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),commands:results,sourceDrift:drift,previousSourceDrift:previousDrift,
 allProductBytesUnchanged:true,typesAndBuildNotRerun:true,priorProductBuildReceipt:'F:/VisibleMedicine/staging/20261022-head-practice-exit-candidate/verification-v2/TERMINAL.json',
 wholeSuitePassing:false,newBrowserAcceptance:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(outdir+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({receipt:outdir+'/TERMINAL.json',code,sourceDrift:drift}));process.exitCode=code;
