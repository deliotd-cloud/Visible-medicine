import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-complete-current-website';
const started=json(root+'/DRIVER_STARTED.json'),prepared=json(root+'/PREPARED.json');
assert.equal(started.driverPid,289932);assert.equal(started.runnerPid,301348);
assert(!fs.existsSync(root+'/INTENTIONAL_REPRIORITIZATION.json'));
const processes=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',"@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object {$_.ProcessId -eq 289932 -or $_.ProcessId -eq 301348 -or $_.ProcessId -eq 288680} | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine) | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}));
assert.equal(processes.length,3);const runner=processes.find(row=>row.ProcessId===301348),test=processes.find(row=>row.ProcessId===288680);
assert.equal(runner.ParentProcessId,289932);assert.equal(runner.CommandLine,'"C:\\Program Files\\nodejs\\node.exe" scripts/run-website-tests.mjs --run');
assert.equal(test.ParentProcessId,301348);assert(test.CommandLine.includes('2026-10-21T23-25-35-448Z-d9026024-8b29-4efa-aad1-c9dd4e2fe13e\\child.tap'));
const output=prepared.candidate+'/.local/website-test-runs/2026-10-21T23-25-35-448Z-d9026024-8b29-4efa-aad1-c9dd4e2fe13e';
const log=read(output+'/child.log').toString();
const intent={at:new Date().toISOString(),phase:'before intentional owner-priority rescheduling',session:21743,processes,
 reason:'Owner objective prioritizes integrated UI. Inspection confirms Review viewer is a complete multi-system Vite/Tailwind renderer build, not a tiny isolated bundle. Keep one heavy job: stop this incomplete old-baseline attempt deliberately, preserve every failure/input/log and finish the already source-prepared UI build and focused safety gates first. A fresh complete regression against the resulting coherent source remains a release-essential requirement. This is not a timeout restart, passing claim or exclusion of failures.',
 candidate:prepared.candidate,source:prepared.source,review:prepared.review,sourceSha256:prepared.sourceSha256,entryCount:1131,namedInputs:5564,output,
 partialMarkers:{pass:(log.match(/^✔ /gm)??[]).length,fail:(log.match(/^✖ /gm)??[]).length},countsAreComplete:false,wholeSuitePassing:false,original136And87And144BaselinesPreserved:true,all71AndEightIdeasPreserved:true,
 normalPreviewOrOwnerFormsToStop:false,desktopPacsToTouch:false,canonicalOrFrozenSourceToChange:false};
fs.writeFileSync(root+'/INTENTIONAL_REPRIORITIZATION.json',JSON.stringify(intent,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({intent:root+'/INTENTIONAL_REPRIORITIZATION.json',sha256:sha(read(root+'/INTENTIONAL_REPRIORITIZATION.json')),session:21743,confirmedLive:true,partialMarkers:intent.partialMarkers,normalPreviewUntouched:true}));
