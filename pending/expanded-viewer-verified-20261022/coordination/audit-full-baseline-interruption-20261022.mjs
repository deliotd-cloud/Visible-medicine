import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-complete-current-website';
assert(!fs.existsSync(root+'/INTERRUPTION_AUDIT.json'));
const intent=json(root+'/INTENTIONAL_REPRIORITIZATION.json'),prepared=json(root+'/PREPARED.json');
const status=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',"[pscustomobject]@{remaining=@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\"|Where-Object {$_.ProcessId -in @(289932,301348,288680) -or $_.CommandLine -match '20261021-body-learning-website-candidate[\\/]+website'}|Select-Object ProcessId,ParentProcessId,CommandLine);preview=(Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess}|ConvertTo-Json -Compress -Depth 4"],{encoding:'utf8',windowsHide:true}));
assert.equal(status.remaining.length,0,'Do not start a build while an old test-tree process remains');assert.equal(status.preview,297128);
for(const row of prepared.sourceFiles){assert.equal(sha(read(prepared.candidate+'/'+row.path)),row.sha256,row.path);assert.equal(sha(read(prepared.canonical+'/'+row.path)),row.sha256,'Canonical '+row.path);}
const log=read(intent.output+'/child.log').toString();
const files=['manifest.json','started.json','child.log','child.tap'].map(path=>({path,bytes:read(intent.output+'/'+path).length,sha256:sha(read(intent.output+'/'+path))}));
const audit={at:new Date().toISOString(),phase:'Intentionally interrupted own baseline attempt to prioritize the source-prepared UI integration',
 session:21743,authoritativeExecExitObserved:1,processCheck:status,intent:root+'/INTENTIONAL_REPRIORITIZATION.json',intentSha256:sha(read(root+'/INTENTIONAL_REPRIORITIZATION.json')),
 source:prepared.source,review:prepared.review,entryCount:1131,namedInputs:5564,allNamedInputsAndCanonicalCounterpartsUnchanged:true,sourceSha256:prepared.sourceSha256,output:intent.output,files,
 officialTerminalExists:fs.existsSync(root+'/TERMINAL.json'),officialStockReceiptExists:fs.existsSync(intent.output+'/receipt.json'),
 observedPartialMarkers:{pass:(log.match(/^✔ /gm)??[]).length,fail:(log.match(/^✖ /gm)??[]).length},countsAreComplete:false,suiteCompleted:false,passingClaim:false,unskippedPassingClaim:false,
 full71AndEightIdeasPreserved:true,original136And87And144BaselinesPreserved:true,newTestExclusions:0,
 next:'Build and validate the already prepared isolated UI integration with one heavy job at a time. Run a fresh complete regression against the coherent integrated source as a separate required milestone; no passing, full coverage or release claim from this interrupted attempt.'};
fs.writeFileSync(root+'/INTERRUPTION_AUDIT.json',JSON.stringify(audit,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');
pointer.activeWork.runningFullAssurance={...pointer.activeWork.runningFullAssurance,at:audit.at,live:false,terminal:true,interrupted:true,suiteCompleted:false,passingClaim:false,countsAreTerminal:false,interruptionAudit:root+'/INTERRUPTION_AUDIT.json',interruptionAuditSha256:sha(read(root+'/INTERRUPTION_AUDIT.json')),reason:intent.reason,next:audit.next};
Object.assign(pointer.activeWork.inflight,{heavyJobRunning:false,runningSession:null,runningDriver:null,runningStage:null});
pointer.activeWork.next=audit.next;pointer.activeWork.inflight.next=audit.next;pointer.activeWork.updated=audit.at;pointer.updatedAt=audit.at;
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({audit:root+'/INTERRUPTION_AUDIT.json',sha256:sha(read(root+'/INTERRUPTION_AUDIT.json')),oldTestTreeGone:true,preview:status.preview,all5564InputsUnchanged:true,partialMarkers:audit.observedPartialMarkers,passingClaim:false}));
