import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,json} from 'file:///C:/Users/delio/Documents/Codex/2026-09-05/referenced-chatgpt-conversation-this-is-an-2/bounded-source-hash-20261026.mjs';
import {saveIndex} from 'file:///F:/VisibleMedicine/staging/20261028-head-search-comparison-recipes/state.mjs';
const root='G:/VisibleMedicine-temp/staging/20261031-release-partition10-final';
const cp='F:/VisibleMedicine/recovery/checkpoints/20261031-release-partition-ten-repair';
const index=json('CURRENT_CHECKPOINT.json'),current=index.activeWork.current,source=json(root+'/SOURCE.json'),at=new Date().toISOString();
assert.equal(current.latestCheckpoint.path,cp+'/checkpoint.json');
const sourceRef={path:root+'/SOURCE.json',sha256:hash(root+'/SOURCE.json')};assert.equal(sourceRef.sha256,'cf3faf8f249686f28885eafe388e1d834608f09e9fd59bda49d133963d19c7a2');
const started=json(root+'/focused/STARTED.json');
const resultPath=root+'/FOCUSED_RESULT.json';let record;
if(fs.existsSync(resultPath)){
 const result=json(resultPath);record={at,source:sourceRef,result:{path:resultPath,sha256:hash(resultPath)},counts:result.counts,passed:result.passed,terminal:true,wholeSuitePassing:false};current.activeExecutionSessions=[];
}else{
 for(const pid of [started.runnerPid,started.supervisorPid])process.kill(pid,0);
 record={at,source:sourceRef,sessionId:55030,runnerPid:started.runnerPid,supervisorPid:started.supervisorPid,evidence:root+'/focused',terminal:false,wholeSuitePassing:false};
 current.activeExecutionSessions=[{...record,kind:'three residual regression fixes and current anchor check',verifiedLiveAt:at}];
}
const path=cp+'/'+(record.terminal?'SUCCESSOR_TERMINAL_ADDENDUM.json':'SUCCESSOR_STARTED_ADDENDUM.json');fs.writeFileSync(path,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
current.currentStagedCandidate={stage:root,source:sourceRef,review:source.review,buildPassed:false,installed:false};
current.pendingPartitionTenRepair.successor={source:sourceRef,evidence:{path,sha256:hash(path)},focusedPassed:record.passed??false,focusedStatus:record.terminal?(record.passed?'passed':'failed'):'running'};
current.lastUpdated=at;index.activeWork.updated=at;index.activeWork.lastUpdated=at;
current.next='Source7164 finished68/71,3 failures,0skips. Successorcf3 repairs three test-era mismatches; product/Review unchanged; current source verification '+(record.terminal?(record.passed?'passed.':'failed; inspect exact result.'):'running at the indexed handle.')+' Preserve installed quick review and isolated Atlas2c80143a. Full stock suite/build and any candidate installation remain open.';
index.next=current.next;current.beforeFurtherWork=current.next;saveIndex(index);console.log(JSON.stringify(record));
