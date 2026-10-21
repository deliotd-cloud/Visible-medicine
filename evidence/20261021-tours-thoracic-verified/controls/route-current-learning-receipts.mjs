// Bounded routing aid only. Scoped receipts are not a current whole-suite result.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {read,json,sha} from './source-only-backup-20261019.mjs';
const site='F:/VisibleMedicine/website',base='F:/VisibleMedicine/staging/';
const original=base+'20261021-remaining-native-matrix/POST_MATRIX_TRIAGE.json';
assert.equal(sha(read(original)),'47964a18ec2c36f203a5863f29eff35a874b1494a71d80e73f6e1aad032780f6');
const inventory=json(original),root=base+'20261021-regression-routing-after-learning';assert(!fs.existsSync(root));
const names=['admission485-final','head-role-union','regional-link-role','short-ciliary-authored-epoch','clinical-imaging-role','limb-suprahyoid-role','corpus-current-epoch','shoulder-muscle-minimal','regional-tour-role','thoracic-teaching-role'];
const receipts=[];
for(const name of names){
 const stage=base+'20261021-'+name+'-application',file=stage+'/APPLICATION.json';assert(fs.existsSync(file),file);
 const app=json(file),n=app.native;assert.equal(app.source,'190a63238eadcf906abe89dcbb6a67c88afe70b9');assert.equal(app.review,'34c11463b3ae1ff1d603f3cf48dd86fa3f29f3bd34663d7200612d2fccb4e78f');
 assert.equal(app.sourceInputsUnchangedDuringRun,true);assert.equal(n.code,0);assert.equal(n.counts.fail,0);assert.equal(n.counts.skipped,0);assert.equal(n.counts.cancelled,0);
 assert(n.log.startsWith(stage+'/'));assert.equal(sha(read(n.log)),n.logSha256);assert.equal(sha(read(app.sourceSnapshot)),app.sourceSnapshotSha256);
 const inputs=new Map(json(app.sourceSnapshot).map(r=>[r.path,r.sha256]));
 const titles=new Map();for(const m of read(n.log).toString().matchAll(/^# Subtest: (.+)\r?$/gm))titles.set(m[1].trim(),(titles.get(m[1].trim())??0)+1);
 const roots=n.args.filter(p=>/^tests\/[A-Za-z0-9_.-]+\.test\.(?:ts|mjs)$/.test(p));
 receipts.push({stage,file,fileSha256:sha(read(file)),at:n.at,counts:n.counts,roots,inputs,titles});
}
const rows=inventory.failures.map(row=>{
 const current=sha(read(site+'/'+row.file));
 const candidates=receipts.filter(r=>r.roots.includes(row.file)&&r.inputs.get(row.file)===current).sort((a,b)=>b.at.localeCompare(a.at));
 const exact=candidates.find(r=>r.titles.get(row.title)===1),chosen=exact??candidates[0];
 return{originalNumber:row.number,file:row.file,title:row.title,originalTestSha256:row.testSha256,currentTestSha256:current,status:exact?'later-scoped-exact-title-pass':chosen?'later-root-pass-title-not-directly-comparable':'not-exercised-by-listed-complete-pass-runs',receipt:chosen?.file??null,receiptSha256:chosen?.fileSha256??null,fullSuiteResolved:false};
});
const report={schema:'visible-medicine.bounded-later-native-routing/1',at:new Date().toISOString(),originalInventory:original,originalInventorySha256:sha(read(original)),originalCounts:inventory.counts,rows,
 receipts:receipts.map(({inputs,titles,...r})=>r),summary:Object.fromEntries([...new Set(rows.map(r=>r.status))].map(s=>[s,rows.filter(r=>r.status===s).length])),
 nextRoots:[...new Set(rows.filter(r=>r.status==='not-exercised-by-listed-complete-pass-runs').map(r=>r.file))],
 limits:'All87 original failures remain recorded. Each later observation requires an actual zero-failure/no-skip run, matching current root bytes and (for exact status) a unique original title. Other roots and dependencies differ between snapshots; these are scoped past observations, not a final-candidate whole-suite proof, resolved release inventory or arithmetic reduction of136full failures. No scans/masks or raw native logs included.',fullSuitePassingClaim:false,clinicalApproval:false,spatialRegistration:false,publicDeployment:false};
fs.mkdirSync(root);fs.writeFileSync(root+'/ROUTING.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({report:root+'/ROUTING.json',sha256:sha(read(root+'/ROUTING.json')),summary:report.summary,nextRoots:report.nextRoots,originalFailuresRetained:rows.length,fullSuitePassingClaim:false}));
