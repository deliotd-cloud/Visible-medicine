import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='F:/VisibleMedicine/staging/20261024-pancreatic-us-release-diagnostic';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const driver=json(root+'/run/STARTED.json'),runs=driver.website+'/.local/website-test-runs';
const matches=fs.readdirSync(runs).map(n=>runs+'/'+n).filter(p=>fs.existsSync(p+'/started.json')&&json(p+'/started.json').runnerPid===driver.runnerPid);
assert.equal(matches.length,1);const output=matches[0],start=json(output+'/started.json');
const pids=[driver.driverPid,driver.runnerPid,start.testPid];
const command='@(Get-CimInstance Win32_Process | Where-Object { '+pids.map(pid=>'$_.ProcessId -eq '+pid).join(' -or ')+' } | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine) | ConvertTo-Json -Compress';
const raw=execFileSync('powershell',['-NoProfile','-Command',command],{encoding:'utf8',windowsHide:true}).trim();
const rows=raw?JSON.parse(raw):[],processes=Array.isArray(rows)?rows:[rows];
const runner=processes.find(r=>r.ProcessId===driver.runnerPid),test=processes.find(r=>r.ProcessId===start.testPid);
if(runner){assert.equal(runner.ParentProcessId,driver.driverPid);assert(runner.CommandLine.includes('scripts/run-website-tests.mjs --run'));}
if(test){assert.equal(test.ParentProcessId,driver.runnerPid);assert(test.CommandLine.includes('--test-concurrency=1'));}
const terminalPath=root+'/TERMINAL.json',terminal=fs.existsSync(terminalPath)?json(terminalPath):null;
assert(terminal||(runner&&test),'Missing process without terminal evidence; inspect, do not restart');
const manifest=json(output+'/manifest.json');assert.equal(manifest.entryCount,1288);
const live=!terminal&&!!runner&&!!test;
const observation={at:new Date().toISOString(),root,output,session:75963,live,terminal:!!terminal,processes:processes.map(({ProcessId,ParentProcessId,CreationDate})=>({ProcessId,ParentProcessId,CreationDate})),entryCount:manifest.entryCount,sourceSha256:driver.sourceSha256,previewChanged:false,terminalReceipt:terminal?terminalPath:null};
const folder=root+'/observations/'+observation.at.replace(/[:.]/g,'-');fs.mkdirSync(folder,{recursive:true});
fs.writeFileSync(folder+'/observation.json',JSON.stringify(observation,null,2)+'\n',{flag:'wx'});
const pointerPath='CURRENT_CHECKPOINT.json',before=read(pointerPath),pointer=JSON.parse(before);
if(!fs.existsSync(root+'/CURRENT_CHECKPOINT_BEFORE.json'))fs.writeFileSync(root+'/CURRENT_CHECKPOINT_BEFORE.json',before,{flag:'wx'});
const current=pointer.activeWork.current;
current.activeExecutionSessions=live?[{session:75963,driverPid:driver.driverPid,runnerPid:driver.runnerPid,testPid:start.testPid,root,output}]:[];
current.runningExactReleaseDiagnostic={...current.runningExactReleaseDiagnostic,root,sourceReceipt:driver.sourcePath,sourceReceiptSha256:driver.sourceSha256,entryCount:1288,live,terminal:!!terminal,latestObservation:folder+'/observation.json',latestObservationSha256:sha(read(folder+'/observation.json')),terminalReceipt:terminal?terminalPath:null,passingClaim:terminal?.passingClaim??false};
// A live observation refresh must not discard the durable recovery reference.
const recovery='F:/VisibleMedicine/recovery/checkpoints/20261024-current-release-diagnostic-start/checkpoint.json';
if(fs.existsSync(recovery)){
 const bytes=read(recovery);assert.equal(sha(bytes),'9adba5af906caeaff27da12e887cbcc6e7be19bc7c51a924bbf530b6bd809307');
 const saved=JSON.parse(bytes);assert.equal(saved.sourceSha256,driver.sourceSha256);assert.equal(saved.run.root,root);
 Object.assign(current.runningExactReleaseDiagnostic,{checkpoint:recovery,checkpointSha256:sha(bytes),proposalContext:'Five static local proposal groups; unapplied and untested. Exact raw evidence preserved; see the current terminal flag for run state.'});
}
pointer.activeWork.updated=observation.at;
const bytes=Buffer.from(JSON.stringify(pointer,null,2)+'\n');assert(bytes.length<65536,'Compact index limit');fs.writeFileSync(pointerPath,bytes);
console.log(JSON.stringify({observation:folder+'/observation.json',live,terminal:!!terminal,indexBytes:bytes.length,output,testPid:start.testPid}));
