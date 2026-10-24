import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash,json} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261024-upper-vascular-reasoning';
const evidence='F:/VisibleMedicine/staging/20261024-adjacent-native-execution/runs/renal-latest-1/RUNS.json';
const runs=json(evidence);const rows=runs.rows;assert(Array.isArray(rows));
for(const r of rows){assert(r.finishedAt);assert.equal(typeof r.exitCode,'number');assert.equal(hash(r.stdout),r.stdoutSha256);assert.equal(hash(r.stderr),r.stderrSha256);}
const command="@(Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" | Where-Object { $_.CommandLine -like '*20261024-adjacent-native-execution*' -or $_.CommandLine -like '*run-adjacent*' } | Select-Object ProcessId,ParentProcessId,CommandLine) | ConvertTo-Json -Depth 3 -Compress";
const processes=execFileSync('powershell',['-NoProfile','-Command',command],{encoding:'utf8',windowsHide:true}).trim();
assert(!processes||processes==='[]','Specialist validation child is still live');
assert.equal(json('CURRENT_CHECKPOINT.json').activeWork.current.activeExecutionSessions.length,0);
fs.writeFileSync(stage+'/VALIDATION_SLOT_ACQUIRED.json',JSON.stringify({at:new Date().toISOString(),authority:'Release Reliability explicit yield at cursor09786c67-a526-4f3e-9592-4f73d6c47d39:47 after terminal renal batch; no new child until main release.',evidence,evidenceSha256:hash(evidence),terminalRuns:rows.map(r=>({root:r.root,pid:r.pid,exitCode:r.exitCode,finishedAt:r.finishedAt})),matchingLiveProcesses:[],previewChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({slot:'main upper-vascular checks',terminalRoots:rows.length,previewChanged:false}));
