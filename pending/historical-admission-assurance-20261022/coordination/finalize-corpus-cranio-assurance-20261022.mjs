// Local coordination after the verified source-only checkpoint.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/recovery/checkpoints/20261022-corpus-cranio-assurance-verified',cp=json(root+'/checkpoint.json');
const p=json('CURRENT_CHECKPOINT.json'),before=json(root+'/pointer.before.json');assert.equal(p.goal.status,'active');assert.deepEqual(p.goal,before.goal);
assert.equal(p.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
assert.equal(p.activeWork.current.sourceReceipt,cp.sourceReceipt);assert(cp.sourceBackup.independentlyVerified);
assert.deepEqual(p.activeWork.current.activeExecutionSessions,[]);assert.deepEqual(p.activeWork.current.pendingWorkers,[]);
const map=read('WORKSPACE_MAP.md').toString(),marker='## Previous: installed-source checklist reconciled in a separate draft; preview held — 22 October 2026';
const at=map.indexOf(marker);assert(at>0);assert.deepEqual(Buffer.from(map.slice(at).replace(marker,marker.replace('## Previous:','## Current:'))),read(root+'/WORKSPACE_MAP.before.md'));
const master='F:/VisibleMedicine/website/docs/master-plan.md',text=read(master).toString(),start=text.indexOf('Latest release-assurance coordination, 22 October:'),end=text.indexOf('Latest tracking coordination, 22 October:',start+1);
assert(start>0&&end>start);assert.deepEqual(Buffer.from(text.slice(0,start)+text.slice(end)),read(root+'/master-plan.before.md'));
const source=json(cp.sourceReceipt);for(const row of source.sourceRows)assert.equal(sha(read(source.website+'/'+row.path)),row.sha256,row.path);
const draftRoot='F:/VisibleMedicine/staging/20261022-checklist-installed-reconciliation';
for(const p of ['docs/completion-checklist.json','docs/completion-checklist.md','scripts/refresh-completion-checklist.mjs'])assert.deepEqual(read('F:/VisibleMedicine/website/'+p),read(draftRoot+'/preimages/'+p.split('/').at(-1)));
const state={at:new Date().toISOString(),checkpointSha256:sha(read(root+'/checkpoint.json')),mapSha256:sha(read('WORKSPACE_MAP.md')),masterPlanSha256:sha(read(master)),
 fullPrecedingMapAndMasterPlanPreserved:true,canonicalTrackingUnchanged:true,goalUnchangedAndActive:true,noActiveJobsOrWorkers:true,normalPreviewChanged:false,
 filteredSourceBackupIndependentlyVerified:true,laterCoordinationLocalOnly:true,wholeSuitePassing:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
p.activeWork.current.localCoordination=state;fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');
fs.writeFileSync(root+'/COORDINATION.json',JSON.stringify({...state,pointerSha256:sha(read('CURRENT_CHECKPOINT.json'))},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({receipt:root+'/COORDINATION.json',sha256:sha(read(root+'/COORDINATION.json')),goalStatus:p.goal.status,normalPreviewChanged:false}));
