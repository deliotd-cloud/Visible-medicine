import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-coherent-full-regression',driver=json(root+'/DRIVER_STARTED.json');
const runs=driver.website+'/.local/website-test-runs';
const matches=fs.readdirSync(runs).map(name=>runs+'/'+name).filter(path=>fs.existsSync(path+'/started.json')&&json(path+'/started.json').runnerPid===driver.runnerPid);
assert.equal(matches.length,1,'One exact runner output');
const output=matches[0],start=json(output+'/started.json'),manifest=json(output+'/manifest.json');
assert.equal(manifest.sourceSha256,driver.sourceSha256);assert.equal(manifest.entrySha256,driver.entrySha256);assert.equal(manifest.entryCount,1143);
const raw=execFileSync('powershell',['-NoProfile','-Command',"@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object {$_.ProcessId -eq "+driver.driverPid+" -or $_.ProcessId -eq "+driver.runnerPid+" -or $_.ProcessId -eq "+start.testPid+"} | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine) | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true}).trim();
const parsed=raw?JSON.parse(raw):[],processes=Array.isArray(parsed)?parsed:[parsed];
const runner=processes.find(row=>row.ProcessId===driver.runnerPid),test=processes.find(row=>row.ProcessId===start.testPid);
if(runner){assert.equal(runner.ParentProcessId,driver.driverPid);assert(runner.CommandLine.endsWith('scripts/run-website-tests.mjs --run'));}
if(test){assert.equal(test.ParentProcessId,driver.runnerPid);assert(test.CommandLine.includes('--test-concurrency=1'));assert(test.CommandLine.includes(output.replaceAll('/','\\')+'\\child.tap'));}
const terminal=fs.existsSync(root+'/TERMINAL.json')?json(root+'/TERMINAL.json'):null;
assert(runner&&test||terminal,'A missing process without a terminal receipt needs inspection, never an automatic restart');
const log=read(output+'/child.log').toString();
const observation={at:new Date().toISOString(),root,website:driver.website,atlas:driver.atlas,source:driver.source,review:driver.review,output,live:!!runner&&!!test,terminal:!!terminal,processes:processes.map(({ProcessId,ParentProcessId,CreationDate})=>({ProcessId,ParentProcessId,CreationDate})),driverSession:92110,entryCount:1143,namedTestInputs:driver.namedTestInputs,sourceSha256:driver.sourceSha256,observedPassMarkers:(log.match(/^✔ /gm)??[]).length,observedFailureMarkers:(log.match(/^✖ /gm)??[]).length,countsAreTerminal:false,passingClaim:false,terminalReceipt:terminal?root+'/TERMINAL.json':null};
const folder=root+'/observations/'+observation.at.replace(/[:.]/g,'-');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(folder+'/observation.json',JSON.stringify(observation,null,2)+'\n',{flag:'wx'});
const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.activeWork.runningFullAssurance.root,root);
Object.assign(pointer.activeWork.runningFullAssurance,{live:observation.live,session:92110,output,latestObservation:folder+'/observation.json',latestObservationSha256:sha(read(folder+'/observation.json')),observedPassMarkers:observation.observedPassMarkers,observedFailureMarkers:observation.observedFailureMarkers,countsAreTerminal:false});
const repairProof='F:/VisibleMedicine/staging/20261022-arterial-history-main-proof/RESULT.json';
if(fs.existsSync(repairProof)){
 const proof=json(repairProof);assert(proof.exactEntireHarnessInverse&&proof.allFourExpectedOutcomes);
 assert.equal(sha(read(proof.proposal)),proof.proposalSha256);
 pointer.activeWork.pendingArterialPreservationRepair={proposal:proof.proposal,proposalSha256:proof.proposalSha256,proof:repairProof,proofSha256:sha(read(repairProof)),originalHarnessSha256:proof.originalHarnessSha256,entireOriginalHarnessInverse:true,exactFourPureOutcomesVerified:true,actualNativeArterialSemanticRootRerun:false,canonicalInstalled:false,frozenFullRunCandidateEdited:false,latestFilteredGitHubBackupIncludesThisProposal:false,next:'After actual full-regression terminal, batch this source-reviewed inverse-only test repair with other evidenced diagnostics in a new coherent candidate. Preserve every original medical/current/historical/refusal assertion and raw failure; verify affected native roots and source-only recovery before claiming integration.'};
}
if(observation.live){pointer.activeWork.inflight.runningSession=92110;pointer.activeWork.inflight.heavyJobRunning=true;}
pointer.activeWork.updated=observation.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({observation:folder+'/observation.json',live:observation.live,terminal:observation.terminal,entryCount:1143,observedPassMarkers:observation.observedPassMarkers,observedFailureMarkers:observation.observedFailureMarkers,countsAreTerminal:false,passingClaim:false}));
