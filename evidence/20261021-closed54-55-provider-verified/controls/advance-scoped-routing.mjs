// Reuse exact retained native receipts; do not rerun tests to refresh routing prose.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const c=json(process.argv[2]),site='F:/VisibleMedicine/website';
assert.equal(sha(read(c.previous)),c.previousSha256);assert(!fs.existsSync(c.root));
assert(c.root.startsWith('F:/VisibleMedicine/staging/20261021-')&&!c.root.includes('..'));
const old=json(c.previous);assert.equal(sha(read(old.originalInventory)),old.originalInventorySha256);
const inventory=json(old.originalInventory),receipts=[];
for(const r of [...old.receipts,...c.add]){
 assert.equal(sha(read(r.file)),r.fileSha256);const app=json(r.file),n=app.native??app;
 assert.equal(app.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');
 assert.equal(app.review,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');
 assert(app.sourceInputsUnchangedDuringRun===true||app.sourceInputsUnchanged===true);
 assert.equal(n.code,0);assert.equal(n.counts.fail,0);assert.equal(n.counts.cancelled,0);assert.equal(n.counts.skipped,0);
 assert.equal(sha(read(n.log)),n.logSha256);assert.equal(sha(read(app.sourceSnapshot)),app.sourceSnapshotSha256);
 const inputs=new Map(json(app.sourceSnapshot).map(row=>[row.path,row.sha256])),titles=new Map();
 for(const m of read(n.log).toString().matchAll(/^# Subtest: (.+)\r?$/gm))titles.set(m[1].trim(),(titles.get(m[1].trim())??0)+1);
 const roots=app.native?n.args.filter(p=>/^tests\/[A-Za-z0-9_.-]+\.test\.(?:ts|mjs)$/.test(p)):app.roots;
 receipts.push({stage:r.stage,file:r.file,fileSha256:r.fileSha256,at:n.at,counts:n.counts,roots,sourceSnapshot:app.sourceSnapshot,sourceSnapshotSha256:app.sourceSnapshotSha256,inputs,titles});
}
assert.equal(new Set(receipts.map(r=>r.file)).size,receipts.length);
const rows=inventory.failures.map(row=>{
 const current=sha(read(site+'/'+row.file));
 const candidates=receipts.filter(r=>r.roots.includes(row.file)&&r.inputs.get(row.file)===current).sort((a,b)=>b.at.localeCompare(a.at));
 const exact=candidates.find(r=>r.titles.get(row.title)===1),chosen=exact??candidates[0];
 return {originalNumber:row.number,file:row.file,title:row.title,originalTestSha256:row.testSha256,currentTestSha256:current,
 status:exact?'later-scoped-exact-title-pass':chosen?'later-root-pass-title-not-directly-comparable':'not-exercised-by-listed-complete-pass-runs',
 receipt:chosen?.file??null,receiptSha256:chosen?.fileSha256??null,fullSuiteResolved:false};
});
assert.equal(rows.length,87);
const report={schema:old.schema,at:new Date().toISOString(),previous:c.previous,previousSha256:c.previousSha256,
 originalInventory:old.originalInventory,originalInventorySha256:old.originalInventorySha256,originalCounts:inventory.counts,rows,
 receipts:receipts.map(({inputs,titles,...r})=>r),summary:Object.fromEntries([...new Set(rows.map(r=>r.status))].map(s=>[s,rows.filter(r=>r.status===s).length])),
 nextRoots:[...new Set(rows.filter(r=>r.status==='not-exercised-by-listed-complete-pass-runs').map(r=>r.file))],
 limits:'All87 original failure rows remain. Listed actual no-skip zero-failure scoped runs require matching current root bytes and unique original titles for exact routing. Source/dependency snapshots differ; this is neither current whole-suite proof, a resolved release inventory, nor subtraction from136full failures. No raw native logs or private data are included.',
 fullSuitePassingClaim:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.mkdirSync(c.root);fs.writeFileSync(c.root+'/ROUTING.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({report:c.root+'/ROUTING.json',sha256:sha(read(c.root+'/ROUTING.json')),summary:report.summary,nativeRerun:false,originalFailuresRetained:rows.length}));
