// Read-only reconciliation of original failures with already retained scoped runs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',base='F:/VisibleMedicine/staging/';
const previous=base+'20261021-regression-routing-after-learning/ROUTING.json';
assert.equal(sha(read(previous)),'81ff114ee870e60318fcad2c678dc87fa38745cb379c272e44f4807015b753b9');
const old=json(previous),inventory=json(old.originalInventory);
assert.equal(sha(read(old.originalInventory)),old.originalInventorySha256);
const root=base+'20261021-regression-routing-head-followthrough';
assert(!fs.existsSync(root));
const receipts=old.receipts.map(r=>{
 assert.equal(sha(read(r.file)),r.fileSha256);
 const app=json(r.file),n=app.native;
 return {...r,n,snapshot:app.sourceSnapshot,snapshotSha256:app.sourceSnapshotSha256};
});
const cameraFile=base+'20261021-tour-camera-current-verification/RESULT.json',camera=json(cameraFile);
assert.equal(camera.sourceInputsUnchanged,true);assert.equal(camera.inputError,null);
receipts.push({stage:base+'20261021-tour-camera-current-verification',file:cameraFile,
 fileSha256:sha(read(cameraFile)),at:camera.at,counts:camera.counts,roots:camera.roots,
 n:camera,snapshot:camera.sourceSnapshot,snapshotSha256:camera.sourceSnapshotSha256});
for(const r of receipts){
 const document=json(r.file),n=r.n;
 assert.equal(document.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(document.review,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');
 assert.equal(n.code,0);assert.equal(n.counts.fail,0);assert.equal(n.counts.skipped,0);assert.equal(n.counts.cancelled,0);
 assert(n.log.startsWith(r.stage+'/'));assert.equal(sha(read(n.log)),n.logSha256);
 assert.equal(sha(read(r.snapshot)),r.snapshotSha256);
 r.inputs=new Map(json(r.snapshot).map(row=>[row.path,row.sha256]));
 r.titles=new Map();for(const m of read(n.log).toString().matchAll(/^# Subtest: (.+)\r?$/gm))r.titles.set(m[1].trim(),(r.titles.get(m[1].trim())??0)+1);
}
const rows=inventory.failures.map(row=>{
 const current=sha(read(site+'/'+row.file));
 const candidates=receipts.filter(r=>r.roots.includes(row.file)&&r.inputs.get(row.file)===current).sort((a,b)=>b.at.localeCompare(a.at));
 const exact=candidates.find(r=>r.titles.get(row.title)===1),chosen=exact??candidates[0];
 return {originalNumber:row.number,file:row.file,title:row.title,originalTestSha256:row.testSha256,
 currentTestSha256:current,status:exact?'later-scoped-exact-title-pass':chosen?'later-root-pass-title-not-directly-comparable':'not-exercised-by-listed-complete-pass-runs',
 receipt:chosen?.file??null,receiptSha256:chosen?.fileSha256??null,fullSuiteResolved:false};
});
assert.equal(rows.length,87);
const report={schema:old.schema,at:new Date().toISOString(),previous,previousSha256:sha(read(previous)),
 originalInventory:old.originalInventory,originalInventorySha256:old.originalInventorySha256,originalCounts:inventory.counts,rows,
 receipts:receipts.map(({n,snapshot,snapshotSha256,inputs,titles,...r})=>({...r,sourceSnapshot:snapshot,sourceSnapshotSha256:snapshotSha256})),
 summary:Object.fromEntries([...new Set(rows.map(r=>r.status))].map(s=>[s,rows.filter(r=>r.status===s).length])),
 nextRoots:[...new Set(rows.filter(r=>r.status==='not-exercised-by-listed-complete-pass-runs').map(r=>r.file))],
 limits:old.limits+' The already retained17/17 camera/tour observation is now explicitly routed without rerunning unchanged checks. No new native result is claimed.',
 fullSuitePassingClaim:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.mkdirSync(root);fs.writeFileSync(root+'/ROUTING.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({report:root+'/ROUTING.json',sha256:sha(read(root+'/ROUTING.json')),summary:report.summary,originalFailuresRetained:rows.length,nativeRerun:false}));
