// Record partial diagnostics without treating the still-running suite as terminal.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const stage='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance',p=json('CURRENT_CHECKPOINT.json'),run=p.activeWork.current.completeReleaseRun;
assert.equal(p.goal.status,'active');assert.equal(p.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const alive=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Get-CimInstance Win32_Process -Filter 'ProcessId=${run.runnerPid} OR ProcessId=${run.testPid}' | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress`],{encoding:'utf8',windowsHide:true}));
assert.equal(alive.length,2);assert(alive.every(row=>row.Name==='node.exe'));assert(alive.some(row=>row.ProcessId===run.testPid&&row.ParentProcessId===run.runnerPid));
const tap=read(run.stockEvidence+'/child.tap').toString();assert(tap.includes('not ok 74 - original arterial Website contract'));assert(tap.includes('not ok 84 - three wrappers preserve'));
const observed={at:new Date().toISOString(),classification:'progress-and-verified-live-wait',terminal:false,sourceReceipt:run.sourceReceipt,sourceReceiptSha256:run.sourceReceiptSha256,liveProcesses:alive,
 diagnostics:[{id:74,path:'tests/atlas-arterial-evidence-limits.test.mjs',reason:'The live current-source assertion still expects pre-neck6d7 rather than current2381.',owner:'/root/complete_arterial_followup_1022',stage:'F:/VisibleMedicine/staging/20261022-complete-arterial-followup'},
 {id:84,path:'tests/atlas-body-learning-component.test.mjs',reason:'The complete historical wrapper inverse omits the later sign-in/access-denied session-reset guard.',owner:'/root/complete_wrapper_followup_1022',stage:'F:/VisibleMedicine/staging/20261022-complete-body-wrapper-followup'}],
 workers:{modelRequested:'gpt-6-sol',reasoningEffortRequested:'medium',freshContexts:true,maxWorkers:2,noNestedDelegation:true,exclusiveNewStages:true,nativeJobsForbidden:true},
 terminalTotalsKnown:false,sourceChanged:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 next:'Do not restart or mutate the active1176-entry suite. Main review these bounded proposals when ready; defer their native acceptance/integration until the full terminal result. Preserve all failures and original test assertions, then prioritize actual product/security defects above fixture repairs.'};
const target=stage+'/complete-release-run/PARTIAL_FOLLOWUPS.json';assert(!fs.existsSync(target));fs.writeFileSync(target,JSON.stringify(observed,null,2)+'\n',{flag:'wx'});
p.activeWork.current.completeReleaseRun.partialDiagnostics={path:target,sha256:sha(read(target)),terminal:false,failuresObserved:2};p.activeWork.current.pendingWorkers=observed.diagnostics.map(r=>({owner:r.owner,stage:r.stage,path:r.path,nativeVerificationPermitted:false}));p.activeWork.current.next=observed.next;p.activeWork.current.beforeFurtherWork=observed.next;p.activeWork.updated=observed.at;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify({receipt:target,sha256:sha(read(target)),verifiedLiveProcesses:alive.length,partialOnly:true,ownerPreviewChanged:false}));
