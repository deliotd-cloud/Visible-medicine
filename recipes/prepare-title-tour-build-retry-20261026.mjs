import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';

const stage='F:/VisibleMedicine/staging/20261025-regional-title-native';
const sourceFile=stage+'/SOURCE_CANDIDATE.json', failed=stage+'/checks/build-low-memory-attempt-1';
assert.equal(hash(sourceFile),'05215efe28eba7f4381fd87daf9212604a123fa1b2b0b810658232743573c1d6');
const source=json(sourceFile), result=json(failed+'/RESULT.json');
assert.equal(hash(failed+'/RESULT.json'),'5fa2ea53f3f4107f0a597bad20c9acaf9847bcd9287e7177890931150af3ce63');
assert(!result.passing && result.run.process.terminalObserved && !result.run.process.interrupted && result.run.process.exitCode===1);
const observations=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"ConvertTo-Json -InputObject @(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -in @(80012,80340,78268,55956,72024,76540) } | Select-Object ProcessId,@{Name='started';Expression={$_.CreationDate.ToUniversalTime().ToString('o')}}) -Compress"],{encoding:'utf8',windowsHide:true}).trim());
// A PID can be reused after terminal. Such a later process is neither owned nor stopped.
assert(observations.every(p=>Date.parse(p.started)>Date.parse(result.run.process.at)));
for(const r of [...source.sourceRows,...source.publicRows])assert.equal(hash(source.atlas+'/'+r.path),r.sha256,r.path);
const from=path.resolve(source.atlas,'dist'),to=path.resolve(failed,'PARTIAL_DIST'),root=path.resolve(stage);
assert.equal(fs.realpathSync(from).toLowerCase(),from.toLowerCase());
assert(fs.lstatSync(from).isDirectory()&&!fs.lstatSync(from).isSymbolicLink());
assert(from.startsWith(root+path.sep)&&to.startsWith(root+path.sep)&&!fs.existsSync(to));
fs.renameSync(from,to);
const samples=fs.readFileSync(failed+'/owned-processes.jsonl','utf8').trim().split('\n').map(x=>JSON.parse(x));
const memory=fs.readFileSync(failed+'/memory.jsonl','utf8').trim().split('\n').map(x=>JSON.parse(x));
const note={at:new Date().toISOString(),failed:{path:failed+'/RESULT.json',sha256:hash(failed+'/RESULT.json')},actualTerminal:result.run.process,ownedProcessesClosed:true,lastStage:'SSR transforming',childExitCode:3221226505,sampledPeakAggregatePrivateMiB:Math.max(...samples.map(s=>s.processes.reduce((n,p)=>n+p.privateBytes,0)/1048576)),sampledMinimumFreeMiB:Math.min(...memory.map(m=>m.availableMiB)),cause:'Unclassified Windows fail-fast. Sampled aggregate approaches3072MiB ceiling; allocation-cap explanation plausible, not proved.',partialBuildPreserved:to,retry:'Keep1024MiB V8 heap; increase aggregate3072→4096MiB and admission5120→6144MiB. Same2048MiB system reserve/floor,90percent commit ceiling, complete stock npm build/hooks, source and dependencies.',applicationSourceChanged:false,ownerPreviewChanged:false};
fs.writeFileSync(stage+'/BUILD_RETRY_RATIONALE.json',JSON.stringify(note,null,2)+'\n',{flag:'wx'});
let driver=fs.readFileSync('build-title-tour-native-20261025.mjs','utf8');
for(const[a,b]of [['build-low-memory-attempt-1','build-low-memory-attempt-2'],['build-stock-low-memory.mjs','build-stock-low-memory-v2.mjs'],['aggregate:3072,minimum:5120','aggregate:4096,minimum:6144']]){assert(driver.includes(a),a);driver=driver.replaceAll(a,b);}
fs.writeFileSync('build-title-tour-native-v2-20261026.mjs',driver,{flag:'wx'});
execFileSync(process.execPath,['--check','build-title-tour-native-v2-20261026.mjs'],{windowsHide:true});
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current;
assert(current.activeExecutionSessions.every(x=>x.sessionId===1387));
current.activeExecutionSessions=[];
current.pendingTitleTourNative={...(current.pendingTitleTourNative||{}),source:{path:sourceFile,sha256:hash(sourceFile)},head:source.head,phase:'source/types/consumers verified; failed stock build retained; bounded4096MiB job retry prepared',failedBuild:{path:failed+'/RESULT.json',sha256:hash(failed+'/RESULT.json')},retryRationale:{path:stage+'/BUILD_RETRY_RATIONALE.json',sha256:hash(stage+'/BUILD_RETRY_RATIONALE.json')},installed:false,ownerPreviewChanged:false};
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({prepared:true,source:hash(sourceFile),peakMiB:note.sampledPeakAggregatePrivateMiB,heap:1024,job:4096,admission:6144,systemReserve:2048,failedPartialPreserved:to,ownedProcessesClosed:true}));
