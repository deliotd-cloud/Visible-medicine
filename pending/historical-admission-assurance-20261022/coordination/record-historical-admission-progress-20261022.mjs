// Recoverable in-flight queue. It is not an integration or source-selection receipt.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-historical-admission-assurance',initial=root+'/tongue-initial/TERMINAL.json';
const terminal=json(initial);assert.equal(terminal.code,0);assert.deepEqual(terminal.commands[0].counts,{tests:4,pass:4,fail:0,cancelled:0,skipped:0,todo:0});
const pointer=json('CURRENT_CHECKPOINT.json');assert.equal(pointer.goal.status,'active');assert.equal(pointer.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const state={at:new Date().toISOString(),assembly:root,prepared:root+'/PREPARED.json',sourceSelectionUnchanged:true,
 tongueInitial:{receipt:initial,sha256:sha(read(initial)),sourceReceipt:terminal.sourceReceipt,sourceReceiptSha256:terminal.sourceReceiptSha256,counts:terminal.commands[0].counts},
 pendingWorkers:[{task:'/root/zero_registration_current_roles_1022',exclusiveStage:'F:/VisibleMedicine/staging/20261022-zero-registration-current-admission',scope:'Two zero-registration admission roots and new unique pure helpers only; no native jobs or candidate edits.'},
 {task:'/root/four_live_source_roles_1022',exclusiveStage:'F:/VisibleMedicine/staging/20261022-four-live-source-roles',scope:'Four independent source-role roots and unique pure witnesses only; no native jobs or candidate edits.'}],
 next:'Review completed proposals before composition; run combined original roots and mutation/history witnesses serially, then full TypeScript. No selected candidate or canonical preview cutover yet.',
 ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
pointer.activeWork.current.historicalAdmissionInFlight=state;pointer.activeWork.current.pendingWorkers=state.pendingWorkers;pointer.activeWork.current.activeExecutionSessions=[];
fs.writeFileSync(root+'/IN_FLIGHT.json',JSON.stringify(state,null,2)+'\n',{flag:'wx'});fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(pointer,null,2)+'\n');
console.log(JSON.stringify({receipt:root+'/IN_FLIGHT.json',tongueNative:state.tongueInitial.counts,workers:2,ownerPreviewChanged:false}));
