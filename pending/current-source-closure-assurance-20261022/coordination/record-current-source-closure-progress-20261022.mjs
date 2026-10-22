import assert from 'node:assert/strict';
import fs from 'node:fs';
import {json,read,sha} from './source-only-backup-20261019.mjs';
const root='F:/VisibleMedicine/staging/20261022-current-source-closure-assurance',v2=process.argv[2]==='v2',receipt=root+(v2?'/SOURCE_V2.json':'/SOURCE.json'),source=json(receipt),p=json('CURRENT_CHECKPOINT.json');
assert.equal(p.goal.status,'active');assert.equal(p.activeWork.current.ownerPreviewPolicy.websiteCutoverPermitted,false);
const goal=sha(Buffer.from(JSON.stringify(p.goal))),evidence=root+(v2?'/verification-v2':'/verification'),started=json(evidence+'/native.STARTED.json');
assert.equal(started.sourceReceiptSha256,sha(read(receipt)));assert.equal(source.changedPaths.length,11);assert.equal(source.sourcePaths,6417);
const plan={at:new Date().toISOString(),phase:'native-verification-in-flight',sourceReceipt:receipt,sourceReceiptSha256:sha(read(receipt)),sourcePaths:source.sourcePaths,
 changedTestRoots:source.changedPaths,productChanged:false,verification:evidence,nativePid:started.pid,tests:26,
 workersFinished:true,wholeSuitePassing:false,ownerPreviewChanged:false,canonicalInstalled:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false,
 next:'Finish the actual combined26-root native and full-type run before acceptance. Preserve any failed results; do not weaken historical/content/access assertions. The current owner preview is held unchanged. After coherent acceptance, checkpoint and begin the applicable broader release suite with an exact source receipt.'};
const planPath=root+(v2?'/PLAN_V2.json':'/PLAN.json');fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
p.activeWork.current.currentSourceClosureInFlight=plan;p.activeWork.current.activeExecutionSessions=[{kind:'native-and-types',pid:started.pid,evidence,sourceReceipt:receipt}];
p.activeWork.current.pendingWorkers=[];p.activeWork.updated=plan.at;assert.equal(sha(Buffer.from(JSON.stringify(p.goal))),goal);
fs.writeFileSync('CURRENT_CHECKPOINT.json',JSON.stringify(p,null,2)+'\n');console.log(JSON.stringify({receipt:planPath,sha256:sha(read(planPath)),nativePid:started.pid,previewChanged:false}));
