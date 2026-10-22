import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
import {nativeAtlasEnvironment} from './native-atlas-environment-20261022.mjs';
const root='F:/VisibleMedicine/staging/20261022-release-diagnostic-successor',receipt=root+'/SOURCE.json',source=json(receipt),composition=json(root+'/COMPOSED.json');
assert.equal(sha(read(receipt)),composition.sourceReceiptSha256);assert.equal(sha(read(receipt)),'65d2838d513a79ecbf5f9a7eb085354c34b6ebfe0d584c445922eda8e2574522');
const evidence=root+'/verification';assert(!fs.existsSync(evidence));fs.mkdirSync(evidence);
const pwsh='C:/Users/delio/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe';
const observe=()=>JSON.parse(execFileSync(pwsh,['-NoLogo','-NoProfile','-NonInteractive','-Command',"$m=Get-CimInstance Win32_OperatingSystem; [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');freePhysicalKiB=$m.FreePhysicalMemory;freeCommitKiB=$m.FreeVirtualMemory;port3000=@(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess)} | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
const observation=observe();fs.writeFileSync(evidence+'/PREFLIGHT.json',JSON.stringify(observation,null,2)+'\n',{flag:'wx'});
assert(observation.freeCommitKiB>=8*1024*1024,'Defer native work while Windows commit headroom is low');
assert.equal(fs.realpathSync(root+'/atlas'),fs.realpathSync(source.atlas));
const env=nativeAtlasEnvironment({atlas:source.atlas,revision:source.atlasHead,tree:source.atlasTree});
const tests=[...composition.tests];assert.equal(tests.length,13);const commands=[['native',['--test','--experimental-strip-types','--test-concurrency=1','--test-reporter=tap',...tests]],['types',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']]],results=[];
const pointer='C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/CURRENT_CHECKPOINT.json';
fs.copyFileSync(pointer,evidence+'/CURRENT_BEFORE.json',fs.constants.COPYFILE_EXCL);
function update(state){const p=json(pointer),current=p.activeWork.current;current.pendingReleaseDiagnosticSuccessor={sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,changedTestRoots:5,productChanged:false,installed:false,evidence,...state};current.activeExecutionSessions=state.live?[{role:'focused-release-diagnostic-successor',pid:state.pid,evidence,ownerPreviewChanged:false}]:[];current.completeReleaseRun.next='Interrupted without a terminal receipt; original logs and all6417 named files audited. Do not infer final totals or whole-suite acceptance.';current.completeReleaseRun.resourceObservation.fullRunLive=false;current.completeReleaseFollowups.fullReleaseRun.verifiedLive=false;current.next=state.live?'Run the13 exact affected native roots and full types on the isolated successor. This is not the whole1176-entry release gate; no held-preview install/restart.':state.next;p.activeWork.updated=new Date().toISOString();fs.writeFileSync(pointer,JSON.stringify(p,null,2)+'\n');assert(fs.statSync(pointer).size<65536);}
for(const[label,args]of commands){
 const out=fs.createWriteStream(evidence+'/'+label+'.stdout.log',{flags:'wx'}),err=fs.createWriteStream(evidence+'/'+label+'.stderr.log',{flags:'wx'});
 const child=spawn(process.execPath,args,{cwd:source.website,env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(err);
 fs.writeFileSync(evidence+'/'+label+'.STARTED.json',JSON.stringify({at:new Date().toISOString(),pid:child.pid,args,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt))},null,2)+'\n',{flag:'wx'});update({live:true,label,pid:child.pid});console.log(JSON.stringify({label,pid:child.pid,roots:tests.length}));
 const outcome=await new Promise(resolve=>{child.once('error',e=>resolve({code:null,error:String(e)}));child.once('close',(code,signal)=>resolve({code,signal}));});await Promise.all([out,err].map(s=>new Promise(resolve=>s.closed?resolve():s.once('close',resolve))));
 const text=read(out.path).toString(),counts=Object.fromEntries([...text.matchAll(/^# (tests|pass|fail|cancelled|skipped|todo) (\d+)\r?$/gm)].map(m=>[m[1],+m[2]]));
 const result={label,args,...outcome,counts,failed:[...text.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]),stdoutSha256:sha(read(out.path)),stderrSha256:sha(read(err.path))};results.push(result);fs.writeFileSync(evidence+'/'+label+'.TERMINAL.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({label,...outcome,counts,failed:result.failed}));if(outcome.code!==0)break;
}
const slab=Buffer.alloc(65536);function hash(file){const h=createHash('sha256'),fd=fs.openSync(file,'r');try{let n;while((n=fs.readSync(fd,slab,0,slab.length,null)))h.update(slab.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
const sourceDrift=source.sourceRows.filter(r=>hash(source.website+'/'+r.path)!==r.sha256).map(r=>r.path),previous=json(source.previousSource),previousSourceDrift=previous.sourceRows.filter(r=>hash(previous.website+'/'+r.path)!==r.sha256).map(r=>r.path);
const terminal={at:new Date().toISOString(),terminal:true,code:results.length===commands.length&&results.every(r=>r.code===0)&&!sourceDrift.length&&!previousSourceDrift.length?0:1,sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),roots:tests,commands:results,sourceDrift,previousSourceDrift,finalObservation:observe(),productChanged:false,wholeSuitePassing:false,newBuildOrBrowserAcceptance:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.writeFileSync(evidence+'/TERMINAL.json',JSON.stringify(terminal,null,2)+'\n',{flag:'wx'});
update({live:false,terminal:evidence+'/TERMINAL.json',terminalSha256:sha(read(evidence+'/TERMINAL.json')),nativeAcceptance:terminal.code===0,next:terminal.code===0?'Checkpoint the focused verified test-only successor. Preserve interrupted full-run evidence; the complete applicable release gate is still outstanding. Continue safe isolated roadmap work without normal preview cutover.':'Inspect the actual focused diagnostic; preserve failures without weakening any original resource-refusal tests. Continue safe isolated work; no normal preview cutover.'});
fs.copyFileSync(new URL(import.meta.url),evidence+'/verify-release-diagnostic-successor-20261022.mjs',fs.constants.COPYFILE_EXCL);
console.log(JSON.stringify({receipt:evidence+'/TERMINAL.json',code:terminal.code,sourceDrift,previousSourceDrift}));process.exitCode=terminal.code;
